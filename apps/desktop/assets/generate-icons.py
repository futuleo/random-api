"""Rebuild the original rectangle-based SVG icon using Python's standard library.

Run from the repository root: python3 apps/desktop/assets/generate-icons.py
No network, external image tools, or application dependencies are needed.
"""

from math import ceil, floor, hypot
from pathlib import Path
import struct
import xml.etree.ElementTree as ET
import zlib


DIRECTORY = Path(__file__).resolve().parent
SVG = ET.parse(DIRECTORY / "icon.svg").getroot()
SVG_NAMESPACE = "{http://www.w3.org/2000/svg}"
VIEW_SIZE = float(SVG.attrib["viewBox"].split()[2])


def rectangles(element, inherited=None):
    attributes = {**(inherited or {}), **element.attrib}
    if element.tag == f"{SVG_NAMESPACE}rect":
        yield attributes
    for child in element:
        yield from rectangles(child, attributes)


def png_chunk(kind, data):
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data))
    )


def render_png(size):
    pixels = bytearray(size * size * 4)
    scale = size / VIEW_SIZE
    for rectangle in rectangles(SVG):
        x, y, width, height, radius = (
            float(rectangle.get(key, "0")) * scale
            for key in ("x", "y", "width", "height", "rx")
        )
        stroke = float(rectangle.get("stroke-width", "0")) * scale
        outline = rectangle.get("fill") == "none"
        color = rectangle["stroke" if outline else "fill"].lstrip("#")
        rgb = tuple(int(color[index : index + 2], 16) for index in (0, 2, 4))
        margin = stroke / 2 + 1 if outline else 1
        for row in range(max(0, floor(y - margin)), min(size, ceil(y + height + margin))):
            for column in range(
                max(0, floor(x - margin)), min(size, ceil(x + width + margin))
            ):
                qx = abs(column + 0.5 - x - width / 2) - (width / 2 - radius)
                qy = abs(row + 0.5 - y - height / 2) - (height / 2 - radius)
                distance = (
                    hypot(max(qx, 0), max(qy, 0))
                    + min(max(qx, qy), 0)
                    - radius
                )
                if outline:
                    distance = abs(distance) - stroke / 2
                coverage = max(0, min(1, 0.5 - distance))
                if coverage == 0:
                    continue
                offset = (row * size + column) * 4
                previous_alpha = pixels[offset + 3] / 255
                alpha = coverage + previous_alpha * (1 - coverage)
                for channel in range(3):
                    pixels[offset + channel] = round(
                        (
                            rgb[channel] * coverage
                            + pixels[offset + channel]
                            * previous_alpha
                            * (1 - coverage)
                        )
                        / alpha
                    )
                pixels[offset + 3] = round(alpha * 255)
    rows = b"".join(
        b"\0" + pixels[row * size * 4 : (row + 1) * size * 4]
        for row in range(size)
    )
    return (
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + png_chunk(b"IDAT", zlib.compress(rows, 9))
        + png_chunk(b"IEND", b"")
    )


def main():
    sizes = (16, 32, 48, 64, 128, 256, 512, 1024)
    images = {size: render_png(size) for size in sizes}
    (DIRECTORY / "icon.png").write_bytes(images[1024])

    entries = ((b"icp4", 16), (b"icp5", 32), (b"icp6", 64),
               (b"ic07", 128), (b"ic08", 256), (b"ic09", 512), (b"ic10", 1024))
    chunks = b"".join(
        kind + struct.pack(">I", len(images[size]) + 8) + images[size]
        for kind, size in entries
    )
    (DIRECTORY / "icon.icns").write_bytes(
        b"icns" + struct.pack(">I", len(chunks) + 8) + chunks
    )

    ico_sizes = (16, 32, 48, 256)
    offset = 6 + 16 * len(ico_sizes)
    directory = bytearray(struct.pack("<HHH", 0, 1, len(ico_sizes)))
    for size in ico_sizes:
        directory.extend(
            struct.pack(
                "<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32,
                len(images[size]), offset
            )
        )
        offset += len(images[size])
    (DIRECTORY / "icon.ico").write_bytes(
        directory + b"".join(images[size] for size in ico_sizes)
    )


if __name__ == "__main__":
    main()
