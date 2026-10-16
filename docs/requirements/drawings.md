# Illustrative Drawings

Drawings are editable illustrations, not scaled survey or engineering plans.

## REQ-DRAWING-001 Create drawings

Team B can keep multiple named drawings per job in three retail-focused types: room, building, and house plan.

- Each type starts from an editable template focused on boundaries, walls, openings, entrances, circulation, and appraisal-relevant area names, not furniture.
- Users can add, delete, duplicate, and reopen drawings after reload in the same browser.
- House plans support blank, single-floor, ground-floor, and upper-floor starters; each floor is a separate drawing.
- Drawing geometry must not calculate actual area.
- On the first load of store schema v2, drawings using the retired road, land, housing-estate, or village types are removed from browser storage. The migration leaves jobs and supported drawings intact.

## REQ-DRAWING-002 Edit drawings

Desktop and mobile users can add and edit shapes, walls, doors, windows, dimensions, arrows, symbols, text, stairs, hatched areas, and numbered inspection callouts.

- The material library is grouped into draw, openings, structure, area, and annotation categories. It provides walls, lines, arrows, dimensions; left/right/double doors and windows; columns and straight/L/U stairs; hatched rectangle/polygon, porch, and extension areas; text, room labels, red inspection lines, leaders, and numbered callouts.
- Direct-draw tools remain active for consecutive strokes until the user chooses Done/Select or presses Escape. Each completed stroke creates one Undo entry; drags shorter than the minimum gesture threshold are discarded.
- Direct drawing snaps to the nearest 45° direction, which includes horizontal and vertical axes. Mobile users can toggle free angle; desktop users can hold Alt temporarily.
- Stamped materials are placed near the viewport center and selected immediately for repositioning and property editing.

- Select, move, resize, rotate, reorder, zoom, pan, undo, and redo.
- On mobile, the first tap selects only. Drag the central handle to move, an edge/corner handle to resize, or a line endpoint to reshape; touch targets are at least 44 px.
- Dragging on the mobile canvas must not scroll the page; touch scrolling outside the canvas remains available.
- Tapping empty space clears selection; dragging it pans; two fingers zoom. The property panel opens from a header action only.
- On mobile, the bottom dock has two exclusive modes: no selection shows tools to add elements; selecting an element replaces them with its scrollable, kind-relevant properties and visible copy/delete actions. An explicit unselect action and tapping empty canvas return to add mode.
- The selected-element dock replaces the add-tool strip at the same position and height above bottom navigation. All relevant properties, including text editing and polygon-point coordinates, stay in a single horizontally scrollable row without an automatically expanded sheet. Actions and labeled inputs align to a common lower control baseline. Text-bearing elements have a visible edit-text action, a focused draft input with Done/Cancel, and one Undo step per saved text change. The separate header panel manages the drawing title and element list.
- The mobile property controls offer 15° and 45° left/right rotation buttons for the selected element.
- Offer buttons and numeric fields when dragging is impractical, plus keyboard access to key actions.
- Only Team B or an administrator can edit in `assigned` or `changesRequested`; other states are read-only.
- House plans support straight/L/U stairs, single/double doors and swing direction, hatched areas, dashed lines, numbered callouts, and editable polygon points. Users enter dimensions as text; there is no scale.

## REQ-DRAWING-003 Include and export drawings

Only drawings selected for inclusion appear in the report and browser-printed PDF, with a no-scale notice. Export PNG and SVG without storing duplicate image files in `localStorage`. Report failed saves rather than showing success.

## REQ-DRAWING-004 Import a sketch as editable lines

When Team B opens an editable house plan, they can upload JPG, PNG, or WebP, rotate and crop to one floor, and inspect detected lines overlaid on the crop.

- Users can include/exclude each candidate and classify it as a wall or ordinary line before confirmation.
- Confirmation persists existing editable drawing elements with Undo support; the job does not retain the source image.
- V1 detects only straight near-horizontal/vertical lines. It does not extract handwriting, room labels, doors, stairs, or dimensions, and assigns no scale.
