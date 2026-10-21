/** Benign fixture for the configured official browser MCP, never a social send.
 * node scripts/test-cursor-browser.mjs --client-root /checkout/with/mcp/client
 * Optional --headless is a CI fixture variant, not the shipped headed command.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {join, resolve, dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const args = process.argv.slice(2), headless = args.includes('--headless');
const clientRootIndex = args.indexOf('--client-root');
assert.ok(clientRootIndex >= 0 && args[clientRootIndex + 1], 'Pass --client-root for a checkout with @modelcontextprotocol/client installed');
const clientRoot = resolve(args[clientRootIndex + 1]);
assert.equal(args.length, headless ? 3 : 2, 'Only --client-root PATH and optional --headless are supported');
const dependency = createRequire(join(clientRoot, 'package.json'));
const {Client} = await import(pathToFileURL(dependency.resolve('@modelcontextprotocol/client')));
const {StdioClientTransport} = await import(pathToFileURL(dependency.resolve('@modelcontextprotocol/client/stdio')));
const config = JSON.parse(await readFile(new URL('../ecosystems/cursor/mcp.json', import.meta.url), 'utf8')).mcpServers['nambli-browser'];
assert.deepEqual(config, {command: 'npx', args: ['-y', '@playwright/mcp@0.0.83', '--browser', 'chrome']});
const workspaceParent = await mkdtemp(join(tmpdir(), 'nambli-cursor-browser-'));
const workspace = join(workspaceParent, 'private-fixture-workspace');
await mkdir(workspace);
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a7KsAAAAASUVORK5CYII=', 'base64');
const imagePath = join(workspace, 'fixture.png'), outsidePath = join(workspaceParent, 'outside.png');
await writeFile(imagePath, png); await writeFile(outsidePath, png);
const canonical = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
const alt = 'Synthetic one-pixel image.';
const html = `<!doctype html><html><body><h1>Synthetic publication transport fixture</h1>
<textarea id="canonical" aria-label="Canonical text"></textarea><div id="post-text" contenteditable="true" role="textbox" aria-label="Post text"></div>
<label>Alternative text <input id="alt" aria-label="Alternative text"></label>
<button id="choose" onclick="document.getElementById('image').click()">Choose image</button><input id="image" type="file" accept="image/png" hidden>
<output id="file-status">No file</output><img id="preview"><button id="remember" onclick="localStorage.setItem('fixture-marker','remembered')">Remember fixture</button>
<script>document.getElementById('image').onchange=async event=>{const file=event.target.files[0];if(!file)return;const bytes=await file.arrayBuffer();const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');document.getElementById('file-status').textContent=JSON.stringify({name:file.name,size:file.size,type:file.type,sha256:digest});document.getElementById('preview').src=URL.createObjectURL(file);};</script></body></html>`;
const server = createServer((request, response) => { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html); });
await new Promise(done => server.listen(0, '127.0.0.1', done));
const fixtureUrl = `http://127.0.0.1:${server.address().port}/`;
const calls = []; let rootsRequests = 0, session;
async function start() {
  const client = new Client({name: 'nambli-cursor-browser-fixture', version: '1.0.0'}, {capabilities: {roots: {listChanged: true}}});
  client.setRequestHandler('roots/list', async () => { rootsRequests++; return {roots: [{uri: pathToFileURL(workspace).href, name: 'Synthetic private workspace'}]}; });
  // Start outside the advertised root to prove MCP roots, not process cwd, bound uploads.
  const transport = new StdioClientTransport({command: config.command, args: [...config.args, ...(headless ? ['--headless'] : [])], cwd: workspaceParent, stderr: 'pipe'});
  let stderr = '';
  transport.stderr?.on('data', value => { stderr += String(value); });
  try { await client.connect(transport); }
  catch (error) {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
    throw new Error(`Browser MCP startup failed: ${error.message}\n${stderr}`, {cause: error});
  }
  return {client, transport};
}
async function call(name, argumentsValue = {}, expectError = false) {
  const result = await session.client.callTool({name, arguments: argumentsValue});
  const text = (result.content ?? []).filter(item => item.type === 'text').map(item => item.text).join('\n');
  calls.push({name, arguments: argumentsValue, isError: !!result.isError, text});
  assert.equal(!!result.isError, expectError, `${name}: ${text}`);
  return text;
}
function evaluation(text) {
  const match = text.match(/### Result\s*\n([\s\S]*?)(?:\n### |$)/);
  assert.ok(match, `Expected structured browser evaluation result: ${text}`);
  return JSON.parse(match[1].trim());
}
try {
  session = await start();
  const tools = await session.client.listTools();
  assert.ok(tools.tools.some(tool => tool.name === 'browser_file_upload' && tool.inputSchema.properties.paths));
  await call('browser_navigate', {url: fixtureUrl});
  await call('browser_click', {target: '#choose', element: 'Choose image'});
  await call('browser_file_upload', {paths: [imagePath]});
  await call('browser_type', {target: '#canonical', text: canonical});
  await call('browser_type', {target: '#post-text', text: canonical});
  await call('browser_type', {target: '#alt', text: alt});
  const observed = evaluation(await call('browser_evaluate', {function: `() => ({canonical:document.querySelector('#canonical').value,innerText:document.querySelector('#post-text').innerText,textContent:document.querySelector('#post-text').textContent,html:document.querySelector('#post-text').innerHTML,alt:document.querySelector('#alt').value,file:JSON.parse(document.querySelector('#file-status').textContent),imageWidth:document.querySelector('#preview').naturalWidth})`}));
  assert.equal(observed.canonical, canonical, 'Textarea must retain exact Unicode/newline transport');
  assert.equal(observed.alt, alt);
  assert.equal(observed.file.size, png.length);
  assert.equal(observed.file.sha256, createHash('sha256').update(png).digest('hex'));
  assert.equal(observed.imageWidth, 1);
  assert.deepEqual(observed.innerText.split(/\n+/), canonical.split(/\n+/));
  assert.match(observed.innerText, /First paragraph\.\n\n+Second paragraph\.\n\n+Third paragraph\./,
    'Contenteditable must retain meaningful paragraph separation; exact rendered spacing is reported separately');
  await call('browser_click', {target: '#choose'});
  assert.match(await call('browser_file_upload', {paths: [outsidePath]}, true), /outside|allowed roots|access denied/i);
  await call('browser_file_upload');
  await call('browser_navigate', {url: pathToFileURL(imagePath).href}, true);
  await call('browser_navigate', {url: fixtureUrl});
  await call('browser_click', {target: '#remember'});
  await call('browser_close');
  await session.client.close();
  session = await start();
  await call('browser_navigate', {url: fixtureUrl});
  assert.equal(evaluation(await call('browser_evaluate', {function: "() => localStorage.getItem('fixture-marker')"})), 'remembered');
  await call('browser_close');
  assert.ok(rootsRequests >= 2);
  const result = {result: 'PASS', package: '@playwright/mcp@0.0.83', exactConfiguredHeadedCommand: !headless,
    fixtureHeadless: headless, nativeCursorHost: false, actualLinkedInComposer: false,
    pngBytes: png.length, pngSha256: observed.file.sha256, exactTextareaTransport: true, exactAltInput: true,
    contentEditableParagraphsPresent: true, contentEditableExactInnerText: observed.innerText === canonical,
    contentEditableObservedText: observed.innerText, defaultProfileRestartPersistence: true,
    advertisedRootsBoundUploadDespiteDifferentCwd: true, outsideRootUploadDenied: true, fileUrlDenied: true,
    nambliAuthCalls: 0, socialSends: 0, rootsRequests};
  await mkdir(new URL('../work/', import.meta.url), {recursive: true});
  const suffix = headless ? 'headless' : 'headed';
  await writeFile(new URL(`../work/cursor-browser-${suffix}-receipt.json`, import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(new URL(`../work/cursor-browser-${suffix}-calls.json`, import.meta.url), `${JSON.stringify(calls, null, 2)}\n`);
  console.log(JSON.stringify(result));
} finally {
  await session?.client.close().catch(() => {});
  await new Promise(done => server.close(done));
  // Only our exact mkdtemp tree is removed; the MCP-managed default profile is left intact.
  assert.equal(dirname(workspace), workspaceParent);
  await rm(workspaceParent, {recursive: true, force: true, maxRetries: 5, retryDelay: 100}).catch(error => {
    // Do not mask the test failure or kill an unrelated process to remove a locked fixture.
    process.stderr.write(`Fixture cleanup pending at ${workspaceParent}: ${error.message}\n`);
  });
}
