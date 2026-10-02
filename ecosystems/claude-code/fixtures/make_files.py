"""Generate disposable PNG/PDF inputs in work/; no account or network access."""
import hashlib
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def png():
    def chunk(kind, value):
        return struct.pack('!I', len(value)) + kind + value + struct.pack('!I', zlib.crc32(kind + value))
    rows = (b'\0' + bytes([45, 110, 180]) * 32) * 32
    return (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!IIBBBBB', 32, 32, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b''))


def pdf():
    text = b'BT /F1 12 Tf 40 100 Td (Synthetic Claude Code connector file check. Do not publish.) Tj ET'
    objects = [b'<< /Type /Catalog /Pages 2 0 R >>',
               b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
               b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 500 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
               b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
               b'<< /Length ' + str(len(text)).encode() + b' >>\nstream\n' + text + b'\nendstream']
    data = b'%PDF-1.4\n'
    offsets = [0]
    for i, value in enumerate(objects, 1):
        offsets.append(len(data))
        data += f'{i} 0 obj\n'.encode() + value + b'\nendobj\n'
    start = len(data)
    data += f'xref\n0 {len(offsets)}\n0000000000 65535 f \n'.encode()
    data += b''.join(f'{offset:010d} 00000 n \n'.encode() for offset in offsets[1:])
    data += f'trailer\n<< /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{start}\n%%EOF\n'.encode()
    return data


if __name__ == '__main__':
    destination = ROOT / 'work/claude-code-fixtures'
    destination.mkdir(parents=True, exist_ok=True)
    sums = []
    for name, data in [('image.png', png()), ('brief.pdf', pdf())]:
        (destination / name).write_bytes(data)
        sums.append(f'{hashlib.sha256(data).hexdigest()}  {name}')
    (destination / 'SHA256SUMS').write_text('\n'.join(sums) + '\n', encoding='utf-8')
    print(destination)
