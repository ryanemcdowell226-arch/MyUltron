// public/ui/resizable-window.js
// Adds pointer-based drag and resize behavior and also listens to hand grab events for moving

(function(){
  function initWindows(){
    const sampleHTML = document.querySelector('link[href="/ui/logo.css"]') ? null : null;
    // attach behaviors to existing .resizable-window elements
    document.querySelectorAll('.resizable-window').forEach(win=>setup(win));
  }

  function setup(win){
    const header = win.querySelector('.window-header');
    const handle = win.querySelector('.resize-handle');
    let dragging=false, resizing=false;
    let start = {};

    header.addEventListener('pointerdown', (e)=>{
      e.preventDefault();
      dragging = true; win.classList.add('dragging');
      start = {x: e.clientX, y: e.clientY, left: win.offsetLeft, top: win.offsetTop};
      window.addEventListener('pointermove', onDrag);
      window.addEventListener('pointerup', endDrag);
    });
    function onDrag(e){
      if (!dragging) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      win.style.left = Math.max(0, Math.min(window.innerWidth - 40, start.left + dx)) + 'px';
      win.style.top  = Math.max(0, Math.min(window.innerHeight - 40, start.top + dy)) + 'px';
    }
    function endDrag(){ dragging=false; win.classList.remove('dragging'); window.removeEventListener('pointermove', onDrag); window.removeEventListener('pointerup', endDrag); }

    handle && handle.addEventListener('pointerdown', (e)=>{
      e.preventDefault();
      resizing = true; win.classList.add('dragging');
      start = {x: e.clientX, y: e.clientY, w: win.offsetWidth, h: win.offsetHeight};
      window.addEventListener('pointermove', onResize);
      window.addEventListener('pointerup', endResize);
    });
    function onResize(e){ if(!resizing) return; const dx = e.clientX - start.x, dy = e.clientY - start.y; win.style.width = Math.max(200, start.w + dx)+'px'; win.style.height = Math.max(120, start.h + dy)+'px'; }
    function endResize(){ resizing=false; win.classList.remove('dragging'); window.removeEventListener('pointermove', onResize); window.removeEventListener('pointerup', endResize); }

    // Hand grab integration: move on handgrabstart/move/end
    document.addEventListener('handgrabstart', (e)=>{
      const pos = e.detail.pos;
      // if hand is over this window header, start a simulated drag
      const el = document.elementFromPoint(pos.x, pos.y);
      if (el && (el.closest('.resizable-window') === win || el === header)){
        // begin grab-drag for this window
        dragging = true; win.classList.add('dragging');
        start = {x: pos.x, y: pos.y, left: win.offsetLeft, top: win.offsetTop};
      }
    });
    document.addEventListener('handgrabmove', (e)=>{
      if (!dragging) return;
      const pos = e.detail.pos;
      const dx = pos.x - start.x, dy = pos.y - start.y;
      win.style.left = Math.max(0, Math.min(window.innerWidth - 40, start.left + dx)) + 'px';
      win.style.top  = Math.max(0, Math.min(window.innerHeight - 40, start.top + dy)) + 'px';
    });
    document.addEventListener('handgrabend', ()=>{ if (dragging) { dragging=false; win.classList.remove('dragging'); } });
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    initWindows();
  });
  // also run immediately in case scripts load late
  initWindows();
})();
