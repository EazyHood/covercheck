# Covercheck

[Try the public demo](https://eazyhood.github.io/covercheck/) · [Source code](https://github.com/EazyHood/covercheck)

Cover selected regions of a local screenshot, then inspect the exact flattened PNG that will be downloaded. Built as a new SafeSpace Hacks prototype on 18 October 2026.

The intended use is narrow: preparing a support screenshot without sharing details that the person has chosen to cover. Covercheck does not discover private information or certify an image as safe.

## Run

Requires Node.js 20 or later; the application has no npm dependencies or build step.

```sh
npm test
npm start
```

Open `http://127.0.0.1:4188/`. The development server binds only to loopback. A production deployment serves the contents of `dist/` over HTTPS. No image upload endpoint is required. The source repository is not a backend.

`index.html` includes a Content Security Policy meta element before resource loads, so static hosting such as GitHub Pages retains `connect-src 'none'`, same-origin scripts/styles/fonts, and only same-origin/blob/data images. There are no inline scripts or styles. The local server additionally sends the policy as an HTTP header with `frame-ancestors 'none'`. Browsers do not support `frame-ancestors` in a meta policy: protection against framing is therefore applied by the local server header, and is **not claimed for a Pages deployment** without a hosting-layer header. Hosts that support response headers should preserve the complete policy in `server.mjs`.

## Complete workflow

1. Choose a static PNG/JPEG or try the clearly labeled synthetic example.
2. Drag rectangles, or use **Add** and the X/Y/width/height fields. Coordinates refer to the oriented source image, not the displayed CSS size. Apply or cancel coordinate drafts before checking. Select a region and use arrow keys to move it by one pixel, or Shift + arrows for ten. Undo/redo retain up to 50 operations.
3. **Build & check PNG** encodes a fresh opaque image. It then reopens those exact bytes and checks the selected pixels, full-image opacity, dimensions, chunk checksums and permitted PNG structure.
4. Inspect **Checked PNG** and everything that remains visible. Confirm the review to enable **Download checked PNG**. The preview is explicitly distinguished from a saved file.
5. Optionally download a JSON check report. Its SHA-256 identifies the output bytes; it does not establish privacy. Any edit, including an uncommitted coordinate draft, clears the check and review confirmation.

Clear session releases the application's references. Reloading closes the in-memory editing session. Original files, existing downloads and backups are unchanged.

## Input and output boundaries

- Input: static, non-interlaced, 8-bit PNG; 8-bit baseline/progressive JPEG. Signatures and container structure are examined rather than trusting filename/MIME.
- Limits: 12 MiB input, 16 million pixels, 8,192 pixels per side and 50 regions. These are resource caps, not a performance guarantee on every device.
- APNG, multi-picture JPEG, GIF, SVG, PDF, unsupported PNG formats, bad CRCs, truncated files and trailing container data are rejected. Browser decoding is an additional check; this is not a general-purpose format validator or malware scanner.
- JPEG EXIF orientation is applied before coordinates are set. Transparency is composited onto white. Color appearance and compression size may change through browser decoding and re-encoding.
- Output is a new opaque raster PNG, with only IHDR, IDAT and IEND chunks. Metadata and original JPEG/PNG segments are not copied. Every covered pixel must equal RGBA `(23,29,32,255)` in the decoded export.
- Coordinates are rounded outward for pointer drags. Regions may overlap; the report counts pixel checks per region, so overlapping pixels are counted more than once.

## Data flow and limits

Images and regions stay in tab memory. There is no image upload, remote OCR, analytics, persistent application storage, service worker or account. All application assets are local to the site; loading the page still contacts its host. Blob URLs are used only for downloads and revoked after 60 seconds.

These checks do not find missed details, remove context that identifies someone, inspect unselected pixels for steganography, erase originals or browser memory forensically, or secure a compromised browser/device. A failed check never prepares the normal download. A successful check covers only the stated properties of that file.

## Verification and reproduction

`npm test` runs the container/geometry tests without a browser. `fixtures/` contains only original synthetic test data; `make_fixtures.py` regenerates it using Python and Pillow. The fixture manifest records each file's SHA-256.

The independent `validate_export.py` utility checks an actual downloaded PNG using Pillow and a separate chunk reader:

```sh
python validate_export.py downloaded.png --rect 20 70 360 90 --report downloaded-report.json
python validate_export.py orientation-6-output.png --rect 0 0 10 10 --reference-jpeg fixtures/orientation-6.jpg
```

To reproduce the first command, load `fixtures/synthetic-alpha-metadata.png` in the app, set that rectangle, build, review and download both files. To reproduce the orientation check, use the indicated JPEG with a 10 × 10 rectangle at (0,0). Multiple `--rect` arguments are supported. Python/Pillow are test tools only and are not shipped to the browser. See [VALIDATION.md](VALIDATION.md) for measured results and coverage limits.

## Difference and credits

Image redaction already exists in tools such as Snipping Tool, ShareX and Shottr. Covercheck's contribution is a focused review flow tied to the actual output bytes, including explicit invalidation and a scoped file report. It does not claim a novel redaction algorithm or superior detection accuracy. A basic opaque rectangle plus canvas export can also produce correctly covered pixels; there is no head-to-head user study or product benchmark here.

Original interface, image-processing code and fixtures were developed with disclosed Codex assistance for Jhona / EazyHood. The development server adapts earlier original Six-Ball Review infrastructure. See [CREDITS.md](CREDITS.md) and [LICENSE](LICENSE). No real personal data or competitor code is included.
