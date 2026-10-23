#!/usr/bin/env python3
"""Validate/build a Cursor-only package without authentication or publication."""
import argparse
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = '.cursor-plugin/plugin.json'
SKILLS = ('skills/nambli', 'skills/nambli-content', 'skills/nambli-publish',
          'ecosystems/cursor/skills/nambli-cursor-publish')
FIXED = (MANIFEST, 'ecosystems/cursor/mcp.json', 'LICENSE', 'assets/logo.png',
         'ecosystems/cursor/README.md', 'ecosystems/cursor/ACCEPTANCE.md',
         'ecosystems/cursor/MARKETPLACE.md', 'ecosystems/cursor/JOURNAL.md',
         'ecosystems/cursor/publication-journal.mjs', 'ecosystems/cursor/browser-launcher.cjs',
         'ecosystems/cursor/RUNTIME.md')
TREES = (*SKILLS, 'ecosystems/cursor/rules')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def safe_path(root, relative):
    require(isinstance(relative, str) and relative and '\\' not in relative,
            'Component path must use relative forward-slash paths')
    path = Path(relative)
    require(not path.is_absolute() and '..' not in path.parts and ':' not in relative,
            'Component path must remain inside the plugin')
    for parent in [root, *(root / path).parents]:
        if parent == root.parent:
            break
        require(not parent.is_symlink() and not (hasattr(parent, 'is_junction') and parent.is_junction()),
                'Links/junctions are excluded from the Cursor package')
    result = root / path
    require(not result.is_symlink() and not (hasattr(result, 'is_junction') and result.is_junction())
            and result.resolve().is_relative_to(root.resolve()),
            f'Unsafe package path: {relative}')
    return result


def export_paths(root=ROOT):
    paths = set(FIXED)
    for tree in TREES:
        directory = safe_path(root, tree)
        require(directory.is_dir(), f'Missing component directory: {tree}')
        for item in directory.rglob('*'):
            relative = item.relative_to(root).as_posix()
            safe_path(root, relative)
            require(not item.is_symlink() and not (hasattr(item, 'is_junction') and item.is_junction()),
                    f'Linked package file: {relative}')
            if item.is_file():
                paths.add(relative)
    for relative in paths:
        path = safe_path(root, relative)
        require(path.is_file(), f'Missing package file: {relative}')
        require(path.suffix in ('.md', '.mdc', '.json', '.mjs', '.cjs', '.yaml', '.png') or relative == 'LICENSE',
                f'Unexpected package file type: {relative}')
        require(not any(part.startswith('.') for part in Path(relative).parts[1:]),
                f'Hidden nested package file: {relative}')
    return sorted(paths)


def rule_metadata(source):
    """Read the simple MDC frontmatter scalars used by our native Cursor rule."""
    require(source.startswith('---\n'), 'Cursor rule YAML frontmatter missing')
    parts = source.split('---', 2)
    require(len(parts) == 3, 'Cursor rule YAML frontmatter is not closed')
    result = {}
    for line in parts[1].splitlines():
        if not line.strip():
            continue
        key, separator, value = line.partition(':')
        require(separator and key in ('description', 'alwaysApply') and key not in result,
                'Unexpected/duplicate Cursor rule frontmatter key')
        value = value.strip()
        if key == 'alwaysApply':
            try:
                result[key] = json.loads(value)
            except json.JSONDecodeError as error:
                raise ValueError('Cursor alwaysApply must be a YAML Boolean') from error
            require(type(result[key]) is bool, 'Cursor alwaysApply must be a YAML Boolean')
        else:
            result[key] = value
    return result


