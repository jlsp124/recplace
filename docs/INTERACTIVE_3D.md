# RECPLACE interactive exterior

The homepage has an **Explore RECPLACE** section before Intended uses. The
redundant Building identity section has been removed; its `/#design` anchor
remains. The same viewer appears on `/plans/`, before the floor overview.
Home, Plans and Leasing link to a larger dedicated experience at `/explore/`.
The existing visual language and other public routes remain in place.

## Source selection and scope

The main source is the larger **Recplace-3D-Model-v1.zip** (1,575,869 bytes), rather
than **Recplace-3D-Model-v1-1.zip** (128,665 bytes). Both contain the corrected
exterior study; the larger package also supplies the drawing/aerial context.

- Selected base: `recplace-exterior-v1.glb`, 500,892 bytes, rebuilt from its
  corresponding `recplace-model.json` to restore meaningful floor/object groups.
- Source GLB SHA-256:
  `1ddda96146b880a23998eb0ad1b73656a00c85c67db03dd4df3c6462490e3be8`.
- Larger ZIP SHA-256:
  `0d095532b52609b76cf8d44d36d1a81770f87f4b63b836e6c98f2b91b24bf14e`.
- The unchanged part list and supplied provenance/limitations are retained in
  `scripts/3d-source/`. The original ZIPs are untouched.
- Both GLBs were inspected. `recplace-on-property.glb` adds a flat aerial and
  annotated site-plan plane to the same exterior. Its capture date is unknown.
  It is useful reference context but is not included in the public viewer.

The supplied README identifies a May 14, 2026 IFC drawing basis. The drawing PDFs
were not supplied with this task, so their currency and the reconstruction's
dimensional accuracy were not independently certified. The professional front
and angle renders guide appearance; they are not projected onto the building.

## Model and presentation changes

- Preserve the supplied 54.864 × 20.726 m grid, 4.877 m entrance recess, floor
  elevations, notched envelope, canopy locations, parapets and roof features.
- Trim window frames/mullions to the final visible glazing rectangles, correcting
  lines that extended onto opaque facade panels in the supplied reconstruction.
- Move thin facade overlays consistently ahead of the parapet surfaces to remove
  intersections in the upper glazing. This is a presentation offset, not a change
  to the building footprint or claimed wall construction.
- Give the existing entrance surround shallow relief; separate its stone finish
  from the warm white canopy finish. Add thin dark canopy caps and soffits.
- Use linearized material factors, warm off-white panels, charcoal vertical
  elements, restrained orange formliner, textured entrance stone, and darker
  glazing. Small procedural finish textures are embedded in the GLB.
- The viewer adds physical glass shading with restrained clearcoat, a small
  generated outdoor reflection environment, directional light, hemisphere fill,
  tone mapping and cached soft shadow maps. The neutral ground is illustrative.
- Place RECPLACE / PROFESSIONAL CENTRE on the existing entrance surround, using
  the supplied front rendering as the placement reference. This text treatment
  is created in the viewer; it is not baked into the standalone GLB.
- Restore the missing triangular sides of the rooftop stair enclosures. Export
  each nondegenerate triangle independently, then assert that every wedge edge
  has exactly two incident triangles so each enclosure remains closed.
- Start at an elevated perspective. Perspective, Entrance, Opposite side and
  Overview use bounds-aware framing; zoom remains under visitor control.
- Add opt-in Slow orbit and an expanded viewport with Escape to close, keyboard
  focus containment and scroll restoration. Direct manipulation stops orbiting.

The result is an interactive architectural illustration. It does not match the
professional renders' photorealism. Those renders remain the first impression
and the fallback. No synthetic tenant names, suite boundaries, availability,
parking layout, interior spaces or new landscape features have been introduced.

## Loading, fallback and mobile

The regular page downloads a small controller and scoped stylesheet.
It reuses the existing `building-angle.webp` as a lazy static poster. Merely
scrolling to the section on Home or Plans does **not** fetch Three.js or the GLB.
The dedicated Explore page starts the viewer directly, retaining the same fallback.

