#!/usr/bin/env python3
"""Deterministic, safe public plugin ZIP. Run after npm pack for CLI tarball."""
import argparse
import hashlib
import json
import re
import struct
import subprocess
import zipfile
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
DIST = ROOT / 'dist'
SKILL_NAMES = ('nambli', 'nambli-content', 'nambli-publish')
ALLOW = ('src', 'skills', 'assets', 'docs', 'submission', 'scripts', 'ecosystems/claude-code', '.codex-plugin', '.claude-plugin', '.agents/plugins/marketplace.json',
         'package.json', 'package-lock.json', 'plugin.json', 'mcp.json', '.mcp.json',
         'README.md', 'LICENSE', '.gitignore', '.gitattributes')
ALLOW += ('ecosystems', 'contracts')
CHATGPT_FILENAME = f'nambli-chatgpt-candidate-{VERSION}.zip'


def contained_file(root, name):
    """Resolve only regular package files; never follow a wrapper/symlink out."""
    relative = PurePosixPath(name)
    if (not name or name != name.strip() or '\\' in name or ':' in name
            or relative.is_absolute() or any(p in ('', '.', '..') for p in name.split('/'))):
        raise ValueError(f'Unsafe package path: {name}')
    root = root.resolve()
    path = root.joinpath(*relative.parts)
    if any(parent.is_symlink() for parent in (path, *path.parents) if parent != root):
        raise ValueError(f'Symlink excluded: {name}')
    if not path.resolve().is_relative_to(root) or not path.is_file():
        raise ValueError(f'Missing or unsafe package file: {name}')
    return path


def check_public_file(name, data):
    # These are accidental credential/App-binding guards, not a claim that an
    # arbitrary file can be proven secret-free. The closed component allowlist
    # below is the primary boundary.
    if (any(part.lower().startswith(('.env', 'credentials', 'profiles', 'private-account'))
            for part in PurePosixPath(name).parts)
            or name.endswith('.app.json') or 'marketplace' in name.lower()):
        raise ValueError(f'Private or marketplace file excluded: {name}')
    if not name.endswith(('.json', '.md', '.yaml', '.yml', '.mjs', '.py', '.txt')):
        return
    text = data.decode('utf-8')
    patterns = (r'(?:asdk_app_|plugin_sdk_app_|plugin_asdk_app_)[A-Za-z0-9_-]{16,}',
                r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
                r'\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}',
                r'\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}',
                r'(?i)["\']?(?:access_token|refresh_token|client_secret|api_key)["\']?\s*[:=]\s*["\'][A-Za-z0-9._~+/-]{16,}["\']')
    if any(re.search(pattern, text) for pattern in patterns):
        raise ValueError(f'Private App ID or credential-like content excluded: {name}')


def chatgpt_files(root=ROOT):
    """One portable remote-MCP plugin, with all three self-contained skills."""
    root = Path(root).resolve()
    names = {'plugin.json', 'mcp.json', 'LICENSE'}
    manifest = json.loads(contained_file(root, 'plugin.json').read_text(encoding='utf-8'))
    if manifest.get('$schema') != 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json':
        raise ValueError('ChatGPT target requires the portable root manifest')
    extension = manifest.get('extensions', {}).get('com.openai', {})
    if any(key in manifest or key in extension for key in ('apps', 'hooks')):
        raise ValueError('ChatGPT target cannot contain private App mappings or local hooks')
    for key in ('composerIcon', 'composerIconDark', 'logo', 'logoDark', 'screenshots'):
        value = extension.get('interface', {}).get(key)
        for asset in value if isinstance(value, list) else [value] if value else []:
            if not isinstance(asset, str) or not asset.startswith('./assets/'):
                raise ValueError(f'Invalid portable artwork path: {key}')
            names.add(asset[2:])
    for skill_name in SKILL_NAMES:
        skill = root / 'skills' / skill_name
        if not skill.is_dir() or skill.is_symlink():
            raise ValueError(f'Missing or unsafe skill: {skill_name}')
        for path in skill.rglob('*'):
            if path.is_symlink():
                raise ValueError(f'Symlink excluded: {path.relative_to(root)}')
            if path.is_file():
                name = path.relative_to(root).as_posix()
                contained_file(root, name)
                names.add(name)
        for relative in ('SKILL.md', 'agents/openai.yaml'):
            if f'skills/{skill_name}/{relative}' not in names:
                raise ValueError(f'Missing skill component: {skill_name}/{relative}')
    files = {name: contained_file(root, name).read_bytes() for name in sorted(names)}
    normalized = [name.casefold() for name in files]
    if len(normalized) != len(set(normalized)):
        raise ValueError('Case-colliding package paths')
    for name, data in files.items():
        check_public_file(name, data)
        if name.endswith('.json'):
            json.loads(data)
        if name.endswith('.md'):
            for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', data.decode('utf-8')):
                target = target.split(' ', 1)[0].strip('<>')
                if not target or target.startswith('#') or urlsplit(target).scheme:
                    continue
                linked = (root / name).parent / unquote(target.split('#', 1)[0])
                if not linked.resolve().is_relative_to(root):
                    raise ValueError(f'Resource escapes plugin: {name}')
                linked_name = linked.resolve().relative_to(root).as_posix()
                if linked_name not in files:
                    raise ValueError(f'Unpackaged skill resource: {name} -> {linked_name}')
    return files


