# Validation record

Date: 18 October 2026. Scope: synthetic fixtures, local app served over HTTP on loopback, Windows / Microsoft Edge. No real personal images, user research, privacy certification or performance benchmark was used. Results describe this tested prototype, not every browser or every possible image.

## Automated checks

`npm test`: **9 tests passed**. These cover the known CRC vector, PNG dimensions and metadata, APNG/trailing/truncated/SVG rejection, bad PNG CRC, all eight JPEG containers, JPEG EOI/trailing rejection, outward rectangle rounding/reversed drags/clamping, invalid/empty/oversized region sets, and byte limits. The JPEG unit test checks containers only; actual orientation evidence is separately described below.

JavaScript syntax checks passed for `dist/app.js` and `dist/core.js`.

## Exact downloaded PNG gate

The synthetic 640 × 400 RGBA fixture includes `tEXt`/`iTXt` sentinel metadata, RGB under alpha zero and a partly transparent patch. Through the real browser file chooser, the fixture was opened and a region `(20,70,360,90)` was applied. The app encoded, reopened, checked and downloaded a PNG plus its report.

An independent Python/Pillow decode and separate `struct`/`zlib` chunk reader checked the downloaded file, not a canvas screenshot:

- SHA-256: `df8f422612e55d915ee2206b3a1ce8e5f8e796720e8b034aaa3c43872ef80d2b`, matching its report.
- 640 × 400 pixels and **32,400 covered pixels** equal exactly `(23,29,32,255)`.
- Every output pixel is opaque. A known fully transparent source patch becomes white.
- Only IHDR, IDAT and IEND chunks remain; all CRCs are valid, no trailing container bytes, no fixture metadata sentinels.
- A separate reviewing agent independently rechecked output structure and decoded pixels.

An implementation-independent reviewer also compared **eight browser-downloaded exports**, one for each synthetic JPEG EXIF orientation, with Pillow `ImageOps.exif_transpose` plus a `(0,0,10,10)` opaque mask. All eight matched every RGBA pixel exactly: maximum channel difference **0**. Orientations 1–4 produced 640 × 400; 5–8 produced 400 × 640. All had minimum permitted chunks, valid CRCs, no extra image-stream/container data, opaque alpha and no EXIF sentinel.

These exact hashes and compression sizes are browser-generated evidence. Other encoders may produce different bytes for equivalent pixels. The app checks each newly generated file rather than expecting a golden hash.

## Browser workflow checks

- The built-in support example completed add/apply/build/review/download and report download. A separate root-agent check repeated that full flow.
- A pending coordinate draft immediately clears previous results, unchecks review, hides download and blocks building until apply/cancel. Applying coordinates and rebuilding requires a new review.
- Changing a checked image through a keyboard arrow invalidates the result; Undo restores the preceding coordinates and requires another check.
- Home links to the workspace without reloading the in-memory session.
- Clear session returns to the empty view and focuses Choose image; originals/downloads remain unchanged.
- APNG was rejected through the actual file chooser, preserving the prior valid image rather than replacing it with a partial decode.
- At a 320 × 740 emulated viewport, the root agent completed coordinate editing and building using Enter with no horizontal document overflow (305 px client width and scroll width). This is responsive browser testing, not physical-device or screen-reader certification.

Two discovered interaction defects were fixed before handoff: a Home link that reloaded the session and checked-state reuse after an uncommitted coordinate edit. The reviewer also identified a stale drag preview when a drag returned to an empty area; that preview now clears on invalid geometry.

## Remaining limits

No claim is made of exhaustive malformed-image handling, adversarial browser security, accessibility conformance, user acceptance or speed on low-memory devices. The caps may still be demanding on some devices. Untested browsers may differ in decoding, color handling and API availability; errors block export. Color/profile metadata is deliberately not retained in the minimal PNG and visual appearance can change. A user can still miss information or select a region too narrowly. The checks do not evaluate content outside the chosen regions.

The static HTML carries a meta Content Security Policy suitable for Pages, including `connect-src 'none'`. The local server also supplies an HTTP policy header. `frame-ancestors 'none'` exists only in that header because browsers ignore the directive in meta; it is not claimed for headerless static hosting. No independent network-traffic capture was performed, and the absence of content-upload code is not described as a traffic measurement.

After adding the meta policy, the actual synthetic-example flow was repeated in Edge with both meta and local-header policies active: load, apply `(45,235,580,150)`, build/check, visual review, PNG download and report download. The received 48,235-byte PNG passed `validate_export.py`: 1100 × 640, 87,000 exact covered-pixel checks, opaque output, permitted chunks/CRCs and report match. Its SHA-256 is `f99eaa7bf316e24c8839729c5f8673c964138c17a272c83822ce0df99d43ddb5`. No app CSP violation appeared in the inspected console log; unrelated extension warnings were present. This verifies that the flow works with the meta policy, and is not a network-traffic capture or a published-host test.

`validate_export.py` is provided to reproduce pixel/chunk checks on new downloaded files with a different decoding library. Private coordination and QA logs are intentionally excluded from the repository.
