#!/usr/bin/env python3
"""Deterministic, safe public plugin ZIP. Run after npm pack for CLI tarball."""
import hashlib
import json
import struct
import zipfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VERSION = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
DIST = ROOT / 'dist'
ALLOW = ('src', 'skills', 'assets', 'docs', 'submission', 'scripts', '.codex-plugin', '.claude-plugin',
         'package.json', 'package-lock.json', 'plugin.json', 'README.md', 'LICENSE', '.gitignore', '.gitattributes')

def logo(size):
    # Code-native Tor calendar mark, rendered directly from these geometric shapes.
    def point(x, y):
        def box(x0,y0,x1,y1): return x0 <= x < x1 and y0 <= y < y1
        if box(.22,.26,.78,.78):
            if box(.22,.26,.78,.40): return (203,166,247,255)
            if box(.31,.48,.69,.56) or box(.46,.53,.54,.70): return (203,166,247,255)
            return (30,30,46,255)
        if box(.33,.19,.40,.32) or box(.60,.19,.67,.32): return (205,214,244,255)
        return (30,30,46,255)
    data = bytearray()
    for y in range(size):
        data.append(0)
        for x in range(size): data.extend(point((x+.5)/size,(y+.5)/size))
    def chunk(kind, value): return struct.pack('!I',len(value))+kind+value+struct.pack('!I',zlib.crc32(kind+value)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('!2I5B',size,size,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(data,9))+chunk(b'IEND',b'')

def main():
    assets=ROOT/'assets'; assets.mkdir(exist_ok=True)
    (assets/'icon.png').write_bytes(logo(128)); (assets/'logo.png').write_bytes(logo(512))
    DIST.mkdir(exist_ok=True)
    output=DIST/f'tor-event-calendar-ai-plugin-{VERSION}.zip'
    paths=[]
    for entry in ALLOW:
        item=ROOT/entry
        if item.is_file(): paths.append(item)
        elif item.is_dir(): paths.extend(p for p in item.rglob('*') if p.is_file())
    with zipfile.ZipFile(output,'w') as archive:
        for p in sorted(paths):
            if p.is_symlink(): raise RuntimeError(f'Symlink excluded: {p}')
            info=zipfile.ZipInfo(p.relative_to(ROOT).as_posix(),(2026,9,28,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED; info.external_attr=0o100644<<16
            archive.writestr(info,p.read_bytes(),compresslevel=9)
    sums=[]
    for p in sorted(DIST.glob('*')):
        if p.suffix in ('.zip','.tgz'): sums.append(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.name}')
    (DIST/'SHA256SUMS').write_text('\n'.join(sums)+'\n',encoding='utf-8')
    print(json.dumps({'version':VERSION,'archive':str(output),'files':len(paths),'sha256':hashlib.sha256(output.read_bytes()).hexdigest()}))

if __name__=='__main__': main()
