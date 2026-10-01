#!/usr/bin/env python3
"""Focused Claude source/build checks; never authenticate or publish."""
import argparse
import hashlib
import json
import re
import subprocess
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HOST = Path('ecosystems/claude-code')
SKILL = Path('skills/tor-event-calendar')
MCP_URL = 'https://nembli.com/mcp'
ISSUER = 'https://nembli.com/api/v1/auth'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(root, name):
    return json.loads((root / name).read_text(encoding='utf-8'))


def validate(root=ROOT):
    package = read_json(root, 'package.json')
    manifest = read_json(root, '.claude-plugin/plugin.json')
    require(manifest['name'] == package['name'] == 'tor-event-calendar-ai', 'Plugin ID changed')
    require(manifest['version'] == package['version'], 'Plugin version drift')
    require(manifest['author']['name'] == 'Tor Production', 'Plugin owner drift')
    require(manifest['homepage'] == 'https://nembli.com', 'Homepage drift')
    # The existing default layout needs no hooks, secrets or component overrides.
    require(not {'hooks', 'settings', 'userConfig', 'mcpServers', 'skills', 'commands'} & manifest.keys(),
            'Review unexpected Claude component overrides')
    expected = {'mcpServers': {'nembli': {'type': 'http', 'url': MCP_URL}}}
    require(read_json(root, '.mcp.json') == expected, 'Root Claude HTTP MCP config drift')
    require(read_json(root, HOST / 'mcp.json') == expected, 'Host HTTP MCP config drift')
    marketplace = read_json(root, '.claude-plugin/marketplace.json')
    require(marketplace['name'] == 'nembli' and marketplace['owner']['name'] == 'Tor Production',
            'Claude marketplace identity drift')
    entries = marketplace['plugins']
    require(len(entries) == 1 and entries[0]['name'] == manifest['name'] and entries[0]['source'] == './',
            'Claude marketplace must install the existing root plugin')
    skill = (root / SKILL / 'SKILL.md').read_text(encoding='utf-8')
    require(skill.startswith('---\n'), 'Skill frontmatter missing')
    frontmatter = skill.split('---', 2)[1]
    require(re.findall(r'^disable-model-invocation:\s*(\S+)\s*$', frontmatter, re.M) == ['true'],
            'Claude skill must disable implicit invocation exactly once')
    require('name: tor-event-calendar\n' in frontmatter, 'Skill ID drift')
    require('(references/claude-code.md)' in skill, 'Claude runtime guidance is not wired')
    require((root / SKILL / 'references/claude-code.md').is_file(), 'Claude runtime guidance missing')
    fixture = read_json(root, HOST / 'fixtures/post-draft.json')
    require(fixture['timeZone'] == 'Europe/Kyiv', 'Fixture timezone drift')
    require(fixture['customFieldTypes']['image'] == fixture['customFieldTypes']['brief_pdf'] == 'File',
            'Fixture must use explicit File fields')
    require(not {'image', 'brief_pdf'} & fixture['customFields'].keys(), 'Fixture embeds a File value')
    require('id' not in fixture, 'Planner must supply a fresh stable event UUID')
    download = read_json(root, HOST / 'download-contract.json')
    require(download['tool'] == 'get_file_download'
            and download['requiredInputs'] == ['eventId', 'eventRevision', 'attachmentId', 'fieldName']
            and download['scope'] == 'calendar.read'
            and download['nativeReadMethod'] == 'resources/read'
            and download['nativeMaxBytes'] == 512 * 1024
            and download['fileMaxBytes'] == 25 * 1024 * 1024
            and download['metadataDeliversBytes'] is False, 'Shared #66 download contract drift')
    return {'result': 'PASS', 'target': 'claude-code', 'version': package['version'],
            'nativeAcceptance': 'not established by source checks'}


