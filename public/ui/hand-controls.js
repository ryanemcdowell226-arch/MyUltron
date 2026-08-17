// public/ui/hand-controls.js
// Hand tracking -> pointer abstraction. Integrate this by calling window.handleHandFrame(landmarks)
// landmarks: array of 21 normalized points from a hand tracker (MediaPipe style). Each point {x,y,z}

(function(){
  const PINCH_THRESHOLD = 0.04; // adjust for camera distance/resolution
  const FIST_THRESHOLD = 0.45;
  let isPinched = false;
  let pinchStartPos = null;
  let isGrabbing = false;
  let grabTarget = null;

  // store last landmarks for calibration/capture
  window._lastHandLandmarks = null;

  function dist(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }
  function fingerCurl(landmarks, tipIdx, pipIdx, mcpIdx){
    const tip = landmarks[tipIdx], pip = landmarks[pipIdx], mcp = landmarks[mcpIdx];
    const d1 = dist(tip, mcp); const d2 = dist(pip, mcp);
    return 1 - (d1 / (d2 + 1e-6));
  }
  function isFist(landmarks){
    const curls = [
      fingerCurl(landmarks,8,6,5),
      fingerCurl(landmarks,12,10,9),
      fingerCurl(landmarks,16,14,13),
      fingerCurl(landmarks,20,18,17)
    ];
    const avg = curls.reduce((a,b)=>a+b,0)/curls.length;
    return avg > FIST_THRESHOLD;
  }

  // simple mapping: if calibration ready, use it; otherwise fallback to mirrored normalized mapping
  function screenMap(norm) {
    if (!norm) return {x:0,y:0};
    const c = window.handCalibration || null;
    if (!c || !c.ready) {
      // assume camera is mirrored horizontally (typical webcam preview). Flip x so cursor follows user hand
      return { x: window.innerWidth * (1 - norm.x), y: window.innerHeight * norm.y };
    }
    const {minX, maxX, minY, maxY} = c;
    const rx = (norm.x - minX) / Math.max(1e-6, (maxX - minX));
    const ry = (norm.y - minY) / Math.max(1e-6, (maxY - minY));
    return { x: Math.min(window.innerWidth, Math.max(0, rx * window.innerWidth)), y: Math.min(window.innerHeight, Math.max(0, ry * window.innerHeight)) };
  }

  function handleHandFrame(landmarks){
    if (!landmarks || landmarks.length < 21) return;
    window._lastHandLandmarks = landmarks;

    // pinch detection (thumb tip=4 index tip=8)
    const d = dist(landmarks[4], landmarks[8]);
    if (d < PINCH_THRESHOLD && !isPinched && !isGrabbing){
      isPinched = true;
      pinchStartPos = screenMap(landmarks[8]);
      document.dispatchEvent(new CustomEvent('handpinchstart', {detail:{pos:pinchStartPos}}));
    }
    if (d >= PINCH_THRESHOLD && isPinched){
      // pinch end -> emit click at start position (per user's request: movement while pinched doesn't count)
      isPinched = false;
      const clickPos = pinchStartPos || screenMap(landmarks[8]);
      document.dispatchEvent(new CustomEvent('handclick', {detail:{pos:clickPos}}));
      document.dispatchEvent(new CustomEvent('handpinchend', {detail:{pos:clickPos}}));
      pinchStartPos = null;
    }

    // fist / grab detection
    const fist = isFist(landmarks);
    const palmPoint = landmarks[9] || landmarks[0];
    const screenPalm = screenMap(palmPoint);
    if (fist && !isGrabbing){
      isGrabbing = true;
      document.dispatchEvent(new CustomEvent('handgrabstart', {detail:{pos:screenPalm}}));
    } else if (!fist && isGrabbing){
      isGrabbing = false;
      document.dispatchEvent(new CustomEvent('handgrabend', {detail:{}}));
    }
    if (isGrabbing){
      document.dispatchEvent(new CustomEvent('handgrabmove', {detail:{pos:screenPalm}}));
    }
  }

  // expose
  window.handleHandFrame = handleHandFrame;
  window._handControls = { handleHandFrame };
})();
