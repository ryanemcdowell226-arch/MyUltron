(function(){
  var three = ULTRON.three;
  var toolCircle = document.getElementById('toolCircle');
  var visible = false;

  ULTRON.interaction.setSymbolClickHandler(function(){
    visible = !visible;
    toolCircle.classList.toggle('hidden', !visible);
  });

  toolCircle.addEventListener('click', function(){
    ULTRON.chat.open();
  });

  // keep the tool tethered to the symbol's current screen position
  three.onFrame(function(){
    if (!visible || !three.symbolGroup) return;
    var pos = three.symbolGroup.getWorldPosition(new THREE.Vector3());
    var screen = three.projectToScreen(pos);
    toolCircle.style.left = (screen.x + 92) + 'px';
    toolCircle.style.top = (screen.y - 28) + 'px';
  });
})();