def export_paths(root):
    fixed = [Path('.claude-plugin/plugin.json'), Path('.mcp.json'), Path('LICENSE')]
    trees = (SKILL, HOST)
    tracked = subprocess.run(['git', '-c', f'safe.directory={root.as_posix()}', 'ls-files', '-z', '--',
                              *(p.as_posix() for p in trees)], cwd=root, check=True, capture_output=True).stdout
    paths = fixed + [Path(p.decode('utf-8')) for p in tracked.split(b'\0') if p]
    require(HOST / 'README.md' in paths and SKILL / 'references/claude-code.md' in paths,
            'Stage the Claude source before building; required guides are not tracked')
    for tree in trees:
        require(not any(p.is_symlink() or p.is_junction() for p in (root / tree).rglob('*'))
                if hasattr(Path, 'is_junction') else not any(p.is_symlink() for p in (root / tree).rglob('*')),
                'Links/junctions are excluded from the Claude artifact')
    for relative in paths:
        path = root / relative
        require(path.is_file() and not path.is_symlink() and path.resolve().is_relative_to(root.resolve()),
                f'Unsafe export path: {relative}')
        require(relative.suffix in {'.md', '.json', '.png', '.py', '.yaml'} or relative == Path('LICENSE'),
                f'Unexpected exported file: {relative}')
        require(not any(part.startswith('.') for part in relative.parts[1:]),
                f'Hidden exported file: {relative}')
    return sorted(set(paths), key=lambda p: p.as_posix())


def build(root=ROOT, output_dir=None):
    result = validate(root)
    paths = export_paths(root)
    destination = output_dir or root / 'dist/claude-code'
    destination.mkdir(parents=True, exist_ok=True)
    output = destination / f'tor-event-calendar-ai-claude-code-{result["version"]}-dev.zip'
    with zipfile.ZipFile(output, 'w') as archive:
        for relative in paths:
            entry = zipfile.ZipInfo(relative.as_posix(), (2026, 10, 1, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, (root / relative).read_bytes(), compresslevel=9)
    receipt = {**result, 'distribution': 'unreleased-development', 'archive': output.name,
               'sha256': hashlib.sha256(output.read_bytes()).hexdigest(),
               'files': {p.as_posix(): hashlib.sha256((root / p).read_bytes()).hexdigest() for p in paths}}
    (destination / 'build-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    return receipt


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def public_request(url, body=None):
    headers = {'Accept': 'application/json, text/event-stream', 'User-Agent': 'nembli-claude-config-check/0.1'}
    if body is not None:
        headers['Content-Type'] = 'application/json'
    request = urllib.request.Request(url, data=body, headers=headers)
    try:
        response = urllib.request.build_opener(NoRedirect).open(request, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        data = response.read(256 * 1024 + 1)
        require(len(data) <= 256 * 1024, 'Public metadata response too large')
        return response.code, response.headers, data


def probe():
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'initialize',
                       'params': {'protocolVersion': '2025-03-26', 'capabilities': {},
                                  'clientInfo': {'name': 'nembli-claude-config-check', 'version': '0.1'}}}).encode()
    status, headers, _ = public_request(MCP_URL, body)
    require(status == 401, f'Unauthenticated MCP initialization must require OAuth (401); got {status}')
    challenge = headers.get('WWW-Authenticate', '')
    require(re.search(r'resource_metadata="https://nembli\.com/\.well-known/oauth-protected-resource(?:/mcp)?"',
                      challenge), 'OAuth resource discovery challenge missing')
    status, _, data = public_request('https://nembli.com/.well-known/oauth-protected-resource/mcp')
    require(status == 200, 'Protected resource metadata unavailable')
    resource = json.loads(data)
    require(resource['resource'] == MCP_URL and ISSUER in resource['authorization_servers'], 'OAuth origin drift')
    status, _, data = public_request('https://nembli.com/.well-known/oauth-authorization-server/api/v1/auth')
    require(status == 200, 'Authorization server metadata unavailable')
    auth = json.loads(data)
    require(auth['issuer'] == ISSUER, 'Issuer drift')
    require({'calendar.read', 'calendar.manage', 'offline_access'} <= set(auth['scopes_supported']),
            'Expected calendar/refresh scopes missing')
    require('S256' in auth['code_challenge_methods_supported'], 'PKCE S256 unavailable')
    require(auth.get('registration_endpoint', '').startswith(ISSUER + '/'), 'Dynamic registration unavailable')
    return {'result': 'PASS', 'checks': ['unauthenticated-401', 'resource-discovery', 'issuer', 'scopes', 'PKCE-S256',
                                        'registration-metadata'], 'accountAccess': False, 'nativeAcceptance': False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['validate', 'build', 'probe'])
    args = parser.parse_args()
    result = {'validate': validate, 'build': build, 'probe': probe}[args.command]()
    print(json.dumps({k: v for k, v in result.items() if k != 'files'}, indent=2))


if __name__ == '__main__':
    main()