Clicking Explore in 3D imports the self-hosted engine bundle (approximately 598 KB
before HTTP compression) and the 418,152-byte Meshopt GLB. The source
interaction map is for future clients and is not fetched by this viewer.
The build compresses geometry losslessly and decodes every buffer to verify
byte equality before writing the final file. There are 28 material/floor mesh
batches. No runtime CDN, external font, HDR download or third-party API is needed.

Rendering happens on demand unless the visitor enables Slow orbit. Resize, drag,
keyboard, zoom and short view transitions request frames; offscreen or hidden
pages stop rendering, including orbit. Shadow maps are generated once because
the building and lighting are static. DPR is capped at 1.75. Shadow resolution
is 1024 on phone-sized viewports and 2048 on larger viewports.

The poster stays visible until the model has rendered. Network errors, unavailable
WebGL2, or context loss restore the poster with a retry action. A 25-second loading
deadline prevents an indefinite spinner. Return to rendering cancels an ongoing
load or disposes an active renderer. Page exit releases the scene, textures,
shadow maps, renderer and observers. JavaScript-disabled visitors see the
architectural image, explanatory text and ordinary Plans/Leasing links.

On touch screens, horizontal dragging rotates the building and vertical swipes
remain available for page scrolling. Zoom buttons are always provided; there is
no wheel interception. Keyboard users can use arrow keys, + / − and Home.
Controls have at least 44 px targets, visible focus, and loading/fallback status.
Reduced motion removes the canvas fade, camera-view transitions and orbit control.

## Future leasing integration

The source export previously contained one building node. The delivery GLB now
contains `recplace`, `floor_01`, `floor_02`, `floor_03`, `roof` and `context`
groups. Exterior boxes crossing a floor boundary are split exactly at elevations
4.258 and 8.160 m. Their source identifiers survive in the companion JSON map.

Meshes carry `extras.floorId` and `extras.materialRole`, retained by GLTFLoader.
`Assets/3d/recplace-interactions.json` records floor IDs, elevations, link targets,
and source part ranges (`firstIndex`, `indexCount`) within each material batch.
Compression preserves those index ranges. A raycast `faceIndex * 3` can be matched
to the range to resolve the original part.

The controller dispatches `recplace:viewer-ready` on its `[data-recplace-3d]`
element with `event.detail.viewer`. This small API provides `getFloor(id)`,
`resolveIntersection(hit)`, `setView(name)`, `zoom(factor)`, `setOrbit(enabled)`
and `dispose()`.
The current UI does not present floor/suite selection as an available feature.

The mapping has an explicitly empty `suites` array. Add approved suite IDs,
authored geometry, area data and availability data before implementing leasing
selection. The current groups are exterior slices, not complete floors with
ceilings, rooms or slab assemblies. A finished exploded-floor presentation needs
those authored assets. Moving geometry also requires refreshing shadow maps.
Directory, lobby and private management clients can reuse the model/mapping
without changing public-page routing or adding management data to the public site.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Homepage section, static poster and progressive controls |
| `plans/index.html` | Same viewer beside the existing floor overview |
| `explore/index.html` | Dedicated larger viewer with automatic initialization |
| `leasing/index.html` | Link into the dedicated viewer |
| `css/recplace-3d.css` | Scoped section, controls and responsive styling |
| `js/recplace-3d.js` | Small lazy loader, status, fallback and lifecycle |
| `js/3d/viewer.js` | Maintainable Three.js scene and interaction source |
| `js/3d/recplace-viewer.bundle.js` | Generated, self-hosted browser module |
| `js/3d/THREE-LICENSE.txt` | Three.js MIT notice; decoder notice also remains in the bundle |
| `js/site.js` | Opt-out attribute so the viewer poster does not open the image lightbox |
| `Assets/3d/recplace-exterior.glb` | Embedded materials/textures and Meshopt geometry |
| `Assets/3d/recplace-interactions.json` | Stable source-part and future-floor mapping |
| `scripts/3d-source/*` | Unchanged supplied source data and provenance |
| `scripts/build-recplace-model.py` | Reproducible geometry/material export |
| `scripts/compress-recplace-model.cjs` | Lossless compression and byte verification |
| `scripts/build-recplace-viewer.cjs` | Reproducible, pinned self-hosted JS bundle |
| `scripts/qa-recplace-3d.cjs` | End-to-end static-site and viewer checks |
| `scripts/qa-explore-media.cjs` | Video preferences, dedicated viewer and expansion checks |
| `package.json`, `package-lock.json` | Pinned build tools and useful build/QA commands |

