(function(){
  var settings = ULTRON.settings;

  var glCanvas = document.getElementById('glCanvas');
  var renderer = new THREE.WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.05, 100);
  var zoomDistance = 7.4;
  camera.position.set(0, 0, zoomDistance);

  function resize(){
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- glow sprite texture ----
  function makeGlowTexture(){
    var size = 64;
    var c = document.createElement('canvas');
    c.width = c.height = size;
    var ctx = c.getContext('2d');
    var grad = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,224,170,0.85)');
    grad.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,size,size);
    return new THREE.CanvasTexture(c);
  }
  var glowTex = makeGlowTexture();

  // ---- jitter registry: makes dotted wires hover/breathe ----
  var jitterTargets = [];
  function registerJitter(points, baseArray, freq){
    var count = baseArray.length / 3;
    var phases = new Float32Array(count);
    var randFactor = new Float32Array(count);
    for (var i=0;i<count;i++){ phases[i] = Math.random()*Math.PI*2; randFactor[i] = Math.random(); }
    jitterTargets.push({ points: points, base: baseArray, phases: phases, randFactor: randFactor, freq: freq !== undefined ? freq : (0.7 + Math.random()*0.6) });
  }
  function clearJitterFor(points){
    for (var i=jitterTargets.length-1;i>=0;i--){
      if (jitterTargets[i].points === points) jitterTargets.splice(i,1);
    }
  }
  function updateJitter(t){
    var minW = settings.minWobble, maxW = Math.max(settings.minWobble, settings.maxWobble);
    for (var k=0;k<jitterTargets.length;k++){
      var tgt = jitterTargets[k];
      var attr = tgt.points.geometry.attributes.position;
      var arr = attr.array, base = tgt.base, phases = tgt.phases, rf = tgt.randFactor, freq = tgt.freq;
      for (var i=0;i<base.length;i+=3){
        var idx = i/3;
        var bx=base[i], by=base[i+1], bz=base[i+2];
        var len = Math.sqrt(bx*bx+by*by+bz*bz) || 1;
        var amp = minW + (maxW - minW) * rf[idx];
        var wobble = Math.sin(t*freq + phases[idx]) * amp;
        arr[i]   = bx + (bx/len) * wobble;
        arr[i+1] = by + (by/len) * wobble;
        arr[i+2] = bz + (bz/len) * wobble;
      }
      attr.needsUpdate = true;
    }
  }

  // ---- convert a wireframe (EdgesGeometry) into a dense field of dots ----
  function buildDotWire(edgesGeo, pointsPerSegment, color, size, opacity, additive){
    var src = edgesGeo.attributes.position.array;
    var out = [];
    for (var i=0;i<src.length;i+=6){
      var x0=src[i],y0=src[i+1],z0=src[i+2];
      var x1=src[i+3],y1=src[i+4],z1=src[i+5];
      for (var s=0;s<pointsPerSegment;s++){
        var t = pointsPerSegment===1 ? 0 : s/(pointsPerSegment-1);
        out.push(x0+(x1-x0)*t, y0+(y1-y0)*t, z0+(z1-z0)*t);
      }
    }
    var base = new Float32Array(out);
    var geo = new THREE.BufferGeometry();
    var posAttr = new THREE.BufferAttribute(new Float32Array(base), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    var mat = new THREE.PointsMaterial({
      size: size, color: color, transparent: true, opacity: opacity,
      depthWrite: false, sizeAttenuation: true,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    var points = new THREE.Points(geo, mat);
    registerJitter(points, base);
    return points;
  }

  function makeRingDots(radius, tiltX, tiltZ, opacity, color, segments){
    var positions = [];
    for (var i=0;i<segments;i++){
      var theta = (i/segments) * Math.PI * 2;
      positions.push(Math.cos(theta)*radius, Math.sin(theta)*radius, 0);
    }
    var base = new Float32Array(positions);
    var geo = new THREE.BufferGeometry();
    var posAttr = new THREE.BufferAttribute(new Float32Array(base), 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', posAttr);
    var mat = new THREE.PointsMaterial({ size:0.02, color:color, transparent:true, opacity:opacity, depthWrite:false, sizeAttenuation:true });
    var points = new THREE.Points(geo, mat);
    points.rotation.x = tiltX; points.rotation.z = tiltZ;
    registerJitter(points, base, 1.1);
    return points;
  }

  // ---- sparse static ambient dot field for spatial depth reference ----
  var ambientField = null;
  (function buildAmbientField(){
    var count = 260;
    var positions = new Float32Array(count*3);
    for (var i=0;i<count;i++){
      var r = 6 + Math.random()*14;
      var theta = Math.random()*Math.PI*2;
      var phi = Math.acos((Math.random()*2)-1);
      positions[i*3]   = r*Math.sin(phi)*Math.cos(theta);
      positions[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
      positions[i*3+2] = -Math.abs(r*Math.cos(phi)) - 2; // bias behind the symbol
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
    var mat = new THREE.PointsMaterial({ size:0.03, color:0xff6b4d, transparent:true, opacity:0.18, depthWrite:false, sizeAttenuation:true });
    ambientField = new THREE.Points(geo, mat);
    scene.add(ambientField);
  })();

  // ---- frame subscribers (symbol idle anim, tool-menu positioning, etc.) ----
  var subscribers = [];
  function onFrame(fn){ subscribers.push(fn); }

  var clock = new THREE.Clock();
  function animate(){
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.getElapsedTime();

    ambientField.visible = settings.ambientDots;
    updateJitter(t);

    for (var i=0;i<subscribers.length;i++) subscribers[i](t, dt);

    camera.lookAt(0,0,0);
    renderer.render(scene, camera);
  }
  animate();

  function clamp(v,lo,hi){ return Math.max(lo, Math.min(hi, v)); }

  function dolly(deltaWorldUnits){
    zoomDistance = clamp(zoomDistance + deltaWorldUnits, 2.6, 20);
    camera.position.z = zoomDistance;
  }

  // project a world position to screen pixel coords
  function projectToScreen(vec3){
    var v = vec3.clone().project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight
    };
  }

  // convert a screen-pixel delta into a world-space delta at a given depth (world z)
  function screenDeltaToWorld(dxPx, dyPx, worldZ){
    var distance = camera.position.z - worldZ;
    var vFov = camera.fov * Math.PI/180;
    var viewHeight = 2 * Math.tan(vFov/2) * distance;
    var viewWidth = viewHeight * camera.aspect;
    return {
      x: (dxPx / window.innerWidth) * viewWidth,
      y: -(dyPx / window.innerHeight) * viewHeight
    };
  }

  ULTRON.three = {
    scene: scene,
    camera: camera,
    renderer: renderer,
    glowTex: glowTex,
    registerJitter: registerJitter,
    clearJitterFor: clearJitterFor,
    buildDotWire: buildDotWire,
    makeRingDots: makeRingDots,
    onFrame: onFrame,
    dolly: dolly,
    projectToScreen: projectToScreen,
    screenDeltaToWorld: screenDeltaToWorld,
    getZoomDistance: function(){ return zoomDistance; },
    resetZoom: function(){ zoomDistance = 7.4; camera.position.set(0,0,zoomDistance); }
  };
})();
