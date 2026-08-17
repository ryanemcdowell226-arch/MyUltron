# UI / Hand-tracking integration (README)

This folder contains a lightweight, framework-free set of UI helpers for the U.L.T.R.O.N project:

- logo.html / logo.css - HTML/CSS scalable logo (data-version="3.1").
- hand-controls.js - abstraction layer that translates hand landmarks into high-level events: handclick, handpinchstart, handpinchend, handgrabstart, handgrabmove, handgrabend. Call window.handleHandFrame(landmarks) from your hand-tracking frame loop.
- calibrate.js - CALIBRATE button and flow. Click CALIBRATE, point and click at each on-screen dot (or pinch) to capture four corners and center. Results are stored at window.handCalibration and used by hand-controls to map normalized coords to screen coords.
- resizable-window.* - demo movable/resizable window component. Integrated with both pointer events and hand grab events.
- version-helper.js - nextVersion(current) helper implementing your 3.10 -> 4.0 rule.

How to use
1) Serve the /public directory as your static root (this repo uses /public by convention).
2) Include these assets in your main HTML (example):

<link rel="stylesheet" href="/ui/logo.css">
<link rel="stylesheet" href="/ui/resizable-window.css">
<script src="/ui/hand-controls.js"></script>
<script src="/ui/calibrate.js"></script>
<script src="/ui/resizable-window.js"></script>
<script src="/ui/version-helper.js"></script>

3) In your hand-tracking loop, call window.handleHandFrame(landmarks) every frame. The library will emit custom DOM events you can listen to.

Notes
- Tweak PINCH_THRESHOLD and FIST_THRESHOLD in hand-controls.js for your camera/setup.
- The calibration flow uses the last seen landmarks at the time of click. If your tracker provides a click callback, prefer using that to capture precise samples.
- This commit adds UI components under /public/ui and wires nothing into application internals — include the scripts where you want them.
