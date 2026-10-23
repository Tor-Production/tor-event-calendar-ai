#!/usr/bin/env node
'use strict';

// This bootstrap must parse on the old Node that Cursor may inherit from PATH.
// It never installs Node or Chrome, rewrites wrappers, or changes PATH/profiles.
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const MIN_NODE = [22, 18, 0];
const PACKAGE = '@playwright/mcp';
const VERSION = '0.0.83';
const PREFIX = 'nambli-browser';

function supportedNode(version) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(version).trim());
  if (!match) return false;
  const parts = match.slice(1).map(Number);
  for (let index = 0; index < MIN_NODE.length; index++) {
    if (parts[index] !== MIN_NODE[index]) return parts[index] > MIN_NODE[index];
  }
  return true;
}

function regularFile(filename, platform) {
  try {
    if (!fs.statSync(filename).isFile()) return false;
    if (platform !== 'win32') fs.accessSync(filename, fs.constants.X_OK);
    return true;
  } catch (_) { return false; }
}

function versionDirectories(directory) {
  try {
    return fs.readdirSync(directory).filter(name => /^v?\d+\.\d+\.\d+$/.test(name) && supportedNode(name))
      .sort((a, b) => b.replace(/^v/, '').localeCompare(a.replace(/^v/, ''), undefined, {numeric: true}))
      .slice(0, 12).map(name => path.join(directory, name));
  } catch (_) { return []; }
}

