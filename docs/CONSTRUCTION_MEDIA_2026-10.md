# October 2026 construction media

## Design direction

Keep the existing paper tones, charcoal type, rust accents, Instrument typography,
split homepage hero, and dated project journal. The new photography carries the update.
The homepage keeps its existing content sequence. The journal gains separate dated
paint, window-installation, and roof-progress entries above all earlier entries.
Keep the existing hero entrance, gentle desktop depth effect, image lightbox, and
section reveals, with the same reduced-motion still-image experience.

## Source selection

Sources were inspected visually in `D:\DCIM`, including photo contact sheets from
September 11, September 15, September 17, September 23, September 27,
October 5, and October 13 and sampled sequences from all
seven videos dated September 27 or later. Earlier website imagery was compared with
the new sources. Camera EXIF and MP4 creation metadata confirm the selected dates.

- Hero: `DJI_20261013093945_0200_D.MP4`, October 13, 2026.
  The street-facing sweep at source seconds 22–35 moves around the glazed corner
  and painted facade at natural speed. The closer architectural view and changing
  perspective replace the October 5 hold after the request for more movement and a
  better angle. The existing tall desktop hero frames the facade and corner details;
  the journal photographs provide the wider building views. MP4 creation metadata
  records `2026-10-13T16:39:46Z`, matching the local October 13 capture date.
  Other October 13 clips show different properties and were excluded.
- Exterior: `DJI_20261013094054_0202_D.JPG`, October 13 at 09:40:54.
  Clear, balanced view of the painted three-storey exterior and installed glazing.
- Paint: `DJI_20260917180201_0046_D.JPG`, September 17 at 18:02:01.
  White, charcoal, and orange paint is clearly visible on the highway-facing facade.
  September 15 stills show the earlier, unpainted exterior.
- Window installation: `DJI_20260923182506_0091_D.JPG`, September 23 at 18:25:06.
  Close view of the new black window-frame grid across the facade. September 17
  stills show largely open window bays. The copy describes installation and framing,
  rather than claiming all glazing was complete on September 23.
- Roof: `DJI_20261013094105_0203_D.JPG`, October 13 at 09:41:05.
  A deliberate detail crop shows the roof surface and work around penetrations.

## Journal dates and metadata

| Entry | Date | Selected photo EXIF `DateTimeOriginal` |
| --- | --- | --- |
| Exterior painting takes shape | September 17, 2026 | `2026:09:17 18:02:01` |
| Window installation underway | September 23, 2026 | `2026:09:23 18:25:06` |
| Roofing nearing completion | October 13, 2026 | `2026:10:13 09:40:54` and `2026:10:13 09:41:05` |

These are dated observations from the available photographs, not asserted start or
completion dates. EXIF `DateTimeDigitized` and `DateTime` agree with `DateTimeOriginal`
for these sources, and their filenames also agree. Clear installed glazing can be
seen in `DJI_20261005164728_0156_D.JPG` (October 5 at 16:47:28); the earlier September
23 entry records the framing stage. Each entry uses photography from its own date.
The October 13 entry keeps the newest exterior and roof views on the page.
Wording does not assert inspection, waterproofing certification, occupancy, or a
completion date.

## Exports

Run from the project root with Python, Pillow, and FFmpeg installed:

```powershell
python scripts/build-construction-media.py --source-dir 'D:\DCIM\DJI_001'
```

Use `--video-only` to rebuild just the hero video and its matching posters.

The hero uses source seconds 22–35 at natural speed, sampled from the original
approximately 60 fps footage. A 0.7-second cyclic dissolve makes a
12.3-second loop. H.264, 30 fps, YUV 4:2:0, no audio, and fast-start MP4 are used for
browser compatibility. The desktop export is 1440 pixels wide; mobile is 960 pixels.
WebP posters at 1600 and 960 pixels match the loop's first frame.

Four journal photos have 1600- and 960-pixel WebP exports. Original files and GPS/EXIF
metadata are not shipped. Reduced motion, Save-Data, slow reported connections,
JavaScript being unavailable, and rejected autoplay retain the still poster.
Playback pauses when the hero leaves the viewport or the page is hidden.

All existing journal entries and older published assets are retained.

## Validation

The October 19 hero revision was checked in the homepage at 1440 × 900 and
390 × 844. Both sizes decoded moving frames, used their intended MP4 resolution
and one responsive poster, and had no horizontal overflow. The desktop loop was
observed repeating. Reduced motion loaded the matching poster with zero video
requests; the reported slow-connection fallback also retained the poster. Browser
test overrides were removed afterward. `npm test` passed all eight canonical-page
SEO checks. The journal JSON and HTML remain unchanged in this revision.

The original journal rollout was checked as follows:

- `npm test`: passed the SEO checks for all eight canonical pages.
- `npm run qa:site`: passed all eight routes at desktop and mobile sizes.
- Additional Chromium checks passed at 1440, 1024, 900, 768, 390, and 320 pixels:
  muted inline autoplay, decoded moving frames, an actual loop repeat, responsive
  video selection, one poster resolution per visit, and offscreen suspension.
- Still-image fallbacks passed for reduced motion, Save-Data, slow reported
  connections, JavaScript being unavailable, blocked autoplay, and a failed video.
- After separating the milestones, journal checks passed at 1440, 768, 390, and
  320 pixels: all ten entries, all fourteen journal images, embedded-data equality,
  fetch-failure and no-JavaScript fallbacks, and no horizontal overflow. All seven
  pre-existing data records remain unchanged.
- The additional combined 3D/media test intermittently reported a mobile orbit
  screenshot mismatch. Desktop and 390-pixel 3D checks passed separately, including
  a diagnostic that confirmed advancing animation frames and changed screenshots.
  The 3D implementation was not changed.

The current hero exports are 3,882,586 bytes at 1440 pixels and 1,948,798 bytes at
960 pixels. Both contain one H.264 video stream, 30 fps, 12.3 seconds, and no audio
stream. Matching WebP posters are 201,100 bytes at 1600 pixels and 95,120 bytes at
960 pixels. Earlier published media assets are retained.
