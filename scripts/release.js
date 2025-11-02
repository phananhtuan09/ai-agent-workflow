#!/usr/bin/env node

/**
 * Release script for ai-workflow-init
 * Cross-platform Node.js alternative to release.sh
 * 
 * Usage:
 *   node scripts/release.js [patch|minor|major]
 *   or
 *   npm run release:js [patch|minor|major]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function printStep(msg) {
  console.log(`${colors.cyan}▶ ${msg}${colors.reset}`);
}

function printSuccess(msg) {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
}

function printError(msg) {
  console.log(`${colors.red}✗ ${msg}${colors.reset}`);
}

function printWarning(msg) {
  console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function runCommand(cmd, options = {}) {
  try {
    execSync(cmd, { stdio: 'inherit', ...options });
    return true;
  } catch (e) {
    return false;
  }
}

function getCurrentVersion() {
  const pkgPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  return pkg.version;
}

function isGitRepo() {
  return runCommand('git rev-parse --git-dir > /dev/null 2>&1', { stdio: 'pipe' });
}

function hasUncommittedChanges() {
  try {
    execSync('git diff-index --quiet HEAD --', { stdio: 'pipe' });
    return false;
  } catch {
    return true;
  }
}

function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function isNpmLoggedIn() {
  try {
    execSync('npm whoami', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // Check if we're in a git repository
  if (!isGitRepo()) {
    printError('Not a git repository. Please initialize git first.');
    process.exit(1);
  }

  // Check for uncommitted changes
  if (hasUncommittedChanges()) {
    printWarning('You have uncommitted changes.');
    const answer = await question('Do you want to commit them first? (y/n) ');
    if (answer.toLowerCase() === 'y') {
      runCommand('git add .');
      const commitMsg = await question('Commit message: ');
      runCommand(`git commit -m "${commitMsg}"`);
    } else {
      printError('Please commit or stash your changes first.');
      process.exit(1);
    }
  }

  // Check branch
  const currentBranch = getCurrentBranch();
  if (currentBranch !== 'main' && currentBranch !== 'master') {
    printWarning(`You're not on main/master branch. Current branch: ${currentBranch}`);
    const answer = await question('Continue anyway? (y/n) ');
    if (answer.toLowerCase() !== 'y') {
      process.exit(1);
    }
  }

  // Get current version
  const currentVersion = getCurrentVersion();
  printStep(`Current version: ${currentVersion}`);

  // Get version type
  const versionTypeArg = process.argv[2];
  let versionType;

  if (versionTypeArg && ['patch', 'minor', 'major'].includes(versionTypeArg)) {
    versionType = versionTypeArg;
  } else {
    console.log('Select version bump type:');
    console.log('1) patch (1.1.0 → 1.1.1) - bug fixes');
    console.log('2) minor (1.1.0 → 1.2.0) - new features, backward compatible');
    console.log('3) major (1.1.0 → 2.0.0) - breaking changes');
    const choice = await question('Enter choice [1-3]: ');

    switch (choice) {
      case '1':
        versionType = 'patch';
        break;
      case '2':
        versionType = 'minor';
        break;
      case '3':
        versionType = 'major';
        break;
      default:
        printError('Invalid choice');
        process.exit(1);
    }
  }

  printStep(`Bumping version: ${versionType}`);

  // Bump version
  runCommand(`npm version ${versionType} --no-git-tag-version`);

  // Get new version
  const newVersion = getCurrentVersion();
  printSuccess(`Version bumped: ${currentVersion} → ${newVersion}`);

  // Get release message
  const releaseMsg = await question('Release message (optional): ') || `Release v${newVersion}`;

  // Commit version bump
  printStep('Committing version bump...');
  runCommand('git add package.json package-lock.json');
  runCommand(`git commit -m "chore: bump version to ${newVersion}\n\n${releaseMsg}"`);

  // Create git tag
  printStep(`Creating git tag v${newVersion}...`);
  
  // Check if tag already exists locally
  let tagExists = false;
  try {
    execSync(`git rev-parse -q --verify "v${newVersion}"`, { stdio: 'pipe' });
    tagExists = true;
  } catch {
    tagExists = false;
  }

  if (tagExists) {
    printWarning(`Tag v${newVersion} already exists locally.`);
    const overwrite = await question('Do you want to overwrite it? (y/n) ');
    if (overwrite.toLowerCase() === 'y') {
      runCommand(`git tag -d "v${newVersion}"`);
      runCommand(`git tag -a "v${newVersion}" -m "${releaseMsg}"`);
      printSuccess(`Tag recreated: v${newVersion}`);
    } else {
      printError('Cannot proceed with existing tag. Please delete it first or choose a different version.');
      process.exit(1);
    }
  } else {
    runCommand(`git tag -a "v${newVersion}" -m "${releaseMsg}"`);
    printSuccess(`Tag created: v${newVersion}`);
  }

  // Push to GitHub
  printStep('Pushing to GitHub...');
  runCommand(`git push origin ${currentBranch}`);
  
  // Push only the new tag, not all tags
  printStep(`Pushing tag v${newVersion}...`);
  try {
    execSync(`git push origin "v${newVersion}"`, { stdio: 'pipe' });
    printSuccess(`Tag v${newVersion} pushed to GitHub`);
  } catch {
    // Check if tag already exists on remote
    try {
      execSync(`git ls-remote --tags origin "v${newVersion}"`, { stdio: 'pipe' });
      printWarning(`Tag v${newVersion} already exists on remote. Skipping tag push.`);
    } catch {
      printError('Failed to push tag. Please check your git remote configuration.');
      process.exit(1);
    }
  }
  
  printSuccess('Pushed to GitHub');

  // Ask about npm publish
  const publish = await question('Publish to npm? (y/n) ');
  if (publish.toLowerCase() === 'y') {
    if (!isNpmLoggedIn()) {
      printError('Not logged in to npm. Please run "npm login" first.');
      process.exit(1);
    }

    printStep('Publishing to npm...');
    runCommand('npm publish');
    printSuccess(`Published to npm: ai-workflow-init@${newVersion}`);
  } else {
    printWarning('Skipped npm publish');
  }

  printSuccess('Release complete! 🎉');
  console.log('');
  console.log('Summary:');
  console.log(`  Version: ${currentVersion} → ${newVersion}`);
  console.log(`  Tag: v${newVersion}`);
  console.log('  GitHub: pushed');
  if (publish.toLowerCase() === 'y') {
    console.log('  npm: published');
  }

  rl.close();
}

main().catch((err) => {
  printError(`Error: ${err.message}`);
  rl.close();
  process.exit(1);
});

