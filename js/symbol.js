// Builds a stylized dotted-wireframe rendition of the U.L.T.R.O.N shield
// emblem (shield outline + V notch + antenna + node), replacing the old orb.
// This is a procedural interpretation of the provided artwork rather than a
// pixel trace of it -- built from the same dot-wire pipeline as everything
// else so it stays visually consistent with the rest of the scene.
(function(){
  var three = ULTRON.three;
  var settings = ULTRON.settings;
  var SYMBOL_COLOR = 0xff3b3b;

  var symbolGroup = new THREE.Group();
  three.scene.add(symbolGroup);

  // ---- outer shield shape with a V-notch hole cut near the top ----
  var shieldPts = [
    [-0.55, 0.95], [0.55, 0.95], [1.05, 0.15], [0.0, -1.05], [-1.05, 0.15]
  ];
  var shieldShape = new THREE.Shape();
  shieldShape.moveTo(shieldPts[0][0], shieldPts[0][1]);
  for (var i=1;i<shieldPts.length;i++) shieldShape.lineTo(shieldPts[i][0], shieldPts[i][1]);
  shieldShape.closePath();

  var notchHole = new THREE.Path();
  notchHole.moveTo(-0.24, 0.95);
  notchHole.lineTo(0.24, 0.95);
  notchHole.lineTo(0.06, 0.20);
  notchHole.lineTo(-0.06, 0.20);
  notchHole.closePath();
  shieldShape.holes.push(notchHole);

  var extrudeSettings = { depth: 0.14, bevelEnabled: false, curveSegments: 1 };
  var shieldGeo = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
  shieldGeo.translate(0, 0, -0.07);
  var shieldEdges = new THREE.EdgesGeometry(shieldGeo, 20);

  // faint filled shield so the silhouette still reads at a glance
  var fillMat = new THREE.MeshBasicMaterial({ color: SYMBOL_COLOR, transparent:true, opacity:0.05, side:THREE.DoubleSide, depthWrite:false });
  var fillMesh = new THREE.Mesh(shieldGeo, fillMat);
  symbolGroup.add(fillMesh);

  var shieldWireDots, notchWireDots;

  // ---- antenna: vertical line rising from the notch vertex through a node ring ----
  var antennaGeo = new THREE.BufferGeometry();
  antennaGeo.setAttribute('position', new THREE.Float32BufferAttribute([0,0.20,0, 0,1.35,0], 3));
  var antennaEdges = antennaGeo; // already just 2 points = 1 segment, reuse directly

  var nodeRing = three.makeRingDots(0.16, Math.PI/2, 0, 0.9, 0xfff4ec, 40);
  nodeRing.position.set(0, 1.42, 0);

  var coreGeo = new THREE.SphereGeometry(0.075, 16, 16);
  var coreMat = new THREE.MeshBasicMaterial({ color:0xfff4ec, transparent:true, opacity:0.95, blending:THREE.AdditiveBlending });
  var coreMesh = new THREE.Mesh(coreGeo, coreMat);
  coreMesh.position.set(0, 1.42, 0);

  var antennaWireDots;

  function computePPS(base){ return Math.max(1, Math.round(base * settings.dotCountMultiplier)); }

  function buildSymbolDots(){
    [shieldWireDots, notchWireDots, antennaWireDots].forEach(function(obj){
      if (obj){
        symbolGroup.remove(obj);
        three.clearJitterFor(obj);
        obj.geometry.dispose();
        obj.material.dispose();
      }
    });

    shieldWireDots = three.buildDotWire(shieldEdges, computePPS(5), SYMBOL_COLOR, 0.03*settings.dotSize, 0.85, true);
    symbolGroup.add(shieldWireDots);

    antennaWireDots = three.buildDotWire(antennaEdges, computePPS(10), 0xfff4ec, 0.026*settings.dotSize, 0.8, true);
    symbolGroup.add(antennaWireDots);

    three.clearJitterFor(nodeRing);
    three.registerJitter(nodeRing, new Float32Array(nodeRing.geometry.attributes.position.array), 1.2);
  }
  buildSymbolDots();

  symbolGroup.add(nodeRing, coreMesh);

  function applyDotSizeLive(){
    shieldWireDots.material.size = 0.03*settings.dotSize;
    antennaWireDots.material.size = 0.026*settings.dotSize;
  }

  // ---- idle life animation (no user rotation control anymore) ----
  three.onFrame(function(t, dt){
    var pulse = Math.sin(t*1.1);
    coreMesh.scale.setScalar(1 + 0.35*Math.max(pulse,0));
    if (settings.idleRotation){
      symbolGroup.rotation.y = Math.sin(t*0.18)*0.12*settings.idleRotationSpeed;
      symbolGroup.rotation.x = Math.sin(t*0.13+1)*0.05*settings.idleRotationSpeed;
    }
  });

  ULTRON.symbol = {
    group: symbolGroup,
    buildDots: buildSymbolDots,
    applyDotSizeLive: applyDotSizeLive,
    reset: function(){ symbolGroup.position.set(0,0,0); }
  };
  three.symbolGroup = symbolGroup;
})();