def build_chatgpt(root=ROOT, output=None):
    files = chatgpt_files(root)
    output = Path(output) if output else DIST / CHATGPT_FILENAME
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w') as archive:
        for name, data in files.items():
            info = zipfile.ZipInfo(name, (2026, 9, 28, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data, compresslevel=9)
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix('.zip.sha256').write_text(f'{digest}  {output.name}\n', encoding='utf-8')
    return {'target': 'chatgpt', 'version': VERSION, 'archive': str(output),
            'files': len(files), 'bytes': output.stat().st_size, 'sha256': digest,
            'acceptance': 'static candidate only; not imported, submitted or published'}

def validate_brand_assets():
    # Packaging must preserve the owner's supplied artwork byte-for-byte.
    # Never regenerate or overwrite a logo as a side effect of building a ZIP.
    for name, minimum in (('icon.png', 48), ('logo.png', 256), ('icon-dark.png', 48), ('logo-dark.png', 256)):
        path = ROOT / 'assets' / name
        data = path.read_bytes()
        if len(data) < 24 or data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
            raise ValueError(f'{name} must be the approved PNG artwork')
        width, height = struct.unpack('!II', data[16:24])
        if width != height or not minimum <= width <= 4096 or len(data) > 5 * 1024 * 1024:
            raise ValueError(f'{name} must be square, {minimum}–4096 px and at most 5 MiB')

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', choices=('source', 'chatgpt'), default='source')
    args = parser.parse_args()
    validate_brand_assets()
    if args.target == 'chatgpt':
        print(json.dumps(build_chatgpt()))
        return
    DIST.mkdir(exist_ok=True)
    output=DIST/f'tor-event-calendar-ai-plugin-{VERSION}.zip'
    tracked=subprocess.run(
        ['git', '-c', f'safe.directory={ROOT.as_posix()}', 'ls-files', '-z', '--', *ALLOW],
        cwd=ROOT, check=True, capture_output=True,
    ).stdout
    paths=[]
    # Explicit new runtime files are included in uncommitted development builds too.
    required = ['src/claude-files.mjs', 'ecosystems/claude-code/local-files.mjs',
                'ecosystems/claude-code/AUTO-UPLOAD.md', 'scripts/test-claude-files.mjs',
                'scripts/test-claude-bootstrap.mjs', 'ecosystems/PUBLISHING_ARCHITECTURE.md']
    required += [f'skills/{name}/{relative}' for name in SKILL_NAMES
                 for relative in ('SKILL.md', 'agents/openai.yaml')]
    tracked_names = {raw.decode('utf-8') for raw in tracked.split(b'\0') if raw}
    for name in required:
        if name not in tracked_names:
            tracked += name.encode('utf-8') + b'\0'
    for raw in tracked.split(b'\0'):
        if not raw: continue
        p=ROOT/Path(raw.decode('utf-8'))
        if not p.is_file() or p.is_symlink(): raise RuntimeError(f'Invalid tracked package file: {p}')
        paths.append(p)
    with zipfile.ZipFile(output,'w') as archive:
        for p in sorted(paths):
            if p.is_symlink(): raise RuntimeError(f'Symlink excluded: {p}')
            info=zipfile.ZipInfo(p.relative_to(ROOT).as_posix(),(2026,9,28,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED; info.external_attr=0o100644<<16
            archive.writestr(info,p.read_bytes(),compresslevel=9)
    skill_outputs=[]
    for skill_name in SKILL_NAMES:
        skill=ROOT/'skills'/skill_name
        skill_output=DIST/f'{skill_name}-skill-{VERSION}.zip'
        skill_outputs.append(skill_output)
        with zipfile.ZipFile(skill_output,'w') as archive:
            for p in sorted(p for p in paths if p.is_relative_to(skill)):
                info=zipfile.ZipInfo(p.relative_to(skill.parent).as_posix(),(2026,9,28,0,0,0))
                info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
                archive.writestr(info,p.read_bytes(),compresslevel=9)
    sums=[]
    for name in (f'tor-event-calendar-ai-{VERSION}.tgz', output.name, *(p.name for p in skill_outputs)):
        p=DIST/name
        if not p.is_file(): raise RuntimeError(f'Missing release artifact: {p}')
        sums.append(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}')
    (DIST/'SHA256SUMS').write_text('\n'.join(sums)+'\n',encoding='utf-8')
    print(json.dumps({'version':VERSION,'archive':str(output),'files':len(paths),'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}))

if __name__=='__main__': main()