function runtimeCandidates(options) {
  const env = options.env, home = options.home, platform = options.platform;
  const executable = platform === 'win32' ? 'node.exe' : 'node';
  if (env.NAMBLI_BROWSER_NODE) {
    if (!path.isAbsolute(env.NAMBLI_BROWSER_NODE)) throw new Error('NAMBLI_BROWSER_NODE must be an absolute Node executable path.');
    return [env.NAMBLI_BROWSER_NODE];
  }
  const candidates = [options.execPath];
  for (const directory of String(env.PATH || env.Path || '').split(path.delimiter)) {
    if (path.isAbsolute(directory)) candidates.push(path.join(directory, executable));
  }
  if (platform === 'win32') {
    for (const directory of [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Programs')]) {
      if (directory) candidates.push(path.join(directory, 'nodejs', executable));
    }
    if (env.NVM_SYMLINK) candidates.push(path.join(env.NVM_SYMLINK, executable));
  } else {
    candidates.push('/usr/local/bin/node', '/usr/bin/node', '/opt/homebrew/bin/node',
      '/usr/local/opt/node@22/bin/node', '/opt/homebrew/opt/node@22/bin/node');
    if (env.N_PREFIX) candidates.push(path.join(env.N_PREFIX, 'bin/node'));
    candidates.push(path.join(home, '.n/bin/node'));
  }
  const managers = [
    [path.join(env.NVM_DIR || path.join(home, '.nvm'), 'versions/node'), 'bin'],
    [path.join(env.VOLTA_HOME || path.join(home, '.volta'), 'tools/image/node'), platform === 'win32' ? '' : 'bin'],
    [path.join(home, '.asdf/installs/nodejs'), 'bin'],
    [path.join(env.MISE_DATA_DIR || path.join(home, '.local/share/mise'), 'installs/node'), platform === 'win32' ? '' : 'bin'],
    [path.join(home, '.local/share/fnm/node-versions'), platform === 'win32' ? 'installation' : 'installation/bin'],
    [path.join(home, 'Library/Application Support/fnm/node-versions'), 'installation/bin'],
  ];
  if (env.APPDATA) managers.push([path.join(env.APPDATA, 'fnm/node-versions'), 'installation']);
  for (const [directory, suffix] of managers) {
    for (const version of versionDirectories(directory)) candidates.push(path.join(version, suffix, executable));
  }
  return candidates;
}

function resolveRuntime(options) {
  const seen = new Set(), deadline = Date.now() + 6000;
  for (const candidate of runtimeCandidates(options)) {
    if (!candidate || !regularFile(candidate, options.platform)) continue;
    let resolved;
    try { resolved = fs.realpathSync(candidate); } catch (_) { continue; }
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    try {
      const version = cp.execFileSync(resolved, ['--version'], {encoding: 'utf8', windowsHide: true,
        timeout: Math.min(1500, remaining), stdio: ['ignore', 'pipe', 'pipe']}).trim();
      if (supportedNode(version)) return {node: resolved, version};
    } catch (_) { /* A broken/version-manager shim is not a usable runtime. */ }
  }
  throw new Error('Node 22.18+ was not found' + (options.env.NAMBLI_BROWSER_NODE ? ' at NAMBLI_BROWSER_NODE' : ' in the targeted installed locations') +
    '. Select an already installed runtime with the NAMBLI_BROWSER_NODE environment variable and restart only this browser server. No Node runtime was installed or global wrapper changed.');
}

function resolveChrome(options) {
  const env = options.env, candidates = [];
  if (env.NAMBLI_BROWSER_CHROME) {
    if (!path.isAbsolute(env.NAMBLI_BROWSER_CHROME)) throw new Error('NAMBLI_BROWSER_CHROME must be an absolute Chrome executable path.');
    candidates.push(env.NAMBLI_BROWSER_CHROME);
  } else if (options.platform === 'darwin') {
    candidates.push('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      path.join(options.home, 'Applications/Google Chrome.app/Contents/MacOS/Google Chrome'));
  } else if (options.platform === 'win32') {
    for (const root of [env.ProgramFiles, env['ProgramFiles(x86)'], env.LOCALAPPDATA]) {
      if (root) candidates.push(path.join(root, 'Google/Chrome/Application/chrome.exe'));
    }
  } else candidates.push('/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable');
  const chrome = candidates.find(filename => regularFile(filename, options.platform));
  if (!chrome) throw new Error('Installed Google Chrome was not found. NAMBLI_BROWSER_CHROME may select its existing absolute executable path. No browser was installed.');
  return fs.realpathSync(chrome);
}

function cacheRoot(options) {
  if (options.env.NAMBLI_BROWSER_CACHE) {
    if (!path.isAbsolute(options.env.NAMBLI_BROWSER_CACHE)) throw new Error('NAMBLI_BROWSER_CACHE must be an absolute private cache directory.');
    return path.resolve(options.env.NAMBLI_BROWSER_CACHE);
  }
  const base = options.platform === 'win32' ? (options.env.LOCALAPPDATA || path.join(options.home, 'AppData/Local')) :
    options.platform === 'darwin' ? path.join(options.home, 'Library/Caches') :
      (options.env.XDG_CACHE_HOME && path.isAbsolute(options.env.XDG_CACHE_HOME) ? options.env.XDG_CACHE_HOME : path.join(options.home, '.cache'));
  return path.join(base, 'nambli/cursor-browser');
}

function npmScript(runtime, options) {
  const parent = path.dirname(runtime.node), candidates = [
    path.join(parent, 'node_modules/npm/bin/npm-cli.js'),
    path.resolve(parent, '../lib/node_modules/npm/bin/npm-cli.js'),
    path.resolve(path.dirname(options.execPath), '../lib/node_modules/npm/bin/npm-cli.js'),
  ];
  if (options.platform !== 'win32') candidates.push('/usr/local/lib/node_modules/npm/bin/npm-cli.js', '/opt/homebrew/lib/node_modules/npm/bin/npm-cli.js');
  const found = candidates.find(filename => { try { return fs.statSync(filename).isFile(); } catch (_) { return false; } });
  if (!found) throw new Error('The selected Node runtime has no usable bundled npm CLI for the pinned browser package. Install/repair npm for that runtime deliberately; global npx was not invoked or changed.');
  return found;
}

function cachedPackage(directory, runtime) {
  const packageRoot = path.join(directory, 'node_modules/@playwright/mcp');
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));
    const cli = path.join(packageRoot, 'cli.js');
    if (manifest.name !== PACKAGE || manifest.version !== VERSION || !fs.statSync(cli).isFile()) return null;
    const version = cp.execFileSync(runtime.node, [cli, '--version'], {encoding: 'utf8', windowsHide: true,
      timeout: 5000, stdio: ['ignore', 'pipe', 'pipe']}).trim();
    return version.indexOf(VERSION) >= 0 ? cli : null;
  } catch (_) { return null; }
}

