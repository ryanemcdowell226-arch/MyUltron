(function(){
  var layer = document.getElementById('windowsLayer');
  var open = {}; // id -> window element

  function createWindow(opts){
    if (open[opts.id]){
      open[opts.id].style.display = 'flex';
      ULTRON.interaction.bringToFront(open[opts.id]);
      return open[opts.id];
    }

    var win = document.createElement('div');
    win.className = 'app-window';
    win.style.left = (opts.x || 120) + 'px';
    win.style.top = (opts.y || 120) + 'px';
    win.style.width = (opts.width || 320) + 'px';
    win.style.height = (opts.height || 360) + 'px';

    var titlebar = document.createElement('div');
    titlebar.className = 'win-titlebar';
    var titleSpan = document.createElement('span');
    titleSpan.textContent = opts.title || '';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'win-close';
    closeBtn.type = 'button';
    closeBtn.innerHTML = '&times;';
    titlebar.appendChild(titleSpan);
    titlebar.appendChild(closeBtn);

    var body = document.createElement('div');
    body.className = 'win-body';

    win.appendChild(titlebar);
    win.appendChild(body);
    layer.appendChild(win);

    ULTRON.interaction.registerDragHandle(titlebar, win);
    ULTRON.interaction.bringToFront(win);

    closeBtn.addEventListener('click', function(){
      ULTRON.interaction.unregisterDragHandle(win);
      win.remove();
      delete open[opts.id];
      if (opts.onClose) opts.onClose();
    });

    if (opts.contentBuilder) opts.contentBuilder(body, win);

    open[opts.id] = win;
    return win;
  }

  ULTRON.windows = { createWindow: createWindow };
})();
