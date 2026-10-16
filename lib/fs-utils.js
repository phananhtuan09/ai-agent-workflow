const crypto = require("crypto");
const {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  renameSync,
  rmSync,
} = require("fs");
const path = require("path");

function isWithin(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${path.sep}`);
}

function getLstat(filePath) {
  try {
    return lstatSync(filePath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function assertNoSymlinkInPath(filePath, safeRoot = process.cwd()) {
  const root = path.resolve(safeRoot);
  let current = path.resolve(filePath);
  if (!isWithin(root, current)) return;
  while (true) {
    const stat = getLstat(current);
    if (stat && stat.isSymbolicLink()) {
      throw new Error(`Refusing to write through symlink: ${filePath}`);
    }
    if (current === root) return;
    current = path.dirname(current);
  }
}

function ensureDir(dirPath, safeRoot = process.cwd()) {
  assertNoSymlinkInPath(dirPath, safeRoot);
  mkdirSync(dirPath, { recursive: true });
}

function isSamePath(left, right) {
  return path.resolve(left) === path.resolve(right);
}

function assertRegularSource(sourceFile) {
  const sourceStat = getLstat(sourceFile);
  if (!sourceStat || !sourceStat.isFile() || sourceStat.isSymbolicLink()) {
    throw new Error(`Managed source must be a regular file: ${sourceFile}`);
  }
  return sourceStat;
}

function copyFileForce(sourceFile, destFile, safeRoot = process.cwd()) {
  if (isSamePath(sourceFile, destFile)) return;

  const sourceStat = assertRegularSource(sourceFile);
  assertNoSymlinkInPath(path.dirname(destFile), safeRoot);
  ensureDir(path.dirname(destFile), safeRoot);
  assertNoSymlinkInPath(destFile, safeRoot);

  const temporaryPath = path.join(
    path.dirname(destFile),
    `.${path.basename(destFile)}.tmp-${process.pid}-${crypto.randomBytes(6).toString("hex")}`
  );
  try {
    copyFileSync(sourceFile, temporaryPath);
    chmodSync(temporaryPath, sourceStat.mode & 0o777);
    renameSync(temporaryPath, destFile);
  } catch (error) {
    try {
      rmSync(temporaryPath, { force: true });
    } catch (_) {
      // The temporary file may not have been created or may already be gone.
    }
    throw error;
  }
}

function copyDirectory(sourceDir, destDir, safeRoot = process.cwd()) {
  if (!existsSync(sourceDir) || isSamePath(sourceDir, destDir)) return;

  assertNoSymlinkInPath(destDir, safeRoot);
  ensureDir(destDir, safeRoot);
  readdirSync(sourceDir, { withFileTypes: true }).forEach((entry) => {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath, safeRoot);
    } else if (entry.isFile()) {
      copyFileForce(sourcePath, destPath, safeRoot);
    }
  });
}

function copyDirectoryContents(sourceDir, destDir, safeRoot = process.cwd()) {
  if (!existsSync(sourceDir) || isSamePath(sourceDir, destDir)) return;

  assertNoSymlinkInPath(destDir, safeRoot);
  ensureDir(destDir, safeRoot);
  readdirSync(sourceDir, { withFileTypes: true }).forEach((entry) => {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath, safeRoot);
    } else if (entry.isFile()) {
      copyFileForce(sourcePath, destPath, safeRoot);
    }
  });
}

module.exports = {
  copyDirectoryContents,
  copyFileForce,
  ensureDir,
};