## Build and test

The generated GLB and bundle are included as delivery assets. GitHub Pages can
serve them directly; deployment does not require a new build system.

```powershell
npm ci
python -m pip install Pillow
npm run build:3d
npm run qa:3d
git diff --check
node --check js/recplace-3d.js
node --check js/site.js
```

Pillow is only needed when rebuilding procedural materials. Browser QA uses the
existing Playwright dependency and launches its own temporary local server. If
Chromium has not been installed, run `npx playwright install chromium` first.
There are no new environment variables or migrations.

QA outputs go to ignored `.qa/recplace-3d/`: screenshots and a machine-readable
`results.json`. Tests exercise desktop 1440 px, tablet 768 px, phone 390 px and
small phone 320 px, resource deferral, floor mapping, view changes, keyboard,
touch input, DPR limits, repeated initialization/disposal, no-JS, unavailable
WebGL, request failures, cancellation and graphics context loss. Viewport/touch
checks are browser emulations with software WebGL, not physical iOS/Android or
hardware performance certification.

For the new video and dedicated viewer checks, start `python -m http.server 8765
--bind 127.0.0.1` in a separate terminal, then run
`node scripts/qa-explore-media.cjs`. Screenshots go to `.qa/explore-media/`.
The script checks 1440, 390 and 320 px layouts, video source selection and playback,
offscreen suspension, reduced-motion/data-saving fallbacks, automatic model
loading, orbit, expanded view, Escape and restored focus/scroll behavior.

Current generated asset SHA-256 hashes:

- GLB: `1e42fd550421523d22feb731290f952aa6920256f41aee6f3655264066b4b802`
- Viewer bundle: `769c0631ab3645e4c3bc5f5fa873ca2a78bf744fc037ed5f8a27d296aea29cf7`

## September construction video

The homepage uses seconds 1–15 of `DJI_20260911191716_0093_D.MP4`, the newest
video in the supplied DJI folder when inspected. The original 48.75-second
3840 × 2160, 59.94 fps, 10-bit HEVC recording is untouched. Its color metadata
is BT.709 SDR.

- Desktop: `recplace-september-11-1440.mp4`, 2560 × 1440 at 59.94 fps,
  H.264 CRF 18, 35,536,671 bytes.
- Up to 900 px: `recplace-september-11-1080.mp4`, 1920 × 1080 at 29.97 fps,
  H.264 CRF 19, 17,342,631 bytes.
- Both exports use Lanczos scaling, yuv420p, BT.709 metadata, no audio and
  fast-start MP4 layout. Bitrate caps are 22 Mbps desktop and 10 Mbps mobile.
- A 2560 px JPEG from the same clip is the immediate poster. Video downloads
  only when the hero is visible and neither reduced motion nor data saving is
  requested. Playback pauses offscreen or in hidden tabs; visitors can pause it.

These quality-focused exports are larger than a heavily compressed hero loop.
They preserve roof and facade detail while selecting a smaller export on phones.

## Further source work

For photoreal close-ups, obtain the latest coordinated Revit/IFC/Blender export
with real glazing assemblies, facade relief, door hardware, edge bevels, approved
material textures and current sign details. The supplied solid masses and glass
overlays cannot accurately show interiors or glass transmission. Native floor
and suite geometry plus verified leasing data are required for floor explosion,
suite availability and area-based interaction. A coordinated civil/landscape
model is required before showing parking, terrain or planting as current design.

Technical references: [Three.js documentation](https://threejs.org/docs/),
[Meshopt glTF extension](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md).
