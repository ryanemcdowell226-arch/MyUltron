(function(){
  var settings = ULTRON.settings;
  var three = ULTRON.three;
  var interaction = ULTRON.interaction;
  var symbol = ULTRON.symbol;

  // ================= MOUSE AS A POINTER SOURCE =================
  // Mouse rides the exact same pointerDown/Move/Up pipeline hands use, so
  // dragging the symbol or a window works identically either way. The one
  // difference: for mouse we skip the synthetic el.click() on release,
  // since the browser already fires a real click event for mouse input.
  var mouseDown = false;
  document.addEventListener('mousedown', function(e){
    if (e.target.closest && e.target.closest('.win-titlebar')) e.preventDefault();
    mouseDown = true;
    interaction.pointerDown('mouse', e.clientX, e.clientY, { clickCapable: true });
  });
  document.addEventListener('mousemove', function(e){
    if (mouseDown) interaction.pointerMove('mouse', e.clientX, e.clientY);
  });
  document.addEventListener('mouseup', function(e){
    if (!mouseDown) return;
    mouseDown = false;
    interaction.pointerUp('mouse', e.clientX, e.clientY, { synthesizeClick: false });
  });

  // ================= CAMERA ACTIVATION =================
  var video = document.getElementById('video');
  var startOverlay = document.getElementById('startOverlay');
  var startBtn = document.getElementById('startBtn');
  var errorMsg = document.getElementById('errorMsg');
  var loadingMsg = document.getElementById('loadingMsg');

  async function startCamera(){
    startBtn.disabled = true;
    errorMsg.style.display = 'none';
    loadingMsg.style.display = 'block';
    loadingMsg.textContent = 'Requesting camera access\u2026';

    try {
      if (typeof Hands === 'undefined' || typeof THREE === 'undefined') throw new Error('LIBS_NOT_LOADED');
      var stream = await navigator.mediaDevices.getUserMedia({
        video: { width:{ideal:640}, height:{ideal:480}, facingMode:'user' }, audio:false
      });
      video.srcObject = stream;
      await video.play();
      loadingMsg.textContent = 'Calibrating tracking model\u2026';

      ULTRON.gestures.start();
      startOverlay.classList.add('fade-out');
      setTimeout(function(){ startOverlay.style.display = 'none'; }, 550);

    } catch(err){
      loadingMsg.style.display = 'none';
      startBtn.disabled = false;
      errorMsg.style.display = 'block';
      if (err && err.message === 'LIBS_NOT_LOADED') {
        errorMsg.textContent = 'Tracking libraries failed to load. Try opening index.html directly in a browser tab rather than a sandboxed preview.';
      } else if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        errorMsg.textContent = 'Camera permission was denied. Allow camera access in your browser\'s address bar and try again.';
      } else if (err && err.name === 'NotFoundError') {
        errorMsg.textContent = 'No camera was found on this device. You can still use the mouse.';
      } else {
        errorMsg.textContent = 'Could not access the camera (' + (err && err.message ? err.message : 'unknown error') + '). You can still use the mouse.';
      }
    }
  }
  startBtn.addEventListener('click', startCamera);

  // ================= SETTINGS WIRING =================
  var settingsBtn = document.getElementById('settingsBtn');
  var settingsPanel = document.getElementById('settingsPanel');
  document.getElementById('settingsClose').addEventListener('click', function(){ settingsPanel.classList.add('hidden'); });
  settingsBtn.addEventListener('click', function(){ settingsPanel.classList.toggle('hidden'); });

  document.getElementById('idleRotationToggle').addEventListener('change', function(e){ settings.idleRotation = e.target.checked; });

  var idleSpeedSlider = document.getElementById('idleSpeedSlider');
  var idleSpeedVal = document.getElementById('idleSpeedVal');
  idleSpeedSlider.addEventListener('input', function(e){
    settings.idleRotationSpeed = parseFloat(e.target.value);
    idleSpeedVal.textContent = settings.idleRotationSpeed.toFixed(2) + 'x';
  });

  var dotCountSlider = document.getElementById('dotCountSlider');
  var dotCountVal = document.getElementById('dotCountVal');
  dotCountSlider.addEventListener('input', function(e){ dotCountVal.textContent = parseFloat(e.target.value).toFixed(1) + 'x'; });
  dotCountSlider.addEventListener('change', function(e){
    settings.dotCountMultiplier = parseFloat(e.target.value);
    symbol.buildDots();
  });

  var dotSizeSlider = document.getElementById('dotSizeSlider');
  var dotSizeVal = document.getElementById('dotSizeVal');
  dotSizeSlider.addEventListener('input', function(e){
    settings.dotSize = parseFloat(e.target.value);
    dotSizeVal.textContent = settings.dotSize.toFixed(1) + 'x';
    symbol.applyDotSizeLive();
  });

  var minWobbleSlider = document.getElementById('minWobbleSlider');
  var minWobbleVal = document.getElementById('minWobbleVal');
  var maxWobbleSlider = document.getElementById('maxWobbleSlider');
  var maxWobbleVal = document.getElementById('maxWobbleVal');
  minWobbleSlider.addEventListener('input', function(e){
    settings.minWobble = Math.min(parseFloat(e.target.value), settings.maxWobble);
    minWobbleVal.textContent = settings.minWobble.toFixed(3);
  });
  maxWobbleSlider.addEventListener('input', function(e){
    settings.maxWobble = Math.max(parseFloat(e.target.value), settings.minWobble);
    maxWobbleVal.textContent = settings.maxWobble.toFixed(3);
  });

  document.getElementById('ambientDotsToggle').addEventListener('change', function(e){ settings.ambientDots = e.target.checked; });

  var clickToleranceSlider = document.getElementById('clickToleranceSlider');
  var clickToleranceVal = document.getElementById('clickToleranceVal');
  clickToleranceSlider.addEventListener('input', function(e){
    settings.clickTolerancePx = parseFloat(e.target.value);
    clickToleranceVal.textContent = settings.clickTolerancePx + 'px';
  });

  document.getElementById('zoomToggle').addEventListener('change', function(e){ settings.allowZoom = e.target.checked; });

  document.getElementById('resetSymbolBtn').addEventListener('click', function(){
    symbol.reset();
    three.resetZoom();
  });
})();
