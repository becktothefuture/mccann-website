/**
 * ==================================================
 *  McCann Website — Publish Assets Script
 *  Purpose: Build bundle and sync dist assets to public repo
 *  Date: 2025-11-10
 * ==================================================
 */

console.log('[PUBLISH-ASSETS] Module loaded');

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// ============================================================
// STATE
// ============================================================

const rootDir = path.resolve(__dirname, '..');
const distSource = path.join(rootDir, 'dist');
const assetsRepoPath = process.env.MCCANN_ASSETS_PATH
  ? path.resolve(process.env.MCCANN_ASSETS_PATH)
  : path.resolve(rootDir, '..', 'mccann-assets');
const distDestination = path.join(assetsRepoPath, 'dist');

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function log(message) {
  console.log(`[PUBLISH-ASSETS] ${message}`);
}

function runCommand(command, args, options = {}) {
  const execOptions = {
    stdio: 'inherit',
    ...options,
  };
  const result = spawnSync(command, args, execOptions);
  if (result.status !== 0) {
    throw new Error(`[PUBLISH-ASSETS] ❌ Command failed → ${command} ${args.join(' ')}`);
  }
}

function runCommandWithOutput(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`[PUBLISH-ASSETS] ❌ Command failed → ${command} ${args.join(' ')}\n${result.stderr}`);
  }
  return result.stdout.trim();
}

function ensureAssetsRepo() {
  if (!fs.existsSync(assetsRepoPath)) {
    log(`❌ Assets repo not found at ${assetsRepoPath}`);
    log('Set MCCANN_ASSETS_PATH to override or clone the repo adjacent to this project.');
    process.exit(1);
  }

  const gitDir = path.join(assetsRepoPath, '.git');
  if (!fs.existsSync(gitDir)) {
    log(`❌ No .git directory found in ${assetsRepoPath}`);
    process.exit(1);
  }
}

function copyDist() {
  log('🎯 Syncing dist assets to public repository');
  if (!fs.existsSync(distSource)) {
    log('❌ Source dist directory missing. Run npm run build first.');
    process.exit(1);
  }

  fs.rmSync(distDestination, { recursive: true, force: true });
  fs.mkdirSync(distDestination, { recursive: true });
  fs.cpSync(distSource, distDestination, { recursive: true });
  log(`✓ Copied dist → ${distDestination}`);
}

function hasDistChanges() {
  const output = runCommandWithOutput(
    'git',
    ['status', '--porcelain', 'dist'],
    { cwd: assetsRepoPath }
  );
  return output.length > 0;
}

function commitAndPush() {
  const timestamp = new Date().toISOString().replace(/\..+/, '');
  const message = `chore: update assets ${timestamp}`;

  runCommand('git', ['add', 'dist'], { cwd: assetsRepoPath });
  runCommand('git', ['commit', '-m', message], { cwd: assetsRepoPath });
  runCommand('git', ['push'], { cwd: assetsRepoPath });
  log('✓ Changes committed and pushed to mccann-assets');
}

// ============================================================
// CORE FUNCTIONS
// ============================================================

function publishAssets() {
  ensureAssetsRepo();

  log('🎯 Running build in main repository');
  runCommand('npm', ['run', 'build'], { cwd: rootDir });
  log('✓ Build complete');

  copyDist();

  if (!hasDistChanges()) {
    log('⚠️ No changes detected in dist. Nothing to commit.');
    return;
  }

  commitAndPush();
  log('✓ GitHub Pages workflow will redeploy automatically');
}

// ============================================================
// INITIALIZATION
// ============================================================

try {
  publishAssets();
} catch (err) {
  console.error('[PUBLISH-ASSETS] ❌ Publish failed:', err.message);
  process.exit(1);
}