function existingPackage(directory, runtime) {
  if (!fs.existsSync(directory)) return null;
  const ready = cachedPackage(directory, runtime);
  if (ready) return ready;
  throw new Error('The private pinned package cache is incomplete. Preserve it for diagnosis or choose a new private NAMBLI_BROWSER_CACHE; it was not overwritten.');
}

function createLifecycle() {
  const state = {child: null, cancelled: null, escalation: null};
  const lifecycle = {
    cancel(signal) {
      state.cancelled = state.cancelled || signal;
      const child = state.child;
      if (!child) return;
      try { child.kill(signal); } catch (_) {}
      if (!state.escalation) state.escalation = setTimeout(() => {
        if (state.child === child) { try { child.kill('SIGKILL'); } catch (_) {} }
      }, 2000);
    },
    check() { if (state.cancelled) throw new Error('Browser startup/execution was cancelled (' + state.cancelled + ').'); },
    attach(child) { state.child = child; if (state.cancelled) lifecycle.cancel(state.cancelled); },
    detach(child) { if (state.child === child) state.child = null; clearTimeout(state.escalation); state.escalation = null; },
    close() { for (const [signal, handler] of handlers) process.removeListener(signal, handler); clearTimeout(state.escalation); },
  };
  const handlers = ['SIGINT', 'SIGTERM', 'SIGHUP'].map(signal => {
    const handler = () => lifecycle.cancel(signal); process.on(signal, handler); return [signal, handler];
  });
  return lifecycle;
}

function runChild(command, args, options, lifecycle, timeout) {
  lifecycle.check();
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, args, options); let stdout = '', stderr = '', timedOut = false;
    lifecycle.attach(child);
    if (child.stdout) child.stdout.on('data', data => { stdout = (stdout + data).slice(-2 * 1024 * 1024); });
    if (child.stderr) child.stderr.on('data', data => { stderr = (stderr + data).slice(-2 * 1024 * 1024); });
    const timer = timeout ? setTimeout(() => { timedOut = true; lifecycle.cancel('SIGTERM'); }, timeout) : null;
    child.once('error', error => { clearTimeout(timer); lifecycle.detach(child); reject(error); });
    child.once('close', (code, signal) => {
      clearTimeout(timer); lifecycle.detach(child);
      if (timedOut) return reject(new Error('Browser dependency setup timed out.'));
      try { lifecycle.check(); } catch (error) { return reject(error); }
      resolve({status: typeof code === 'number' ? code : (signal ? 1 : 0), stdout, stderr});
    });
  });
}

