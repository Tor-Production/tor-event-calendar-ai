/** Process-level runtime recovery checks; synthetic packages/files, no accounts. */
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync} from 'node:fs';
import {join, dirname, resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';

const require = createRequire(import.meta.url);
const launcherPath = fileURLToPath(new URL('../ecosystems/cursor/browser-launcher.cjs', import.meta.url));
const launcher = require(launcherPath);
const legacyNode = process.env.NAMBLI_LEGACY_NODE;
const oldNodeAvailable = legacyNode && existsSync(legacyNode);
const root = mkdtempSync(join(tmpdir(), 'nambli launcher with spaces-'));
const home = join(root, 'private home'), cache = join(root, 'private cache'), workspace = join(root, 'workspace with spaces');
mkdirSync(home); mkdirSync(workspace);
const chrome = join(root, process.platform === 'win32' ? 'synthetic chrome.exe' : 'synthetic chrome');
writeFileSync(chrome, 'Synthetic executable: not launched by the stub MCP.\n', {mode: 0o700});
const packageDirectory = join(cache, 'playwright-mcp-0.0.83');
const moduleDirectory = join(packageDirectory, 'node_modules/@playwright/mcp');
mkdirSync(moduleDirectory, {recursive: true});
writeFileSync(join(moduleDirectory, 'package.json'), JSON.stringify({name: '@playwright/mcp', version: '0.0.83'}));
writeFileSync(join(moduleDirectory, 'cli.js'), `
if (process.argv.includes('--version')) console.log('Version 0.0.83');
else {
 let text=''; process.stdin.setEncoding('utf8'); process.stdin.on('data',chunk=>text+=chunk);
 process.stdin.on('end',()=>console.log(JSON.stringify({synthetic:true,node:process.versions.node,argv:process.argv.slice(2),cwd:process.cwd(),path:process.env.PATH,input:JSON.parse(text)})));
}
`);
const baseEnv = {...process.env, PATH: process.env.PATH || process.env.Path || '', NAMBLI_BROWSER_NODE: process.execPath, NAMBLI_BROWSER_CHROME: chrome, NAMBLI_BROWSER_CACHE: cache};
delete baseEnv.Path; // Windows's case-insensitive environment must have just one spelling.
const request = {jsonrpc: '2.0', id: 1, method: 'synthetic/runtime-proof'};
const run = (node, args = [], env = baseEnv) => spawnSync(node, [launcherPath, ...args], {cwd: workspace, env,
  input: JSON.stringify(request), encoding: 'utf8', timeout: 20000, windowsHide: true});
function success(result) { assert.equal(result.status, 0, result.stderr || String(result.error)); return JSON.parse(result.stdout); }
function successfulInstaller(filename) {
  writeFileSync(filename, `const fs=require('fs'),path=require('path'),prefix=process.argv[process.argv.indexOf('--prefix')+1],dir=path.join(prefix,'node_modules/@playwright/mcp');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'package.json'),JSON.stringify({name:'@playwright/mcp',version:'0.0.83'}));fs.writeFileSync(path.join(dir,'cli.js'),"console.log('Version 0.0.83');");`);
  return filename;
}

try {
  test('version boundaries and explicit invalid selection do not silently fall back', () => {
    for (const value of ['v14.21.3', 'v18.20.8', 'v22.17.9', 'v22', 'unknown']) assert.equal(launcher.supportedNode(value), false, value);
    for (const value of ['v22.18.0', 'v22.23.4', 'v24.1.0']) assert.equal(launcher.supportedNode(value), true, value);
    const result = run(process.execPath, ['--doctor'], {...baseEnv, NAMBLI_BROWSER_NODE: join(root, 'missing-node')});
    assert.equal(result.status, 1); assert.equal(result.stdout, ''); assert.match(result.stderr, /Node 22\.18\+ was not found/);
    assert.match(result.stderr, /get_file_upload_link/);
  });

  test('cached server uses the selected real Node, clean protocol stdout, original cwd and unchanged PATH', () => {
    const observed = success(run(process.execPath));
    assert.equal(observed.synthetic, true); assert.equal(observed.node, process.versions.node);
    assert.equal(observed.cwd, workspace); assert.equal(observed.path, baseEnv.PATH); assert.deepEqual(observed.input, request);
    assert.deepEqual(observed.argv, ['--browser', 'chrome', '--executable-path', chrome]);
    assert.deepEqual(readdirSync(cache), ['playwright-mcp-0.0.83'], 'reuse does not start npm or modify package cache');
  });

  test('real Node14 parses the CJS bootstrap and hands MCP execution to an existing modern Node', {skip: !oldNodeAvailable}, () => {
    assert.match(spawnSync(legacyNode, ['--version'], {encoding: 'utf8'}).stdout, /^v14\.21\.3/);
    const parsed = spawnSync(legacyNode, ['--check', launcherPath], {encoding: 'utf8'});
    assert.equal(parsed.status, 0, parsed.stderr);
    const oldPath = dirname(legacyNode);
    const env = {...baseEnv, PATH: oldPath};
    const observed = success(run(legacyNode, [], env));
    assert.equal(observed.node, process.versions.node); assert.equal(observed.path, oldPath);
    assert.deepEqual(observed.input, request);
    const doctor = success(run(legacyNode, ['--doctor'], env));
    assert.equal(doctor.packageCached, true); assert.equal(doctor.globalFilesChanged, false);
    assert.equal(doctor.runtimeInstalled, false); assert.equal(doctor.node, process.execPath);
  });

  test('old PATH can discover a standard already-installed modern runtime without explicit override', {skip: !oldNodeAvailable}, () => {
    const env = {...baseEnv, PATH: dirname(legacyNode)}; delete env.NAMBLI_BROWSER_NODE;
    const observed = success(run(legacyNode, [], env));
    assert.equal(launcher.supportedNode(observed.node), true); assert.equal(observed.path, env.PATH);
  });

  test('an explicit old runtime and missing Chrome fail before cache/dependency creation', {skip: !oldNodeAvailable}, () => {
    const absentCache = join(root, 'must not create dependency cache');
    const oldRuntime = run(legacyNode, [], {...baseEnv, NAMBLI_BROWSER_NODE: legacyNode, NAMBLI_BROWSER_CACHE: absentCache});
    assert.equal(oldRuntime.status, 1); assert.equal(oldRuntime.stdout, ''); assert.match(oldRuntime.stderr, /Node 22\.18\+/);
    const noChrome = run(legacyNode, [], {...baseEnv, NAMBLI_BROWSER_CHROME: join(root, 'missing-chrome'), NAMBLI_BROWSER_CACHE: absentCache});
    assert.equal(noChrome.status, 1); assert.equal(noChrome.stdout, ''); assert.match(noChrome.stderr, /Chrome was not found/);
    assert.match(noChrome.stderr, /get_file_upload_link/); assert.equal(existsSync(absentCache), false);
  });

  test('unsafe upstream flags cannot be passed through the launcher', () => {
    for (const flag of ['--no-sandbox', '--allow-unrestricted-file-access', '--cdp-endpoint', '--browser']) {
      const result = run(process.execPath, [flag]); assert.equal(result.status, 1); assert.equal(result.stdout, '');
    }
  });

  test('a wrong package version is not reused or overwritten', async () => {
    const badCache = join(root, 'wrong pinned cache'), destination = join(badCache, 'playwright-mcp-0.0.83');
    mkdirSync(join(destination, 'node_modules/@playwright/mcp'), {recursive: true});
    const manifest = join(destination, 'node_modules/@playwright/mcp/package.json');
    writeFileSync(manifest, JSON.stringify({name: '@playwright/mcp', version: '99.0.0'}));
    const before = readFileSync(manifest, 'utf8'), lifecycle = launcher.createLifecycle();
    try { await assert.rejects(launcher.installPackage(badCache, {node: process.execPath}, {env: baseEnv}, lifecycle), /cache is incomplete/); }
    finally { lifecycle.close(); }
    assert.equal(readFileSync(manifest, 'utf8'), before);
    const doctor = run(process.execPath, ['--doctor'], {...baseEnv, NAMBLI_BROWSER_CACHE: badCache});
    assert.equal(doctor.status, 1); assert.equal(doctor.stdout, ''); assert.match(doctor.stderr, /cache is incomplete/);
  });

  test('cancel during real installer process terminates the child and cleans only its own staging', async () => {
    const cancelRoot = join(root, 'cancel package cache'), marker = join(root, 'installer-started.json');
    const installer = join(root, 'synthetic installer.cjs');
    writeFileSync(installer, `require('fs').writeFileSync(${JSON.stringify(marker)},JSON.stringify({pid:process.pid,argv:process.argv.slice(2)})); setInterval(()=>{},1000);`);
    const lifecycle = launcher.createLifecycle();
    try {
      const pending = launcher.installPackage(cancelRoot, {node: process.execPath}, {env: baseEnv}, lifecycle, installer);
      for (let count = 0; !existsSync(marker) && count < 200; count++) await new Promise(done => setTimeout(done, 10));
      assert.equal(existsSync(marker), true, 'actual installer child started');
      const observed = JSON.parse(readFileSync(marker, 'utf8'));
      assert.ok(observed.argv.includes('--ignore-scripts')); assert.ok(observed.argv.includes('--registry=https://registry.npmjs.org'));
      lifecycle.cancel('SIGTERM'); await assert.rejects(pending, /cancelled/);
      assert.throws(() => process.kill(observed.pid, 0), /ESRCH|not found/i);
      assert.equal(readdirSync(cancelRoot).some(name => name.startsWith('install-')), false);
      assert.equal(readFileSync(marker, 'utf8').length > 0, true, 'an unrelated fixture outside staging is preserved');
    } finally { lifecycle.close(); }
  });
  test('a concurrent winner between existence check and rename is revalidated and reused', async () => {
    const raceRoot = join(root, 'race private cache'), installer = successfulInstaller(join(root, 'synthetic successful installer.cjs'));
    const mutableFs = require('node:fs'), originalRename = mutableFs.renameSync, lifecycle = launcher.createLifecycle(); let injected = false;
    mutableFs.renameSync = (from, to) => { if (!injected && dirname(from) === raceRoot) { injected = true; mutableFs.cpSync(from, to, {recursive: true}); } return originalRename(from, to); };
    try {
      const cli = await launcher.installPackage(raceRoot, {node: process.execPath}, {env: baseEnv}, lifecycle, installer);
      assert.equal(injected, true); assert.equal(cli, join(raceRoot, 'playwright-mcp-0.0.83/node_modules/@playwright/mcp/cli.js'));
      assert.equal(readdirSync(raceRoot).some(name => name.startsWith('install-')), false);
    } finally { mutableFs.renameSync = originalRename; lifecycle.close(); }
  });

  test('winners appearing at the initial or pre-rename presence guard are validated rather than called incomplete', async () => {
    const mutableFs = require('node:fs'), originalExists = mutableFs.existsSync;
    for (const guard of [1, 2]) {
      const raceRoot = join(root, 'presence guard race ' + guard), destination = join(raceRoot, 'playwright-mcp-0.0.83');
      const installer = successfulInstaller(join(root, 'guard-installer-' + guard + '.cjs')), lifecycle = launcher.createLifecycle();
      let checks = 0, injected = false;
      mutableFs.existsSync = filename => {
        if (filename === destination && ++checks === guard) { injected = true; mutableFs.cpSync(packageDirectory, destination, {recursive: true}); }
        return originalExists(filename);
      };
      try {
        const cli = await launcher.installPackage(raceRoot, {node: process.execPath}, {env: baseEnv}, lifecycle, installer);
        assert.equal(injected, true); assert.equal(cli, join(destination, 'node_modules/@playwright/mcp/cli.js'));
        assert.equal(readdirSync(raceRoot).some(name => name.startsWith('install-')), false);
      } finally { mutableFs.existsSync = originalExists; lifecycle.close(); }
    }
  });
} finally {
  // node:test callbacks run after registration; cleanup is attached to process exit.
  process.once('exit', () => rmSync(root, {recursive: true, force: true}));
}
