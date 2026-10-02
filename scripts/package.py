#!/usr/bin/env python3
"""Deterministic, safe public plugin ZIP. Run after npm pack for CLI tarball."""
import hashlib
import json
import struct
import subprocess
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
DIST = ROOT / 'dist'
ALLOW = ('src', 'skills', 'assets', 'docs', 'submission', 'scripts', 'ecosystems/claude-code', '.codex-plugin', '.claude-plugin', '.agents/plugins/marketplace.json',
         'package.json', 'package-lock.json', 'plugin.json', 'mcp.json', '.mcp.json',
         'README.md', 'LICENSE', '.gitignore', '.gitattributes')
ALLOW += ('ecosystems', 'contracts')

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
    validate_brand_assets()
    DIST.mkdir(exist_ok=True)
    output=DIST/f'tor-event-calendar-ai-plugin-{VERSION}.zip'
    tracked=subprocess.run(
        ['git', '-c', f'safe.directory={ROOT.as_posix()}', 'ls-files', '-z', '--', *ALLOW],
        cwd=ROOT, check=True, capture_output=True,
    ).stdout
    paths=[]
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
    skill=ROOT/'skills'/'nambli'
    skill_output=DIST/f'nambli-skill-{VERSION}.zip'
    with zipfile.ZipFile(skill_output,'w') as archive:
        for p in sorted(p for p in paths if p.is_relative_to(skill)):
            info=zipfile.ZipInfo(p.relative_to(skill.parent).as_posix(),(2026,9,28,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
            archive.writestr(info,p.read_bytes(),compresslevel=9)
    sums=[]
    for name in (f'tor-event-calendar-ai-{VERSION}.tgz', output.name, skill_output.name):
        p=DIST/name
        if not p.is_file(): raise RuntimeError(f'Missing release artifact: {p}')
        sums.append(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}')
    (DIST/'SHA256SUMS').write_text('\n'.join(sums)+'\n',encoding='utf-8')
    print(json.dumps({'version':VERSION,'archive':str(output),'files':len(paths),'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}))

if __name__=='__main__': main()
