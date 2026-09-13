const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const packageJson = require("../package.json");
const {
  AI_TOOLS,
  DEFAULT_KIT_ID,
  SOURCE_ROOT,
  WORKFLOW_KITS,
} = require("./config");
const {
  buildManagedFiles,
  isAllowedManagedPath,
  isLegacyManagedPath,
} = require("./managed-files");
const { resolveSkills } = require("./skills");

const SCHEMA_VERSION = 1;
const STATE_PATH = ".ai-workflow/installed.json";
const HASH_PATTERN = /^sha256:[a-f0-9]{64}$/;
const VALID_SCOPES = new Set(["repository", "codex-global", "claude-global"]);

function hashBytes(bytes) {
  return `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`;
}

function validateRelativePath(relativePath) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    throw new Error("Managed path must be a non-empty string");
  }
  if (
    path.posix.isAbsolute(relativePath) ||
    path.win32.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    path.posix.normalize(relativePath) !== relativePath ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`Unsafe managed path: ${relativePath}`);
  }
  return relativePath;
}

function isInside(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

function lstatIfPresent(targetPath) {
  try {
    return fs.lstatSync(targetPath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function managedSymlinkError(scope, relativePath, dangling = false) {
  return new Error(
    dangling
      ? `Managed path escapes ${scope} through a dangling symlink: ${relativePath}`
      : `Managed path uses a symlink: ${relativePath}`
  );
}


function scopeRoot(scope, repositoryRoot = process.cwd(), home = os.homedir()) {
  if (scope === "repository") return path.resolve(repositoryRoot);
  if (scope === "codex-global") return path.resolve(home, ".codex");
  if (scope === "claude-global") return path.resolve(home, ".claude");
  throw new Error(`Invalid managed scope: ${scope}`);
}

function resolveManagedPath(scope, relativePath, roots = {}) {
  validateRelativePath(relativePath);
  const root = scopeRoot(scope, roots.repositoryRoot, roots.home);
  const target = path.resolve(root, ...relativePath.split("/"));
  if (!isInside(root, target)) {
    throw new Error(`Managed path escapes ${scope}: ${relativePath}`);
  }

  const rootStat = lstatIfPresent(root);
  if (rootStat?.isSymbolicLink()) {
    let dangling = false;
    try {
      fs.realpathSync(root);
    } catch (error) {
      dangling = error.code === "ENOENT";
    }
    throw managedSymlinkError(scope, relativePath, dangling);
  }
  const canonicalRoot = rootStat ? fs.realpathSync(root) : root;
  let current = root;
  for (const component of relativePath.split("/")) {
    current = path.join(current, component);
    const stat = lstatIfPresent(current);
    if (!stat) continue;
    if (stat.isSymbolicLink()) {
      let canonicalCurrent;
      try {
        canonicalCurrent = fs.realpathSync(current);
      } catch (error) {
        throw managedSymlinkError(scope, relativePath, error.code === "ENOENT");
      }
      if (!isInside(canonicalRoot, canonicalCurrent)) {
        throw new Error(`Managed path escapes ${scope} through a symlink: ${relativePath}`);
      }
      throw managedSymlinkError(scope, relativePath);
    }
    const canonicalCurrent = fs.realpathSync(current);
    if (!isInside(canonicalRoot, canonicalCurrent)) {
      throw new Error(`Managed path escapes ${scope} through a symlink: ${relativePath}`);
    }
  }
  return target;
}

function ensureSafeDirectory(directory, scope, roots) {
  const root = scopeRoot(scope, roots.repositoryRoot, roots.home);
  if (!fs.existsSync(root)) {
    const parent = path.dirname(root);
    if (!fs.existsSync(parent)) {
      throw new Error(`Managed scope parent does not exist: ${parent}`);
    }
    fs.mkdirSync(root);
  }

  const relativeDirectory = path.relative(root, directory);
  if (!relativeDirectory) return;
  const portableDirectory = relativeDirectory.split(path.sep).join("/");
  validateRelativePath(portableDirectory);

  let current = root;
  for (const component of relativeDirectory.split(path.sep)) {
    current = path.join(current, component);
    resolveManagedPath(scope, path.relative(root, current).split(path.sep).join("/"), roots);
    if (fs.existsSync(current)) {
      if (!fs.statSync(current).isDirectory()) {
        throw new Error(`Managed parent is not a directory: ${current}`);
      }
    } else {
      fs.mkdirSync(current);
    }
  }
}

function writeFileAtomic(targetPath, bytes, mode, scope, relativePath, roots) {
  ensureSafeDirectory(path.dirname(targetPath), scope, roots);
  resolveManagedPath(scope, relativePath, roots);
  const temporaryPath = path.join(
    path.dirname(targetPath),
    `.${path.basename(targetPath)}.tmp-${process.pid}-${crypto.randomBytes(6).toString("hex")}`
  );
  let descriptor;
  try {
    descriptor = fs.openSync(temporaryPath, "wx", mode || 0o644);
    fs.writeFileSync(descriptor, bytes);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.chmodSync(temporaryPath, mode || 0o644);
    fs.renameSync(temporaryPath, targetPath);
  } catch (error) {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    try {
      fs.unlinkSync(temporaryPath);
    } catch (_) {
      // The temporary file may not have been created or may already have been renamed.
    }
    throw error;
  }
}

function readLocalFile(targetPath) {
  const lstat = lstatIfPresent(targetPath);
  if (!lstat) return { exists: false, hash: null };
  if (lstat.isSymbolicLink()) return { exists: true, hash: null, symlink: true };
  if (!lstat.isFile()) return { exists: true, hash: null };
  const bytes = fs.readFileSync(targetPath);
  return { exists: true, hash: hashBytes(bytes) };
}

function validateStringArray(value, field) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error(`Invalid installed state field: ${field}`);
  }
  if (new Set(value).size !== value.length) {
    throw new Error(`Installed state field contains duplicates: ${field}`);
  }
}

function validateInstalledState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("Invalid installed state: expected an object");
  }
  if (state.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported installed state schema: ${state.schemaVersion}`);
  }
  if (typeof state.packageVersion !== "string" || state.packageVersion.length === 0) {
    throw new Error("Invalid installed state field: packageVersion");
  }
  if (!WORKFLOW_KITS.some((kit) => kit.id === state.kit)) {
    throw new Error(`Invalid installed kit: ${state.kit}`);
  }
  validateStringArray(state.runtimes, "runtimes");
  validateStringArray(state.skills, "skills");
  const validRuntimes = new Set(AI_TOOLS.map((tool) => tool.id));
  state.runtimes.forEach((runtime) => {
    if (!validRuntimes.has(runtime)) throw new Error(`Invalid installed runtime: ${runtime}`);
  });
  if (!Array.isArray(state.files)) throw new Error("Invalid installed state field: files");

  const keys = new Set();
  state.files.forEach((file) => {
    if (!file || typeof file !== "object" || Array.isArray(file)) {
      throw new Error("Invalid installed file record");
    }
    if (!VALID_SCOPES.has(file.scope)) throw new Error(`Invalid managed scope: ${file.scope}`);
    validateRelativePath(file.path);
    if (!isAllowedManagedPath(file.scope, file.path)) {
      throw new Error(`Installed state references an unmanaged path: ${file.scope}:${file.path}`);
    }
    if (!HASH_PATTERN.test(file.hash)) {
      throw new Error(`Invalid installed hash for ${file.scope}:${file.path}`);
    }
    if (file.scope === "codex-global" && !state.runtimes.includes("codex")) {
      throw new Error("Codex global instructions are not selected by installed state");
    }
    if (file.scope === "claude-global" && !state.runtimes.includes("claude")) {
      throw new Error("Claude global instructions are not selected by installed state");
    }
    const key = `${file.scope}:${file.path}`;
    if (keys.has(key)) throw new Error(`Duplicate installed file record: ${key}`);
    keys.add(key);
  });
  return state;
}

function stateTarget(roots) {
  return resolveManagedPath("repository", STATE_PATH, roots);
}

function readInstalledState(roots) {
  const target = stateTarget(roots);
  if (!fs.existsSync(target)) return { state: null, bytes: null };
  let bytes;
  try {
    bytes = fs.readFileSync(target);
  } catch (error) {
    throw new Error(`Cannot read ${STATE_PATH}: ${error.message}`);
  }
  let state;
  try {
    state = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`Invalid ${STATE_PATH}: ${error.message}`);
  }
  return { state: validateInstalledState(state), bytes };
}

function serializedState({ kitId, runtimeIds, skillIds, files }) {
  return Buffer.from(`${JSON.stringify({
    schemaVersion: SCHEMA_VERSION,
    packageVersion: packageJson.version,
    kit: kitId,
    runtimes: runtimeIds,
    skills: skillIds,
    files: [...files]
      .sort((left, right) => {
        const scopeOrder = left.scope.localeCompare(right.scope);
        return scopeOrder || left.path.localeCompare(right.path);
      })
      .map(({ scope, path: filePath, hash }) => ({ scope, path: filePath, hash })),
  }, null, 2)}\n`);
}

function writeInstalledState(stateBytes, previousBytes, roots) {
  const target = stateTarget(roots);
  const current = fs.existsSync(target) ? fs.readFileSync(target) : null;
  if (
    (previousBytes === null && current !== null) ||
    (previousBytes !== null && (current === null || !current.equals(previousBytes)))
  ) {
    throw new Error(`${STATE_PATH} changed while the command was running`);
  }
  writeFileAtomic(target, stateBytes, 0o600, "repository", STATE_PATH, roots);
}

function parseUpdateSelection(args) {
  const selectionArgs = args.filter((arg) => arg !== "--apply");
  const allowedFlags = new Set(["--all", "--tool", "--kit", "--skill", "--bundle"]);
  for (let index = 0; index < selectionArgs.length; index += 1) {
    const flag = selectionArgs[index];
    if (!allowedFlags.has(flag)) throw new Error(`Unknown update option: ${flag}`);
    if (flag !== "--all") {
      if (!selectionArgs[index + 1] || selectionArgs[index + 1].startsWith("--")) {
        throw new Error(`Missing value for ${flag}`);
      }
      index += 1;
    }
  }

  const kitIndex = selectionArgs.indexOf("--kit");
  const kitId = kitIndex === -1 ? DEFAULT_KIT_ID : selectionArgs[kitIndex + 1];
  if (!WORKFLOW_KITS.some((kit) => kit.id === kitId)) throw new Error(`Unknown kit: ${kitId}`);

  let runtimeIds = null;
  if (selectionArgs.includes("--all")) {
    runtimeIds = AI_TOOLS.map((tool) => tool.id);
  } else {
    const toolIndex = selectionArgs.indexOf("--tool");
    if (toolIndex !== -1) {
      const runtime = selectionArgs[toolIndex + 1];
      if (!AI_TOOLS.some((tool) => tool.id === runtime)) throw new Error(`Unknown tool: ${runtime}`);
      runtimeIds = [runtime];
    }
  }

  const repeatedValues = (flag) => {
    const values = [];
    for (let index = 0; index < selectionArgs.length; index += 1) {
      if (selectionArgs[index] === flag) values.push(selectionArgs[index + 1]);
    }
    return [...new Set(values)];
  };
  const extraSkills = repeatedValues("--skill");
  const extraBundles = repeatedValues("--bundle");
  const { skillIds } = resolveSkills({ sourceRoot: SOURCE_ROOT, kitId, extraSkills, extraBundles });
  return { kitId, runtimeIds, skillIds, explicit: selectionArgs.length > 0 };
}

function inferRuntimeIds(kitId, skillIds, roots) {
  const commonFiles = buildManagedFiles({
    sourceRoot: SOURCE_ROOT,
    kitId,
    runtimeIds: [],
    skillIds,
  });
  return AI_TOOLS.map((tool) => tool.id).filter((runtime) => {
    const candidateFiles = buildManagedFiles({
      sourceRoot: SOURCE_ROOT,
      kitId,
      runtimeIds: [runtime],
      skillIds,
    });
    return [...candidateFiles.entries()].some(([key, file]) => {
      if (commonFiles.has(key)) return false;
      const target = resolveManagedPath(file.scope, file.path, roots);
      const local = readLocalFile(target);
      return local.hash === hashBytes(file.bytes);
    });
  });
}

function selectionForUpdate(state, args, roots) {
  const parsed = parseUpdateSelection(args);
  if (state) {
    if (parsed.explicit) {
      const requestedRuntimes = parsed.runtimeIds || state.runtimes;
      if (
        parsed.kitId !== state.kit ||
        requestedRuntimes.join("\0") !== state.runtimes.join("\0") ||
        parsed.skillIds.join("\0") !== state.skills.join("\0")
      ) {
        throw new Error("Update selection does not match installed state");
      }
    }
    return { kitId: state.kit, runtimeIds: state.runtimes, skillIds: state.skills };
  }

  const runtimeIds = parsed.runtimeIds || inferRuntimeIds(parsed.kitId, parsed.skillIds, roots);
  return { kitId: parsed.kitId, runtimeIds, skillIds: parsed.skillIds };
}

function planUpdate(state, selection, roots) {
  const desiredFiles = buildManagedFiles({
    sourceRoot: SOURCE_ROOT,
    kitId: selection.kitId,
    runtimeIds: selection.runtimeIds,
    skillIds: selection.skillIds,
  });
  const recordedFiles = new Map(
    (state ? state.files : []).map((file) => [`${file.scope}:${file.path}`, file])
  );
  const actions = [];

  [...desiredFiles.entries()].sort(([left], [right]) => left.localeCompare(right)).forEach(([key, desired]) => {
    const target = resolveManagedPath(desired.scope, desired.path, roots);
    const local = readLocalFile(target);
    const recorded = recordedFiles.get(key);
    const desiredHash = hashBytes(desired.bytes);
    recordedFiles.delete(key);

    if (local.hash === desiredHash) {
      actions.push({ type: "unchanged", key, desired, desiredHash, recorded, target });
    } else if (!local.exists && !recorded) {
      actions.push({ type: "add", key, desired, desiredHash, recorded, target });
    } else if (recorded && local.hash === recorded.hash) {
      actions.push({ type: "update", key, desired, desiredHash, recorded, target });
    } else if (recorded) {
      actions.push({ type: "local", key, desired, desiredHash, recorded, target });
    } else {
      actions.push({ type: "unknown", key, desired, desiredHash, recorded, target });
    }
  });

  [...recordedFiles.entries()].sort(([left], [right]) => left.localeCompare(right)).forEach(([key, recorded]) => {
    const target = resolveManagedPath(recorded.scope, recorded.path, roots);
    const local = readLocalFile(target);
    if (isLegacyManagedPath(recorded.scope, recorded.path)) {
      actions.push({
        type: "legacy",
        key,
        recorded,
        target,
        alreadyAbsent: !local.exists,
      });
      return;
    }
    actions.push({
      type: !local.exists || local.hash === recorded.hash ? "retire" : "local",
      key,
      recorded,
      target,
      retirement: true,
      alreadyAbsent: !local.exists,
    });
  });
  return actions;
}

const ACTION_LABELS = {
  add: "ADD",
  update: "UPDATE",
  retire: "RETIRE",
  unchanged: "UNCHANGED",
  local: "SKIP LOCAL",
  unknown: "SKIP UNKNOWN",
  legacy: "PRESERVE LEGACY",
};

function printPlan(actions, apply) {
  actions.forEach((action) => {
    const suffix = action.alreadyAbsent ? " (already absent)" : "";
    console.log(`${ACTION_LABELS[action.type]} ${action.key}${suffix}`);
  });
  const counts = Object.fromEntries(
    Object.keys(ACTION_LABELS).map((type) => [type, actions.filter((action) => action.type === type).length])
  );
  console.log(
    `${apply ? "Applied" : "Dry run"}: ` +
    `add=${counts.add} update=${counts.update} retire=${counts.retire} ` +
    `unchanged=${counts.unchanged} local=${counts.local} unknown=${counts.unknown}`
  );
}

function assertActionStillSafe(action) {
  const local = readLocalFile(action.target);
  if (action.type === "add" && local.exists) {
    throw new Error(`Target changed before add: ${action.key}`);
  }
  if (action.type === "update" && local.hash !== action.recorded.hash) {
    throw new Error(`Target changed before update: ${action.key}`);
  }
  if (action.type === "retire") {
    if (action.alreadyAbsent && local.exists) {
      throw new Error(`Target changed before retirement: ${action.key}`);
    }
    if (!action.alreadyAbsent && local.hash !== action.recorded.hash) {
      throw new Error(`Target changed before retirement: ${action.key}`);
    }
  }
}

function applyPlan(actions, selection, previousStateBytes, roots) {
  actions.forEach((action) => {
    if (action.type === "add" || action.type === "update") {
      assertActionStillSafe(action);
      writeFileAtomic(
        action.target,
        action.desired.bytes,
        action.desired.mode,
        action.desired.scope,
        action.desired.path,
        roots
      );
    } else if (action.type === "retire") {
      assertActionStillSafe(action);
      if (!action.alreadyAbsent) fs.unlinkSync(action.target);
    }
  });

  const nextFiles = [];
  actions.forEach((action) => {
    if (["add", "update", "unchanged", "legacy"].includes(action.type)) {
      nextFiles.push({
        scope: action.desired?.scope || action.recorded.scope,
        path: action.desired?.path || action.recorded.path,
        hash: action.desiredHash || action.recorded.hash,
      });
    } else if (action.type === "local" && action.recorded) {
      nextFiles.push(action.recorded);
    }
  });
  const bytes = serializedState({
    ...selection,
    files: nextFiles,
  });
  writeInstalledState(bytes, previousStateBytes, roots);
}

function runUpdate(args = process.argv.slice(3), options = {}) {
  const roots = {
    repositoryRoot: options.repositoryRoot || process.cwd(),
    home: options.home || os.homedir(),
  };
  const apply = args.includes("--apply");
  const { state, bytes: stateBytes } = readInstalledState(roots);
  const selection = selectionForUpdate(state, args, roots);
  const actions = planUpdate(state, selection, roots);
  if (apply) applyPlan(actions, selection, stateBytes, roots);
  printPlan(actions, apply);
  return actions;
}

function recordInstallation({ kitId, runtimeIds, skillIds }, options = {}) {
  const roots = {
    repositoryRoot: options.repositoryRoot || process.cwd(),
    home: options.home || os.homedir(),
  };
  const { state: previousState, bytes: previousBytes } = readInstalledState(roots);
  const desiredFiles = buildManagedFiles({
    sourceRoot: SOURCE_ROOT,
    kitId,
    runtimeIds,
    skillIds,
  });
  const previousFiles = new Map(
    (previousState ? previousState.files : []).map((file) => [`${file.scope}:${file.path}`, file])
  );
  const files = [];

  desiredFiles.forEach((desired, key) => {
    const target = resolveManagedPath(desired.scope, desired.path, roots);
    const local = readLocalFile(target);
    const desiredHash = hashBytes(desired.bytes);
    if (local.hash === desiredHash) {
      files.push({ scope: desired.scope, path: desired.path, hash: desiredHash });
    } else if (previousFiles.has(key)) {
      files.push(previousFiles.get(key));
    }
  });

  const bytes = serializedState({ kitId, runtimeIds, skillIds, files });
  writeInstalledState(bytes, previousBytes, roots);
}

module.exports = {
  SCHEMA_VERSION,
  STATE_PATH,
  hashBytes,
  recordInstallation,
  resolveManagedPath,
  runUpdate,
  validateInstalledState,
};
