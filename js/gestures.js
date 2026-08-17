(function(){
  var settings = ULTRON.settings;
  var three = ULTRON.three;
  var interaction = ULTRON.interaction;

  var video = document.getElementById('video');
  var cursorLayer = document.getElementById('handCursors');
  var cursorEls = { Left: null, Right: null };

  var CONFIRM_FRAMES = 3;
  var RELEASE_FRAMES = 4;
  var SMOOTH_ALPHA = 0.55;
  var ZOOM_SENSITIVITY = 0.012; // world units per pixel of pinch-spread change

  var perHandState = {
    Left:  { smoothed:null, rawMode:'none', confirmed:'none', candidate:'none', candidateFrames:0, releaseFrames:0 },
    Right: { smoothed:null, rawMode:'none', confirmed:'none', candidate:'none', candidateFrames:0, releaseFrames:0 }
  };
  var zoomState = { active:false, prevDist:null };

  function dist2(a, b){ var dx=a.x-b.x, dy=a.y-b.y; return Math.sqrt(dx*dx+dy*dy); }
  function clamp(v,lo,hi){ return Math.max(lo, Math.min(hi, v)); }

  function classifyGesture(lm){
    var wrist = lm[0];
    var handSize = dist2(lm[0], lm[9]) || 0.0001;
    function tipOpen(tipIdx, pipIdx){ return dist2(lm[tipIdx], wrist) > dist2(lm[pipIdx], wrist) * 1.05; }
    var indexOpen = tipOpen(8,6), middleOpen = tipOpen(12,10), ringOpen = tipOpen(16,14), pinkyOpen = tipOpen(20,18);
    var pinchDist = dist2(lm[4], lm[8]) / handSize;
    var openCountOther = (middleOpen?1:0) + (ringOpen?1:0) + (pinkyOpen?1:0);
    var avgTipDist = (dist2(lm[8],wrist)+dist2(lm[12],wrist)+dist2(lm[16],wrist)+dist2(lm[20],wrist)) / (4*handSize);
    if (pinchDist < 0.42 && openCountOther >= 2) return 'pinch';
    if (avgTipDist < 1.35 && !indexOpen && !middleOpen) return 'grab';
    return 'none';
  }

  // maps a hand landmark point to mirrored screen pixel coordinates
  function toScreen(lm){
    return { x: (1 - lm.x) * window.innerWidth, y: lm.y * window.innerHeight };
  }

  function pinchPoint(lm){
    return { x:(lm[4].x+lm[8].x)/2, y:(lm[4].y+lm[8].y)/2 };
  }
  function palmPoint(lm){
    var idxs=[0,5,9,13,17], sx=0, sy=0;
    for (var i=0;i<idxs.length;i++){ sx+=lm[idxs[i]].x; sy+=lm[idxs[i]].y; }
    return { x: sx/idxs.length, y: sy/idxs.length };
  }

  function smoothFor(st, lm){
    if (!st.smoothed) st.smoothed = lm.map(function(p){ return {x:p.x,y:p.y,z:p.z}; });
    else {
      var s = st.smoothed;
      for (var i=0;i<lm.length;i++){
        s[i].x += (lm[i].x - s[i].x) * SMOOTH_ALPHA;
        s[i].y += (lm[i].y - s[i].y) * SMOOTH_ALPHA;
        s[i].z += (lm[i].z - s[i].z) * SMOOTH_ALPHA;
      }
    }
    return st.smoothed;
  }

  function ensureCursor(label){
    if (cursorEls[label]) return cursorEls[label];
    var el = document.createElement('div');
    el.className = 'hand-cursor';
    el.style.display = 'none';
    cursorLayer.appendChild(el);
    cursorEls[label] = el;
    return el;
  }

  function resetHand(label){
    var st = perHandState[label];
    st.smoothed = null; st.rawMode='none'; st.confirmed='none'; st.candidate='none';
    st.candidateFrames=0; st.releaseFrames=0;
    if (cursorEls[label]) cursorEls[label].style.display = 'none';
    interaction.cancel(label);
  }

  function stabilize(st, raw){
    if (raw === st.confirmed){ st.releaseFrames = 0; return st.confirmed; }
    if (st.confirmed !== 'none'){
      // currently active -- require sustained "none" (or a different gesture) before releasing
      st.releaseFrames++;
      if (st.releaseFrames >= RELEASE_FRAMES){
        st.confirmed = raw; st.releaseFrames = 0; st.candidateFrames = 0;
        return st.confirmed;
      }
      return st.confirmed;
    }
    // currently idle -- require sustained candidate gesture before confirming
    if (raw === st.candidate){ st.candidateFrames++; } else { st.candidate = raw; st.candidateFrames = 1; }
    if (raw !== 'none' && st.candidateFrames >= CONFIRM_FRAMES){
      st.confirmed = raw; st.candidateFrames = 0;
      return st.confirmed;
    }
    return st.confirmed;
  }

  function onResults(results){
    var rawList = results.multiHandLandmarks || [];
    var handedness = results.multiHandedness || [];

    if (rawList.length === 0){
      resetHand('Left'); resetHand('Right');
      zoomState.active = false; zoomState.prevDist = null;
      return;
    }

    var present = {};
    for (var i=0;i<rawList.length;i++){
      var label = (handedness[i] && handedness[i].label) ? handedness[i].label : ('Hand'+i);
      if (!perHandState[label]) continue;
      present[label] = smoothFor(perHandState[label], rawList[i]);
    }
    ['Left','Right'].forEach(function(lbl){ if (!present[lbl]) resetHand(lbl); });

    var labels = Object.keys(present);

    // classify + stabilize + update cursors for every present hand
    var confirmedByLabel = {};
    labels.forEach(function(label){
      var lm = present[label];
      var st = perHandState[label];
      var raw = classifyGesture(lm);
      var confirmed = stabilize(st, raw);
      confirmedByLabel[label] = confirmed;

      var refPoint = confirmed === 'pinch' ? pinchPoint(lm) : (confirmed === 'grab' ? palmPoint(lm) : pinchPoint(lm));
      var screen = toScreen(refPoint);
      st.cursorScreen = screen;

      var el = ensureCursor(label);
      el.style.display = 'block';
      el.style.left = screen.x + 'px';
      el.style.top = screen.y + 'px';
      el.classList.toggle('active', confirmed !== 'none');
    });

    // two-hand pinch = zoom, takes priority over individual click/drag
    var bothPinch = settings.allowZoom && labels.length >= 2 &&
      confirmedByLabel[labels[0]] === 'pinch' && confirmedByLabel[labels[1]] === 'pinch';

    if (bothPinch){
      var pA = perHandState[labels[0]].cursorScreen, pB = perHandState[labels[1]].cursorScreen;
      var d = dist2(pA, pB);
      if (!zoomState.active){
        zoomState.active = true; zoomState.prevDist = d;
        labels.forEach(function(l){ interaction.cancel(l); perHandState[l]._wasDown = false; });
      } else {
        var dd = d - zoomState.prevDist;
        three.dolly(-dd * ZOOM_SENSITIVITY);
        zoomState.prevDist = d;
      }
      return;
    } else if (zoomState.active){
      zoomState.active = false; zoomState.prevDist = null;
    }

    // individual per-hand press / drag / click
    labels.forEach(function(label){
      var st = perHandState[label];
      var confirmed = confirmedByLabel[label];
      var isDown = confirmed === 'pinch' || confirmed === 'grab';
      var screen = st.cursorScreen;

      if (isDown && !st._wasDown){
        interaction.pointerDown(label, screen.x, screen.y, { clickCapable: confirmed === 'pinch' });
      } else if (isDown && st._wasDown){
        interaction.pointerMove(label, screen.x, screen.y);
      } else if (!isDown && st._wasDown){
        interaction.pointerUp(label, screen.x, screen.y);
      }
      st._wasDown = isDown;
    });
  }

  var hands = new Hands({ locateFile: function(file){ return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file; } });
  hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.6 });
  hands.onResults(onResults);

  var running = false;
  async function frameLoop(){
    if (!running) return;
    if (video.readyState >= 2){
      try { await hands.send({ image: video }); } catch(e) {}
    }
    requestAnimationFrame(frameLoop);
  }

  ULTRON.gestures = {
    start: function(){ running = true; requestAnimationFrame(frameLoop); },
    stop: function(){ running = false; }
  };
})();