async function installPackage(root, runtime, options, lifecycle, installer) {
  fs.mkdirSync(root, {recursive: true, mode: 0o700});
  const destination = path.join(root, 'playwright-mcp-' + VERSION);
  const existing = existingPackage(destination, runtime);
  if (existing) return existing;
  const npm = installer || npmScript(runtime, options);
  const staging = fs.mkdtempSync(path.join(root, 'install-' + VERSION + '-'));
  try {
    const userConfig = path.join(staging, 'empty-user.npmrc'), globalConfig = path.join(staging, 'empty-global.npmrc');
    fs.writeFileSync(userConfig, '', {mode: 0o600});
    fs.writeFileSync(globalConfig, '', {mode: 0o600});
    fs.writeFileSync(path.join(staging, 'package.json'), JSON.stringify({name: 'nambli-private-cursor-browser-cache',
      version: '0.0.0', private: true, dependencies: {[PACKAGE]: VERSION}}) + '\n', {mode: 0o600});
    process.stderr.write(PREFIX + ': preparing pinned ' + PACKAGE + '@' + VERSION + ' in the private package cache (no Node/Chrome installation).\n');
    const installed = await runChild(runtime.node, [npm, 'install', '--prefix', staging, '--cache', path.join(root, 'npm-cache'),
      '--userconfig', userConfig, '--globalconfig', globalConfig, '--registry=https://registry.npmjs.org',
      '--ignore-scripts', '--no-audit', '--no-fund', '--no-update-notifier'], {cwd: staging, encoding: 'utf8', windowsHide: true,
      env: Object.assign({}, options.env, {PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1'}),
      stdio: ['ignore', 'pipe', 'pipe']}, lifecycle, 120000);
    if (installed.status !== 0) throw new Error('Pinned browser package setup failed. ' +
      String(installed.stderr || 'npm exited ' + installed.status).slice(-1800));
    if (!cachedPackage(staging, runtime)) throw new Error('Pinned browser package did not pass its version/dependency check.');
    // A concurrent successful installation wins. Never overwrite an existing directory.
    const winner = existingPackage(destination, runtime);
    if (winner) return winner;
    try { fs.renameSync(staging, destination); }
    catch (error) { if (!cachedPackage(destination, runtime)) throw error; }
    return cachedPackage(destination, runtime);
  } finally {
    if (path.dirname(staging) === path.resolve(root) && path.basename(staging).indexOf('install-' + VERSION + '-') === 0 && fs.existsSync(staging)) {
      fs.rmSync(staging, {recursive: true, force: true});
    }
  }
}

async function main(argv, suppliedOptions) {
  if (argv.some(value => value !== '--doctor' && value !== '--headless') || new Set(argv).size !== argv.length || argv.length > 1) {
    throw new Error('Only no arguments, --doctor, or the separate synthetic-test --headless variant is supported.');
  }
  const lifecycle = createLifecycle();
  try {
  const options = Object.assign({env: process.env, home: os.homedir(), platform: process.platform, execPath: process.execPath}, suppliedOptions || {});
  const runtime = resolveRuntime(options), chrome = resolveChrome(options), root = cacheRoot(options);
  lifecycle.check();
  if (argv.includes('--doctor')) {
    const installed = !!existingPackage(path.join(root, 'playwright-mcp-' + VERSION), runtime);
    if (!installed) npmScript(runtime, options);
    process.stdout.write(JSON.stringify({ready: true, nodeVersion: runtime.version, node: runtime.node, chrome,
      package: PACKAGE + '@' + VERSION, packageCached: installed, cache: root, runtimeInstalled: false, globalFilesChanged: false}) + '\n');
    return null;
  }
  const cli = await installPackage(root, runtime, options, lifecycle);
  const result = await runChild(runtime.node, [cli, '--browser', 'chrome', '--executable-path', chrome,
    ...(argv.includes('--headless') ? ['--headless'] : [])], {cwd: process.cwd(), env: options.env, stdio: 'inherit', windowsHide: true}, lifecycle);
  if (result.status !== 0) throw new Error('Browser MCP exited with status ' + result.status + '; inspect its preceding diagnostics.');
  process.exitCode = result.status;
  return result;
  } finally { lifecycle.close(); }
}

module.exports = {MIN_NODE, PACKAGE, VERSION, supportedNode, runtimeCandidates, resolveRuntime, resolveChrome, cacheRoot, npmScript, cachedPackage, createLifecycle, runChild, installPackage, main};
if (require.main === module) {
  main(process.argv.slice(2)).catch(error => {
    process.stderr.write(PREFIX + ': ' + error.message + '\nCalendar tools remain independent. For an authorized file upload, use get_file_upload_link and show its actual clickable URL before asking the user to restart or repair this browser server. Image publication must wait for a working browser preflight.\n');
    process.exitCode = 1;
  });
}
