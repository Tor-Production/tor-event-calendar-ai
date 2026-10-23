#!/usr/bin/env python3
"""Verify the scoped Cursor preview export; no network, credentials or sends."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import subprocess
import tempfile

PLUGIN = Path(__file__).resolve().parents[1]
REPO = PLUGIN.parents[2]
PREFIX = 'plugins/cursor/nambli/'
SOURCE = '266e2739a27b81574198e3715a8d914bab5835d9'
BASE = 'fde98a8a38e965c30d91645f120fe43e8f77cccf'
DELTA = {'.cursor-plugin/plugin.json', 'ecosystems/cursor/MARKETPLACE.md'}
DESCRIPTION = 'Manage your private calendar and prepare social content drafts with nambli.'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(payload):
    return hashlib.sha256(payload).hexdigest()


def git(*args):
    return subprocess.check_output(['git', *args], cwd=REPO)


def validate(plugin=PLUGIN, scope=True):
    provenance = json.loads((plugin / 'PROVENANCE.json').read_text(encoding='utf-8'))
    require(provenance['sourceCommit'] == SOURCE and provenance['releaseBase'] == BASE,
            'Pinned source/release base drift')
    require(set(provenance['metadataChanges']) == DELTA, 'Unreviewed source delta')
    require(len(provenance['sourceFiles']) == 28, 'Original allowlist must contain 28 files')
    inventory = {p.relative_to(plugin).as_posix() for p in plugin.rglob('*')
                 if p.is_file() and '__pycache__' not in p.parts}
    expected = set(provenance['sourceFiles']) | set(provenance['addedFiles']) | {'PROVENANCE.json'}
    require(inventory == expected, 'Export inventory differs from reviewed allowlist')
    for relative, hashes in provenance['sourceFiles'].items():
        source = git('show', f'{SOURCE}:{relative}')
        exported = (plugin / relative).read_bytes()
        require(digest(source) == hashes['sourceSha256'], f'Source hash changed: {relative}')
        require(digest(exported) == hashes['exportSha256'], f'Export hash changed: {relative}')
        require(relative in DELTA or exported == source, f'Unexpected byte change: {relative}')
    for relative, sha256 in provenance['addedFiles'].items():
        require(digest((plugin / relative).read_bytes()) == sha256, f'Added file changed: {relative}')

    manifest = json.loads((plugin / '.cursor-plugin/plugin.json').read_text(encoding='utf-8'))
    original = json.loads(git('show', f'{SOURCE}:.cursor-plugin/plugin.json'))
    require(manifest == {**original, 'version': '0.3.3-cursor.1', 'description': DESCRIPTION},
            'Only reviewed Cursor version/description may change')
    for value in [*manifest['skills'], manifest['rules'], manifest['mcpServers'], manifest['logo']]:
        target = (plugin / value).resolve()
        require(target.is_relative_to(plugin.resolve()) and target.exists(), f'Unsafe component: {value}')
    for relative in inventory:
        if Path(relative).suffix not in ('.md', '.mdc'):
            continue
        for target in re.findall(r'\]\(([^\s)]+)(?:\s+[^)]*)?\)',
                                 (plugin / relative).read_text(encoding='utf-8')):
            target = target.split('#')[0]
            if not target or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target):
                continue
            path = (plugin / relative).parent.joinpath(target).resolve()
            require(path.is_relative_to(plugin.resolve()) and path.exists(),
                    f'Broken/outside Markdown link: {relative} -> {target}')
    marketplace = json.loads((REPO / '.cursor-plugin/marketplace.json').read_text(encoding='utf-8'))
    require(marketplace == {
        'name': 'nambli-cursor', 'owner': {'name': 'Tor Production'},
        'metadata': {'description': 'nambli calendar and content draft tools for Cursor'},
        'plugins': [{'name': 'nambli', 'source': './plugins/cursor/nambli', 'description': DESCRIPTION}]
    }, 'Cursor marketplace must resolve the reviewed nested plugin only')
    if scope:
        changed = set(git('diff', '--name-only', BASE).decode().splitlines())
        changed.update(git('ls-files', '--others', '--exclude-standard').decode().splitlines())
        require(all(p == '.cursor-plugin/marketplace.json' or p.startswith(PREFIX) for p in changed),
                'Release changes a stable file outside the Cursor export')
    return {'result': 'PASS', 'sourceFiles': 28, 'unchangedSourceFiles': 26,
            'metadataChanges': sorted(DELTA), 'totalFiles': len(inventory),
            'stableOutsideCursorChanged': False, 'nativeMacLauncher': 'pending',
            'marketplacePublished': False}


def self_test():
    scratch = REPO / 'work'
    scratch.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='nambli-cursor-release-', dir=scratch) as temporary:
        copy = Path(temporary) / 'plugin'
        shutil.copytree(PLUGIN, copy, ignore=shutil.ignore_patterns('__pycache__'))
        target = copy / 'ecosystems/cursor/mcp.json'
        target.write_bytes(target.read_bytes() + b' ')
        try:
            validate(copy, scope=False)
        except ValueError as error:
            require('Export hash changed:' in str(error), 'Unexpected corruption failure')
        else:
            raise ValueError('Corrupted calendar/browser configuration was accepted')
        shutil.copyfile(PLUGIN / 'ecosystems/cursor/mcp.json', target)
        (copy / 'unexpected-token.txt').write_text('synthetic-not-a-token', encoding='utf-8')
        try:
            validate(copy, scope=False)
        except ValueError as error:
            require('inventory' in str(error), 'Unexpected inventory failure')
        else:
            raise ValueError('Unreviewed extra file was accepted')
    return {'corruptedMcpRejected': True, 'unreviewedFileRejected': True}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--self-test', action='store_true')
    arguments = parser.parse_args()
    result = validate()
    if arguments.self_test:
        result['negativeChecks'] = self_test()
    print(json.dumps(result, indent=2))
