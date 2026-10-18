"""Check an actual downloaded PNG with Pillow and an independent chunk reader.

This is a reproducibility utility, not a privacy assessment. Coordinates describe
the oriented output. Inputs to the included demonstrations are synthetic only.
"""
import argparse
import hashlib
import json
import struct
import zlib
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageOps

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('png', type=Path)
parser.add_argument('--rect', nargs=4, type=int, action='append', required=True,
                    metavar=('X', 'Y', 'WIDTH', 'HEIGHT'))
parser.add_argument('--report', type=Path)
parser.add_argument('--reference-jpeg', type=Path,
                    help='Optional synthetic JPEG: require exact EXIF-transposed pixel equality outside masks too.')
args = parser.parse_args()
raw = args.png.read_bytes()
assert raw[:8] == b'\x89PNG\r\n\x1a\n', 'PNG signature'
pos, chunks = 8, []
while pos < len(raw):
    assert pos + 12 <= len(raw), 'Truncated chunk'
    size = struct.unpack_from('>I', raw, pos)[0]
    kind = raw[pos+4:pos+8]
    end = pos + 12 + size
    assert end <= len(raw), 'Chunk bounds'
    expected_crc = struct.unpack_from('>I', raw, pos+8+size)[0]
    assert zlib.crc32(raw[pos+4:pos+8+size]) & 0xffffffff == expected_crc, 'Chunk CRC'
    assert kind in (b'IHDR', b'IDAT', b'IEND'), 'Unexpected ancillary/metadata chunk'
    chunks.append(kind.decode('ascii'))
    pos = end
    if kind == b'IEND':
        assert size == 0, 'Nonempty IEND'
        break
assert pos == len(raw), 'Trailing data'
assert chunks[0] == 'IHDR' and chunks[-1] == 'IEND', 'Chunk boundary order'
assert chunks.count('IHDR') == 1 and all(c == 'IDAT' for c in chunks[1:-1]), 'Chunk sequence'
assert len(chunks) >= 3, 'Missing image data'
image = Image.open(args.png).convert('RGBA')
assert image.getchannel('A').getextrema() == (255, 255), 'Transparent output'
for x, y, width, height in args.rect:
    assert 0 <= x < image.width and 0 <= y < image.height and width > 0 and height > 0
    assert x + width <= image.width and y + height <= image.height
    crop = image.crop((x, y, x+width, y+height))
    assert crop.getextrema() == ((23,23),(29,29),(32,32),(255,255)), 'Covered pixels differ'
result = {'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
          'width': image.width, 'height': image.height, 'chunks': chunks,
          'all_output_opaque': True, 'selected_pixels_match': True,
          'covered_pixel_checks': sum(w*h for x,y,w,h in args.rect),
          'overlap_counted_per_region': True}
if args.report:
    report = json.loads(args.report.read_text(encoding='utf-8-sig'))
    for key in ('sha256', 'bytes', 'width', 'height', 'covered_pixel_checks'):
        assert report[key] == result[key], f'Report mismatch: {key}'
    result['report_matches'] = True
if args.reference_jpeg:
    reference = ImageOps.exif_transpose(Image.open(args.reference_jpeg)).convert('RGBA')
    draw = ImageDraw.Draw(reference)
    for x,y,width,height in args.rect:
        draw.rectangle((x,y,x+width-1,y+height-1), fill=(23,29,32,255))
    assert reference.size == image.size, 'Oriented dimensions differ'
    delta = ImageChops.difference(reference, image)
    assert all(extrema == (0,0) for extrema in delta.getextrema()), 'Pixels differ from oriented JPEG + masks'
    result['exact_oriented_jpeg_match'] = True
print(json.dumps(result, indent=2))
