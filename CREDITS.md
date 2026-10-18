# Credits and provenance

- **Project:** Covercheck, a new SafeSpace Hacks prototype initiated 18 October 2026 for Jhona / EazyHood.
- **AI assistance:** Codex generated and iterated the implementation, synthetic fixtures, documentation and tests. Separate Codex agents performed implementation-independent checks and browser review. This is agent testing, not a professional certification or a study with real users. No claim of exclusively human authorship is made.
- **Original work:** browser image validation, raster masking, byte checks, interface, illustration and synthetic support example were written for this project. No prior EazyHood application is resubmitted as this project.
- **Reuse disclosed:** `server.mjs` adapts the static development server originally written for Six-Ball Review. It serves local assets only. No Six-Ball Review dataset, model, analytical output or application interface is reused.
- **Runtime:** native browser Canvas, Blob, ImageBitmap and Web Crypto APIs; system fonts. No runtime npm library, remote font, analytics package or external image asset.
- **Testing:** Node.js built-in test/assert modules, Python standard library, and [Pillow](https://pillow.readthedocs.io/en/stable/about.html), licensed under the HPND/PIL software license. Pillow is not included in the distributed app.
- **Fixtures:** original generated images containing fictional labels, an `.invalid` address and an explicitly fake token. `make_fixtures.py` records intended orientation/metadata cases; `fixtures/manifest.json` records hashes. The example is not evidence of a real person's experience or a real incident.
- **License:** project code, original visuals and fixtures are MIT licensed. The MIT notice is in `LICENSE`.

## Primary technical references

- [W3C PNG specification](https://www.w3.org/TR/png-3/) — chunks, CRCs, image structure and animation.
- [WHATWG HTML: Canvas](https://html.spec.whatwg.org/multipage/canvas.html) — raster drawing and serialization.
- [WHATWG HTML: ImageBitmap](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html) — image decoding and orientation behavior.

## Existing alternatives

The preparatory comparison used official documentation for [Microsoft Snipping Tool](https://support.microsoft.com/en-au/windows/apps/use-snipping-tool-to-capture-screenshots), [ShareX Image Editor](https://getsharex.com/docs/image-editor) and [Shottr](https://shottr.cc/). Their documented capabilities establish that local image redaction is an existing category. We did not run a comparative product test and make no claim that these tools export unsafe files. None of their code or artwork was copied. No affiliation or endorsement is implied.