def validate(root=ROOT):
    root = Path(root).resolve()
    manifest = json.loads((root / MANIFEST).read_text(encoding='utf-8'))
    require(manifest['name'] == 'nambli', 'Cursor plugin identity must be nambli')
    require(re.fullmatch(r'\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?', manifest['version']),
            'Cursor version must be semantic')
    require(manifest['author'] == {'name': 'Tor Production'}, 'Cursor author drift')
    require(manifest['homepage'] == 'https://nambli.com'
            and manifest['repository'] == 'https://github.com/Tor-Production/tor-event-calendar-ai',
            'Cursor public origins drift')
    require(manifest['license'] == 'MIT' and manifest['logo'] == 'assets/logo.png', 'Cursor brand/license drift')
    require(manifest['skills'] == ['./' + skill for skill in SKILLS], 'Cursor shared skill routing drift')
    require(manifest['rules'] == './ecosystems/cursor/rules' and manifest['mcpServers'] == './ecosystems/cursor/mcp.json',
            'Cursor component routing drift')
    require(not {'variables', 'hooks', 'apps'} & manifest.keys(), 'Unexpected credentials, hooks or private bindings')
    if (root / 'package.json').is_file():
        require(manifest['version'] == json.loads((root / 'package.json').read_text(encoding='utf-8'))['version'],
                'Shared source/Cursor version drift')
    mcp = json.loads((root / 'ecosystems/cursor/mcp.json').read_text(encoding='utf-8'))
    require(mcp == {'mcpServers': {'nambli': {'url': 'https://nambli.com/mcp',
                    'auth': {'CLIENT_ID': 'zkXDIukpTsBiLRtsUZHabCwtWHBweCLm',
                             'scopes': ['calendar.read', 'calendar.manage', 'offline_access']}},
                    'nambli-browser': {'command': 'node',
                                      'args': ['${CURSOR_PLUGIN_ROOT}/ecosystems/cursor/browser-launcher.cjs']}}},
            'Cursor must use the canonical OAuth MCP/public client and pinned supported browser without secrets, unsafe flags or owner paths')
    for directory in SKILLS:
        source = (root / directory / 'SKILL.md').read_text(encoding='utf-8')
        require(source.startswith('---\n') and len(source.split('---', 2)) == 3, 'Skill frontmatter missing')
        require(re.search(r'^name:\s*' + re.escape(Path(directory).name) + r'\s*$', source.split('---', 2)[1], re.M),
                'Skill identity drift')
    core = (root / 'skills/nambli/SKILL.md').read_text(encoding='utf-8')
    require('disable-model-invocation: true' in core.split('---', 2)[1], 'Core calendar invocation must remain explicit')
    rule = rule_metadata((root / 'ecosystems/cursor/rules/nambli-runtime.mdc').read_text(encoding='utf-8'))
    require(rule.get('alwaysApply') is True and bool(rule.get('description')),
            'Scoped Cursor runtime rule must always load; core skill invocation remains explicit')
    paths = export_paths(root)
    # Check every package-local Markdown link, including the adapter -> canonical skill route.
    path_set = set(paths)
    for relative in paths:
        if Path(relative).suffix not in ('.md', '.mdc'):
            continue
        for target in re.findall(r'\]\(([^\s)]+)(?:\s+[^)]*)?\)', (root / relative).read_text(encoding='utf-8')):
            target = target.split('#')[0]
            if not target or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target):
                continue
            resolved = (root / relative).parent.joinpath(target).resolve()
            require(resolved.is_relative_to(root) and resolved.relative_to(root).as_posix() in path_set,
                    f'Unpackaged Markdown target: {relative} -> {target}')
    return {'result': 'PASS', 'target': 'cursor', 'pluginId': manifest['name'], 'version': manifest['version'],
            'files': len(paths), 'nativeAcceptance': 'not established by source checks',
            'marketplacePublished': False}


def build(root=ROOT, output_dir=None, artifact_suffix=None):
    root = Path(root).resolve()
    result = validate(root)
    paths = export_paths(root)
    destination = Path(output_dir) if output_dir else root / 'dist/cursor'
    destination.mkdir(parents=True, exist_ok=True)
    require(artifact_suffix is None or re.fullmatch(r'[a-z0-9][a-z0-9-]{0,79}', artifact_suffix),
            'Artifact suffix must be a bounded lowercase commit/candidate label')
    suffix = f'-{artifact_suffix}' if artifact_suffix else ''
    output = destination / f'nambli-cursor-{result["version"]}{suffix}.zip'
    payload = io.BytesIO()
    with zipfile.ZipFile(payload, 'w') as archive:
        for relative in paths:
            entry = zipfile.ZipInfo(relative, (2026, 10, 21, 0, 0, 0))
            entry.compress_type = zipfile.ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, (root / relative).read_bytes(), compresslevel=9)
    archive_bytes = payload.getvalue()
    require(not output.exists() or output.read_bytes() == archive_bytes,
            'Archive already exists with different bytes; preserve it and choose --artifact-suffix')
    output.write_bytes(archive_bytes)
    receipt = {**result, 'distribution': 'unreleased-cursor-candidate', 'archive': output.name,
               'receiptFile': f'build-receipt{suffix}.json',
               'sha256': hashlib.sha256(archive_bytes).hexdigest(),
               'fileHashes': {p: hashlib.sha256((root / p).read_bytes()).hexdigest() for p in paths}}
    (destination / receipt['receiptFile']).write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    return receipt


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=('validate', 'build'))
    parser.add_argument('--output-dir', type=Path)
    parser.add_argument('--artifact-suffix')
    args = parser.parse_args()
    print(json.dumps(build(output_dir=args.output_dir, artifact_suffix=args.artifact_suffix) if args.action == 'build' else validate(), indent=2))


if __name__ == '__main__':
    main()
