// Every input source (mouse, left hand, right hand) funnels through this
// same pointerDown/pointerMove/pointerUp pipeline. A press only becomes a
// "drag" once it moves past the tolerance; otherwise release = a click,
// dispatched as a real .click() on whatever DOM element is underneath (so
// ordinary addEventListener('click', ...) handlers just work for hands too).
(function(){
  var settings = ULTRON.settings;
  var three = ULTRON.three;

  var dragHandles = []; // { handleEl, windowEl }
  var sessions = {};    // sourceId -> { target, kind, startX, startY, offsetX, offsetY, dragging, clickCapable }
  var symbolClickHandler = null;
  var SYMBOL_HIT_RADIUS = 70;

  function registerDragHandle(handleEl, windowEl){
    dragHandles.push({ handleEl: handleEl, windowEl: windowEl });
  }
  function unregisterDragHandle(windowEl){
    dragHandles = dragHandles.filter(function(d){ return d.windowEl !== windowEl; });
  }
  function setSymbolClickHandler(fn){ symbolClickHandler = fn; }

  function findDragHandleAt(x, y){
    var el = document.elementFromPoint(x, y);
    while (el){
      for (var i=0;i<dragHandles.length;i++){
        if (dragHandles[i].handleEl === el) return dragHandles[i];
      }
      el = el.parentElement;
    }
    return null;
  }

  function symbolScreenHit(x, y){
    if (!three.symbolGroup) return null;
    var pos = three.symbolGroup.getWorldPosition(new THREE.Vector3());
    var screen = three.projectToScreen(pos);
    var dx = screen.x - x, dy = screen.y - y;
    if (Math.sqrt(dx*dx+dy*dy) <= SYMBOL_HIT_RADIUS) return { screen: screen, worldZ: pos.z };
    return null;
  }

  function pointerDown(sourceId, x, y, opts){
    opts = opts || {};
    var clickCapable = opts.clickCapable !== false;

    var handle = findDragHandleAt(x, y);
    if (handle){
      var rect = handle.windowEl.getBoundingClientRect();
      sessions[sourceId] = {
        kind: 'dom', el: handle.windowEl,
        startX: x, startY: y,
        offsetX: x - rect.left, offsetY: y - rect.top,
        dragging: false, clickCapable: clickCapable
      };
      bringToFront(handle.windowEl);
      return;
    }

    var symHit = symbolScreenHit(x, y);
    if (symHit){
      sessions[sourceId] = {
        kind: 'symbol',
        startX: x, startY: y,
        worldZ: symHit.worldZ,
        dragging: false, clickCapable: clickCapable
      };
      return;
    }

    // nothing draggable here -- still track so a plain click can fire on release
    sessions[sourceId] = { kind: 'none', startX: x, startY: y, dragging: false, clickCapable: clickCapable };
  }

  function pointerMove(sourceId, x, y){
    var s = sessions[sourceId];
    if (!s) return;
    var dx = x - s.startX, dy = y - s.startY;
    if (!s.dragging && Math.sqrt(dx*dx+dy*dy) > settings.clickTolerancePx){
      s.dragging = true;
    }
    if (!s.dragging) return;

    if (s.kind === 'dom'){
      s.el.style.left = (x - s.offsetX) + 'px';
      s.el.style.top = (y - s.offsetY) + 'px';
    } else if (s.kind === 'symbol'){
      var lastX = s.lastX !== undefined ? s.lastX : s.startX;
      var lastY = s.lastY !== undefined ? s.lastY : s.startY;
      var worldDelta = three.screenDeltaToWorld(x - lastX, y - lastY, s.worldZ);
      three.symbolGroup.position.x += worldDelta.x;
      three.symbolGroup.position.y += worldDelta.y;
    }
    s.lastX = x; s.lastY = y;
  }

  function pointerUp(sourceId, x, y, opts){
    opts = opts || {};
    var synthesizeClick = opts.synthesizeClick !== false;
    var s = sessions[sourceId];
    delete sessions[sourceId];
    if (!s) return;

    if (s.dragging || !s.clickCapable) return;

    // it was a click, not a drag
    if (s.kind === 'symbol' || symbolScreenHit(x, y)){
      if (symbolClickHandler) symbolClickHandler();
      return;
    }
    if (synthesizeClick){
      var el = document.elementFromPoint(x, y);
      if (el) el.click();
    }
  }

  function cancel(sourceId){ delete sessions[sourceId]; }

  var topZ = 100;
  function bringToFront(el){ topZ += 1; el.style.zIndex = topZ; }

  ULTRON.interaction = {
    registerDragHandle: registerDragHandle,
    unregisterDragHandle: unregisterDragHandle,
    setSymbolClickHandler: setSymbolClickHandler,
    pointerDown: pointerDown,
    pointerMove: pointerMove,
    pointerUp: pointerUp,
    cancel: cancel,
    bringToFront: bringToFront
  };
})();
