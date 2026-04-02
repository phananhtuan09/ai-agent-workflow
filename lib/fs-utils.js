const {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} = require("fs");
const path = require("path");

function ensureDir(dirPath) {
  mkdirSync(dirPath, { recursive: true });
}

function isSamePath(left, right) {
  return path.resolve(left) === path.resolve(right);
}

function copyFileForce(sourceFile, destFile) {
  if (isSamePath(sourceFile, destFile)) {
    return;
  }

  ensureDir(path.dirname(destFile));
  copyFileSync(sourceFile, destFile);
  chmodSync(destFile, statSync(sourceFile).mode);
}

function copyDirectory(sourceDir, destDir) {
  if (!existsSync(sourceDir) || isSamePath(sourceDir, destDir)) {
    return;
  }

  ensureDir(destDir);

  readdirSync(sourceDir, { withFileTypes: true }).forEach((entry) => {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
      return;
    }

    if (entry.isFile()) {
      copyFileForce(sourcePath, destPath);
    }
  });
}

function copyDirectoryContents(sourceDir, destDir) {
  if (!existsSync(sourceDir) || isSamePath(sourceDir, destDir)) {
    return;
  }

  ensureDir(destDir);

  readdirSync(sourceDir, { withFileTypes: true }).forEach((entry) => {
    const sourcePath = path.join(sourceDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destPath);
      return;
    }

    if (entry.isFile()) {
      copyFileForce(sourcePath, destPath);
    }
  });
}

function replaceDirectory(sourceDir, destDir) {
  if (!existsSync(sourceDir) || isSamePath(sourceDir, destDir)) {
    return;
  }

  if (existsSync(destDir)) {
    rmSync(destDir, { recursive: true, force: true });
  }

  copyDirectory(sourceDir, destDir);
}

function readJsonFile(filePath, fallback = {}) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (_) {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  ensureDir(path.dirname(filePath));
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function backupFileIfExists(filePath) {
  if (!existsSync(filePath)) return null;

  const now = new Date();
  const ts = now
    .toISOString()
    .replace(/[-:T]/g, "")
    .slice(0, 15);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const dir = path.dirname(filePath);
  const backupPath = path.join(dir, `${base}_${ts}${ext}`);

  copyFileSync(filePath, backupPath);
  return backupPath;
}

module.exports = {
  backupFileIfExists,
  copyDirectoryContents,
  copyFileForce,
  ensureDir,
  readJsonFile,
  replaceDirectory,
  writeJsonFile,
};
