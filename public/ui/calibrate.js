// public/ui/calibrate.js
// Provides a CALIBRATE flow: capture points for center, corners and compute mapping used by hand-controls

(function(){
  function createUI(){
    if (document.getElementById('calibrateBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'calibrateBtn';
    btn.textContent = 'CALIBRATE';
    btn.style.position = 'fixed';
    btn.style.right = '18px';
    btn.style.top = '18px';
    btn.style.zIndex = 1200;
    btn.style.padding = '8px 10px';
    btn.style.borderRadius = '6px';
    btn.style.background = '#062033';
    btn.style.color = '#cfefff';
    document.body.appendChild(btn);

    const overlay = document.createElement('div');
    overlay.id = 'calibrateOverlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = 0;
    overlay.style.display = 'none';
    overlay.style.zIndex = 1250;
    overlay.style.pointerEvents = 'none';
    document.body.appendChild(overlay);

    const dot = document.createElement('div');
    dot.id = 'calDot';
    dot.style.width = '18px';
    dot.style.height = '18px';
    dot.style.borderRadius = '50%';
    dot.style.background = '#00e5ff';
    dot.style.position = 'absolute';
    dot.style.transform = 'translate(-50%,-50%)';
    dot.style.boxShadow = '0 0 12px rgba(0,229,255,0.7)';
    overlay.appendChild(dot);

    const instr = document.createElement('div');
    instr.id = 'calInstr';
    instr.style.position = 'absolute';
    instr.style.left = '50%';
    instr.style.top = '10%';
    instr.style.transform = 'translateX(-50%)';
    instr.style.color = '#dbeefc';
    instr.style.fontFamily = 'sans-serif';
    overlay.appendChild(instr);

    btn.addEventListener('click', startCalibration);
  }

  // helpers to position dot for step
  const stepPositions = {
    center: () => ({x: window.innerWidth/2, y: window.innerHeight/2}),
    'top-left': () => ({x: 40, y: 40}),
    'top-right': () => ({x: window.innerWidth-40, y: 40}),
    'bottom-right': () => ({x: window.innerWidth-40, y: window.innerHeight-40}),
    'bottom-left': () => ({x: 40, y: window.innerHeight-40})
  };

  function showDotFor(name){
    const overlay = document.getElementById('calibrateOverlay');
    const dot = document.getElementById('calDot');
    const instr = document.getElementById('calInstr');
    overlay.style.display = 'block';
    overlay.style.pointerEvents = 'auto';
    const p = stepPositions[name]();
    dot.style.left = p.x + 'px';
    dot.style.top = p.y + 'px';
    instr.textContent = `Point at the ${name.replace('-', ' ')} dot and click (pinch or mouse)`;
  }

  function hideCalibrationUI(){
    const overlay = document.getElementById('calibrateOverlay');
    overlay && (overlay.style.display = 'none');
  }

  function waitForCapture(){
    return new Promise((resolve)=>{
      // resolve on handclick or pointerdown on document
      function onHandClick(e){
        cleanup();
        // try to read normalized landmarks at time of click
        const lm = window._lastHandLandmarks;
        resolve(lm);
      }
      function onPointer(e){
        cleanup();
        const lm = window._lastHandLandmarks;
        resolve(lm);
      }
      function cleanup(){
        document.removeEventListener('handclick', onHandClick);
        document.removeEventListener('pointerdown', onPointer);
      }
      document.addEventListener('handclick', onHandClick);
      document.addEventListener('pointerdown', onPointer);
    });
  }

  async function startCalibration(){
    // prepare UI
    createUI();
    const overlay = document.getElementById('calibrateOverlay');
    const seq = ['center','top-left','top-right','bottom-right','bottom-left'];
    const captures = [];
    for (let i=0;i<seq.length;i++){
      showDotFor(seq[i]);
      const lm = await waitForCapture();
      // lm is the full landmarks array; we take palm/center point (landmark 9 or 0)
      if (!lm || lm.length < 1) {
        // fallback: use last known map from handControls if present
        console.warn('No hand landmarks captured for step', seq[i]);
        continue;
      }
      const center = lm[9] || lm[0];
      captures.push({name: seq[i], p: center});
      // small pause for UX
      await new Promise(r=>setTimeout(r,250));
    }

    // compute min/max
    const xs = captures.map(c=>c.p.x);
    const ys = captures.map(c=>c.p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    window.handCalibration = { minX, maxX, minY, maxY, ready: true };
    hideCalibrationUI();
    alert('Calibration complete. You can now reach the screen corners.');
  }

  // attach createUI at load so button appears
  window.addEventListener('load', createUI);
  // if scripts loaded after DOM
  if (document.readyState === 'interactive' || document.readyState === 'complete') createUI();
})();
