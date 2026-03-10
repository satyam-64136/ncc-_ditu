/* ═══════════════════════════════════════════════════════════════
   THREE.JS PARADE GROUND SCENE
   DIT UNIVERSITY NCC  ·  29 UK BATTALION
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let scene, camera, renderer, clock;
  let flag, flagMat;
  let cadets = [];
  let stars, starMat;
  let lights = {};
  let mx = 0, my = 0;
  let isNight = false;

  /* ── INIT ────────────────────────────────────────────────── */
  function init() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    clock = new THREE.Clock();
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a1a0a, 0.030);

    camera = new THREE.PerspectiveCamera(58, canvas.clientWidth / canvas.clientHeight, 0.1, 600);
    camera.position.set(0, 7, 24);
    camera.lookAt(0, 2, 0);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    buildGround();
    buildBuilding();
    buildTrees();
    buildFlagPole();
    buildFlag();
    buildCadets();
    buildStars();
    setupLights();

    // read stored mode
    const m = localStorage.getItem('ncc-mode') || 'day';
    applyMode(m === 'night');

    window.addEventListener('resize', onResize, { passive: true });
    document.addEventListener('mousemove', e => {
      mx = (e.clientX / innerWidth  - .5) * 2;
      my = (e.clientY / innerHeight - .5) * 2;
    }, { passive: true });

    // expose mode setter
    window.__setSceneMode = function(m) { applyMode(m === 'night'); };

    animate();
  }

  /* ── GROUND ──────────────────────────────────────────────── */
  function buildGround() {
    const geo = new THREE.PlaneGeometry(140, 140);
    const mat = new THREE.MeshLambertMaterial({ color: 0x193b1a });
    const m   = new THREE.Mesh(geo, mat);
    m.rotation.x = -Math.PI / 2;
    m.receiveShadow = true;
    scene.add(m);

    // parade lane lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 });
    for (let i = -3; i <= 3; i++) {
      const lg = new THREE.BoxGeometry(36, .02, .14);
      const lm = new THREE.Mesh(lg, lineMat);
      lm.position.set(0, .01, i * 2.2);
      scene.add(lm);
    }
    // centre line
    const cl = new THREE.Mesh(new THREE.BoxGeometry(.14,.02,15), lineMat);
    cl.position.set(0,.01,0);
    scene.add(cl);
  }

  /* ── BUILDING ────────────────────────────────────────────── */
  function buildBuilding() {
    const bm = new THREE.MeshLambertMaterial({ color: 0x162516 });
    const b  = new THREE.Mesh(new THREE.BoxGeometry(50, 14, 4), bm);
    b.position.set(0, 7, -26);
    b.receiveShadow = true;
    scene.add(b);
    // windows
    const wm = new THREE.MeshBasicMaterial({ color: 0x88aacc, transparent:true, opacity:.6 });
    for (let i = -5; i <= 5; i++) for (let j = 0; j < 2; j++) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(2.8,2.8,.1), wm);
      w.position.set(i * 4.4, 3.5 + j * 4.5, -23.8);
      w.userData.isWindow = true;
      scene.add(w);
    }
  }

  /* ── TREES ───────────────────────────────────────────────── */
  function buildTrees() {
    [[-20,0,-16],[-22,0,-8],[-24,0,0],[20,0,-16],[22,0,-8],[24,0,0]].forEach(p => {
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(.18,.28,3,7),
        new THREE.MeshLambertMaterial({color:0x4a3520})
      );
      trunk.position.set(p[0],1.5,p[2]); trunk.castShadow = true; scene.add(trunk);
      for (let k=0;k<3;k++) {
        const f = new THREE.Mesh(
          new THREE.ConeGeometry(1.8-k*.3,2.8,8),
          new THREE.MeshLambertMaterial({color:0x1a4520})
        );
        f.position.set(p[0],4+k*2,p[2]); f.castShadow=true; scene.add(f);
      }
    });
  }

  /* ── FLAG POLE ───────────────────────────────────────────── */
  function buildFlagPole() {
    const poleMat = new THREE.MeshLambertMaterial({color:0xb0b0b0});
    const base    = new THREE.Mesh(new THREE.CylinderGeometry(.6,.8,.4,8),
                    new THREE.MeshLambertMaterial({color:0x888888}));
    base.position.set(-13,.2,-9); scene.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,16,8), poleMat);
    pole.position.set(-13,8,-9); pole.castShadow=true; scene.add(pole);
  }

  /* ── WAVING FLAG ─────────────────────────────────────────── */
  function buildFlag() {
    const geo = new THREE.PlaneGeometry(3.4, 2.2, 14, 9);
    // draw India tri-colour on canvas
    const cv  = document.createElement('canvas');
    cv.width  = 420; cv.height = 280;
    const ctx = cv.getContext('2d');
    ctx.fillStyle='#FF9933'; ctx.fillRect(0,0,420,94);
    ctx.fillStyle='#FFFFFF'; ctx.fillRect(0,94,420,92);
    ctx.fillStyle='#138808'; ctx.fillRect(0,186,420,94);
    // Ashoka wheel
    ctx.strokeStyle='#00008B'; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.arc(210,140,34,0,Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(210,140,6,0,Math.PI*2);
    ctx.fillStyle='#00008B'; ctx.fill();
    for(let i=0;i<24;i++){
      const a=i/24*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(210+Math.cos(a)*8,140+Math.sin(a)*8);
      ctx.lineTo(210+Math.cos(a)*33,140+Math.sin(a)*33); ctx.stroke();
    }
    flagMat = new THREE.MeshLambertMaterial({
      map: new THREE.CanvasTexture(cv),
      side: THREE.DoubleSide
    });
    flag = new THREE.Mesh(geo, flagMat);
    flag.position.set(-11.3, 14.8, -9);
    scene.add(flag);
  }

  /* ── CADETS ──────────────────────────────────────────────── */
  function buildCadets() {
    const positions = [];
    for(let r=0;r<3;r++) for(let c=0;c<5;c++) positions.push([c*2.2-4.4, 0, r*2.1+1]);
    const bm = new THREE.MeshLambertMaterial({color:0x2a4a2a});
    const hm = new THREE.MeshLambertMaterial({color:0xc89070});
    const km = new THREE.MeshLambertMaterial({color:0x141414});
    const hm2= new THREE.MeshLambertMaterial({color:0x1a3a1a});
    positions.forEach((pos, i) => {
      const g = new THREE.Group();
      // torso
      g.add(mkMesh(new THREE.BoxGeometry(.5,1.1,.28), bm, 0,1.2,0));
      // head
      g.add(mkMesh(new THREE.SphereGeometry(.19,8,6), hm, 0,2,.0));
      // cap
      g.add(mkMesh(new THREE.CylinderGeometry(.23,.21,.15,8), hm2, 0,2.12,0));
      // legs
      for(let s=-1;s<=1;s+=2){
        const leg = mkMesh(new THREE.BoxGeometry(.17,.75,.17), bm, s*.14,.5,0);
        leg.userData.side = s;
        g.add(leg);
        g.add(mkMesh(new THREE.BoxGeometry(.18,.23,.28), km, s*.14,.12,.05));
      }
      // arms
      for(let s=-1;s<=1;s+=2){
        const arm = mkMesh(new THREE.BoxGeometry(.14,.7,.14), bm, s*.34,1.2,0);
        arm.userData.isArm = true; arm.userData.side = s;
        g.add(arm);
      }
      // rifle
      const rif = mkMesh(new THREE.BoxGeometry(.04,1.15,.04),
        new THREE.MeshLambertMaterial({color:0x3a2a18}), .46,1.45,0);
      rif.rotation.z = .12; g.add(rif);

      g.position.set(...pos);
      g.userData.off = i * .32;
      scene.add(g); cadets.push(g);
    });
  }

  function mkMesh(geo, mat, x, y, z) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x,y,z); m.castShadow=true; return m;
  }

  /* ── STARS ───────────────────────────────────────────────── */
  function buildStars() {
    const geo = new THREE.BufferGeometry();
    const n   = 1400, pos = new Float32Array(n*3);
    for(let i=0;i<n*3;i+=3){
      pos[i]  = (Math.random()-.5)*350;
      pos[i+1]= Math.random()*130+15;
      pos[i+2]= (Math.random()-.5)*350;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    starMat = new THREE.PointsMaterial({color:0xffffff,size:.3,transparent:true,opacity:0});
    stars   = new THREE.Points(geo, starMat);
    scene.add(stars);
  }

  /* ── LIGHTS ──────────────────────────────────────────────── */
  function setupLights() {
    lights.ambient = new THREE.AmbientLight(0x4a7a4a, .6);
    scene.add(lights.ambient);

    lights.sun = new THREE.DirectionalLight(0xfff5d0, 1.3);
    lights.sun.position.set(35, 55, 35);
    lights.sun.castShadow = true;
    lights.sun.shadow.mapSize.setScalar(2048);
    lights.sun.shadow.camera.near = .1;
    lights.sun.shadow.camera.far  = 160;
    lights.sun.shadow.camera.left = lights.sun.shadow.camera.bottom = -45;
    lights.sun.shadow.camera.right = lights.sun.shadow.camera.top   = 45;
    scene.add(lights.sun);

    lights.spot = new THREE.SpotLight(0xffd080, 0, 70, Math.PI/5.5, .55);
    lights.spot.position.set(0, 28, 0);
    lights.spot.target.position.set(0,0,4);
    lights.spot.castShadow = true;
    scene.add(lights.spot); scene.add(lights.spot.target);
  }

  /* ── MODE ────────────────────────────────────────────────── */
  function applyMode(night) {
    isNight = night;
    if (night) {
      scene.background = new THREE.Color(0x020810);
      scene.fog.color.set(0x020810);
      lights.ambient.color.set(0x102030); lights.ambient.intensity = .12;
      lights.sun.intensity = .04;
      lights.spot.intensity = 2.8;
      if (starMat) starMat.opacity = .92;
      // dim windows
      scene.traverse(o => o.userData.isWindow && (o.material.color.set(0xffcc44), o.material.opacity=.75));
    } else {
      scene.background = new THREE.Color(0x4a7ab5);
      scene.fog.color.set(0x8aabb5);
      lights.ambient.color.set(0x6a8a6a); lights.ambient.intensity = .7;
      lights.sun.intensity = 1.3;
      lights.spot.intensity = 0;
      if (starMat) starMat.opacity = 0;
      scene.traverse(o => o.userData.isWindow && (o.material.color.set(0x88aacc), o.material.opacity=.6));
    }
  }

  /* ── ANIMATE ─────────────────────────────────────────────── */
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // camera drift
    camera.position.x += (mx * 3.5 - camera.position.x) * .018;
    camera.position.y += (7 + my  * 1.2 - camera.position.y) * .018;
    camera.lookAt(0, 2, 0);

    // march
    cadets.forEach(cad => {
      const off = cad.userData.off;
      cad.children.forEach(c => {
        if (c.userData.isArm) c.rotation.x = Math.sin(t*2.6+off + c.userData.side*Math.PI)*.38;
        else if (c.userData.side && c.geometry?.type === 'BoxGeometry') {
          const isLeg = c.geometry.parameters?.height > .5;
          if (isLeg) c.position.y = .5 + Math.sin(t*2.6+off+c.userData.side*Math.PI)*.2;
        }
      });
    });

    // flag wave
    if (flag) {
      const pos = flag.geometry.attributes.position;
      const ws = 15, hs = 10;
      for (let r=0;r<hs;r++) for (let c=0;c<ws;c++) {
        const idx = r*ws+c;
        const xf  = c/(ws-1);
        pos.setZ(idx, Math.sin(xf*Math.PI*2 - t*3.2) * xf * .42);
      }
      pos.needsUpdate = true;
      flag.geometry.computeVertexNormals();
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    const cv = document.getElementById('three-canvas');
    if (!cv) return;
    camera.aspect = cv.clientWidth / cv.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(cv.clientWidth, cv.clientHeight);
  }

  /* ── BOOTSTRAP ───────────────────────────────────────────── */
  if (typeof THREE !== 'undefined') {
    init();
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = init;
    document.head.appendChild(s);
  }
})();
