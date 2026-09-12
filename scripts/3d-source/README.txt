RECPLACE PROFESSIONAL CENTRE — EXTERIOR STUDY V1.1
Created September 9, 2026

OPENING THE MODEL
Open recplace-3d-viewer.html in a modern browser. Drag to orbit; scroll or pinch to zoom. Named views and the zoom slider also work without dragging. Internet access to cdn.jsdelivr.net is required for Three.js, and WebGL must be enabled. A static preview appears if interactive loading fails.
recplace-exterior-v1.glb is the portable 3D asset, with geometry and materials embedded. Import into a GLB-compatible 3D application. Units: metres, Y up; X points south, Z points west. Origin: horizontal centre of overall drawing grid, main-floor height zero.

AUTHORITATIVE DRAWING BASIS FOR THIS VERSION
2026-05-14-Issued for Construction-Rev 0.pdf, Axiom Architecture Inc., project 23-002:
- PDF page 8, A2.1: main-floor footprint and dimension strings
- PDF page 11, A2.4: roof outline, stair shaft roofs and indicative RTU placement
- PDF page 14, A4.1: all four external elevations, return elevations and finish legend
- PDF page 15, A5.1: floor and roof level cross-check

The available Rev.P DataSec copy has an April 14, 2026 coordination issue and security annotations on four plans. The older Rev.L-labelled set is review/coordination material. Neither was substituted for the later May 14 IFC exterior basis. This model does not certify that the May IFC set remains the latest set held by the construction team or includes later changes.

DIMENSIONED CONTROLS
Overall drawing grid: 54.864 m / 180 ft length; 20.726 m / 68 ft depth.
West recess: 30.480 m / 100 ft across, 4.877 m / 16 ft deep.
Second floor: +4.258 m; third floor: +8.160 m.
Main parapet: +12.954 m / 42 ft 6 in above main floor.
Stair roof high point: +15.494 m / 50 ft 10 in above main floor.
Stair roof low eave approximately +13.995 m.
The primary model envelope follows the grid dimensions. Small offsets between grids and exterior wall faces are omitted.

WHAT IS MODELLED
Three-storey exterior massing with projecting west end wings and recessed entrance; elevation-derived window groupings and selected mullions/spandrels; contrasting precast façade areas; entrance canopies; notched parapets; two raised stair roofs; ten simplified RTUs; illustrative ground plinth.

FINISH BASIS
A4.1 identifies Cloverdale Ice Dream 0032, Emu 0549, Orange Bollard 1019 and Melting Glacier 0600, tinted glazing and black frames/cappings. Screen colours are approximate visual interpretations, not verified manufacturer RGB values or approved samples. The warm orange/brown areas represent the specified painted formliner finish, not an assertion of actual timber cladding.

LIMITATIONS / ASSUMPTIONS
This is a visual reconstruction, not an architect-authored BIM model, an as-built survey or a construction coordination model. Façade positions were traced from the printed elevations and do not constitute dimensioned fabrication information. Use written dimensions in the governing drawings for construction.
Opaque masses and glazing overlays represent the exterior appearance; glazing is not modelled as openings through a detailed wall assembly. Interior rooms, floors, stairs, elevator, structural members, MEP services and tenant fit-outs are not reconstructed.
Roof drainage slopes, local low parapets, detailed cladding profiles, lighting, signs, door hardware and flashing are simplified or omitted. RTU sizes and details are indicative. Stair enclosures and canopies are simplified geometry.
The ground plinth is presentation context only. It does not represent surveyed grades, property boundaries, roads, parking or landscaping.
Do not use for quantity takeoffs, procurement, clearances, clash detection, lease area measurement or construction.

EDITABLE CONTENTS
recplace-model.json contains the part list, material colours, units and drawing basis.
build_model.py recreates geometry, GLB and preview using Python, numpy and Pillow. Its ROOT path must be changed to your working folder before running.
viewer-fragment.html is the viewer template; MODEL_DATA and PREVIEW_DATA placeholders are populated by the supplied packaged viewer.
recplace-exterior-preview.png is a rendered view of the same model geometry.

NEXT ACCURACY STEP
Obtain the architect/builder's native Revit, IFC or other coordinated 3D export and latest approved changes. This would allow a more accurate model without retracing PDF geometry.

V1.1 CORRECTION
Restored second-floor glazing in two east-side bays previously covered by overextended warm cladding. Subdivided overlapping facade surfaces to prevent near-coplanar depth conflicts. Viewer opens at a lower viewing angle and uses a tighter depth range. Checked west and east renders against A4.1.

PROPERTY MAP VERSION
Open recplace-property-viewer.html for the model on the property's aerial site plan. recplace-on-property.glb includes the textured map inside the GLB. The earlier close-up model and viewer are also included.

Map source: May 14, 2026 IFC set, PDF page 4, Axiom A1.1 Overall Site Plan. Its embedded aerial photograph includes surrounding buildings, Recplace Drive and Highway 16; the property development area shows the proposed parking/access layout. The aerial capture date is not identified. It is not current satellite imagery.

Registration uses the actual A1.1 PDF vector footprint bounds (1769.4, 504.12) to (1932.6, 936.12) in PDF points. The 432-point building length corresponds to 54.864 metres; the 163.2-point width corresponds to 20.7264 metres. Model centre maps to PDF (1851,720.12), X south and Z west. North-up plan view follows the drawing's north arrow. This is drawing-local visual registration, not surveyed geographic coordinates or a cadastral boundary determination.

The map is a flat textured plane. Adjacent buildings are photographic context only; no terrain elevations or adjoining 3D structures are inferred. Printed site annotations and historic aerial features are retained from the source sheet.

Source files: build_site.py adds the embedded map to the corrected GLB and generates recplace-site-model.json; site-viewer-fragment.html is the corresponding viewer template. recplace-aerial-site-base.jpg is the cropped source map. The previous model limitations continue to apply.
