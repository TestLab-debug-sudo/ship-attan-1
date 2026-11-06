import * as THREE from 'three';

// Procedural texture generator for wooden marina pier planks
export function createWoodPierTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#8B5A2B';
  ctx.fillRect(0, 0, 512, 512);

  // Wood grain & planks
  const plankHeight = 32;
  for (let y = 0; y < 512; y += plankHeight) {
    ctx.fillStyle = (y / plankHeight) % 2 === 0 ? '#7B4A1B' : '#8A592A';
    ctx.fillRect(0, y, 512, plankHeight - 2);

    // Nail spots
    ctx.fillStyle = '#222222';
    ctx.fillRect(16, y + 12, 4, 4);
    ctx.fillRect(492, y + 12, 4, 4);

    // Grain stripes
    ctx.strokeStyle = 'rgba(50, 25, 10, 0.15)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, y + 6 + i * 6);
      ctx.lineTo(512, y + 8 + i * 5);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural Marine Vessel Model Generator (Composite 3–12 parts)
export function createMarineVesselModel(
  vesselType: 'sport_fisherman' | 'fishing_trawler' | 'catamaran' | 'charter_yacht' | 'utility_tender',
  vesselName: string,
  hullColorHex: number = 0xFFFFFF
): THREE.Group {
  const vesselGroup = new THREE.Group();
  vesselGroup.name = `vessel_${vesselName}`;

  // Shared calibrated PBR materials
  const hullMat = new THREE.MeshStandardMaterial({
    color: hullColorHex,
    roughness: 0.18,
    metalness: 0.12,
  });

  const deckMat = new THREE.MeshStandardMaterial({
    color: 0xDEB887, // Teak deck
    roughness: 0.65,
    metalness: 0.05,
  });

  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0xF8FAFC,
    roughness: 0.22,
    metalness: 0.08,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x063B5C,
    metalness: 0.1,
    roughness: 0.1,
    transmission: 0.85,
    transparent: true,
    opacity: 0.65,
    ior: 1.52,
  });

  const stainlessSteelMat = new THREE.MeshStandardMaterial({
    color: 0xE2E8F0,
    metalness: 0.92,
    roughness: 0.12,
  });

  const bronzePropMat = new THREE.MeshStandardMaterial({
    color: 0xCD7F32,
    metalness: 0.85,
    roughness: 0.25,
  });

  const navRedMat = new THREE.MeshBasicMaterial({ color: 0xFF2222 });
  const navGreenMat = new THREE.MeshBasicMaterial({ color: 0x00FF66 });

  // 1. Primary Silhouette: Hull (sculpted with extruded shape)
  const hullLength = vesselType === 'fishing_trawler' ? 7.2 : 6.4;
  const hullWidth = vesselType === 'catamaran' ? 3.4 : 2.4;
  const hullDepth = 1.1;

  if (vesselType === 'catamaran') {
    // Twin Hulls
    const demiHullGeo = new THREE.BoxGeometry(0.7, hullDepth, hullLength);
    const portHull = new THREE.Mesh(demiHullGeo, hullMat);
    portHull.position.set(-1.1, hullDepth / 2, 0);
    portHull.castShadow = true;
    portHull.receiveShadow = true;
    vesselGroup.add(portHull);

    const stbdHull = new THREE.Mesh(demiHullGeo, hullMat);
    stbdHull.position.set(1.1, hullDepth / 2, 0);
    stbdHull.castShadow = true;
    stbdHull.receiveShadow = true;
    vesselGroup.add(stbdHull);

    // Cross deck / Trampoline
    const bridgeDeckGeo = new THREE.BoxGeometry(hullWidth + 0.2, 0.2, hullLength * 0.8);
    const bridgeDeck = new THREE.Mesh(bridgeDeckGeo, deckMat);
    bridgeDeck.position.set(0, hullDepth + 0.1, 0.1);
    bridgeDeck.castShadow = true;
    vesselGroup.add(bridgeDeck);
  } else {
    // Monohull: Lower V-hull & Main Deck
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-hullWidth / 2, -hullLength / 2);
    hullShape.lineTo(hullWidth / 2, -hullLength / 2); // Transom (stern)
    hullShape.lineTo(hullWidth / 2, hullLength * 0.15);
    hullShape.quadraticCurveTo(hullWidth / 2, hullLength * 0.42, 0, hullLength / 2); // Bow flare
    hullShape.quadraticCurveTo(-hullWidth / 2, hullLength * 0.42, -hullWidth / 2, hullLength * 0.15);
    hullShape.closePath();

    const extrudeSettings = {
      depth: hullDepth,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.15,
      bevelThickness: 0.12,
    };

    const hullGeo = new THREE.ExtrudeGeometry(hullShape, extrudeSettings);
    hullGeo.rotateX(Math.PI / 2);
    const mainHull = new THREE.Mesh(hullGeo, hullMat);
    mainHull.position.set(0, hullDepth, 0);
    mainHull.castShadow = true;
    mainHull.receiveShadow = true;
    vesselGroup.add(mainHull);

    // Teak Inset Deck
    const deckGeo = new THREE.PlaneGeometry(hullWidth * 0.85, hullLength * 0.7);
    deckGeo.rotateX(-Math.PI / 2);
    const insetDeck = new THREE.Mesh(deckGeo, deckMat);
    insetDeck.position.set(0, hullDepth + 0.02, -0.2);
    insetDeck.receiveShadow = true;
    vesselGroup.add(insetDeck);
  }

  // 2. Secondary Read: Cabin / Wheelhouse / Flybridge
  const cabinLength = hullLength * 0.42;
  const cabinWidth = hullWidth * 0.65;
  const cabinHeight = 1.05;

  const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, hullDepth + cabinHeight / 2, 0.3);
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  vesselGroup.add(cabin);

  // Cabin Windshield (Forward & Side Windows)
  const windshieldGeo = new THREE.BoxGeometry(cabinWidth * 0.95, 0.42, 0.1);
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, hullDepth + cabinHeight * 0.68, 0.3 + cabinLength / 2 + 0.02);
  vesselGroup.add(windshield);

  // Side cabin glass
  const sideWindowGeo = new THREE.BoxGeometry(0.08, 0.35, cabinLength * 0.75);
  const portWindow = new THREE.Mesh(sideWindowGeo, glassMat);
  portWindow.position.set(-cabinWidth / 2 - 0.02, hullDepth + cabinHeight * 0.65, 0.3);
  vesselGroup.add(portWindow);

  const stbdWindow = new THREE.Mesh(sideWindowGeo, glassMat);
  stbdWindow.position.set(cabinWidth / 2 + 0.02, hullDepth + cabinHeight * 0.65, 0.3);
  vesselGroup.add(stbdWindow);

  // 3. Accent Detail: Radar Arch & Marine Mast
  const archGroup = new THREE.Group();
  const mastPoleGeo = new THREE.CylinderGeometry(0.04, 0.05, 1.3, 8);
  const mastPole = new THREE.Mesh(mastPoleGeo, stainlessSteelMat);
  mastPole.position.set(0, hullDepth + cabinHeight + 0.65, 0.1);
  mastPole.castShadow = true;
  archGroup.add(mastPole);

  // Rotating Radar Dome / Scanner Bar
  const radarBarGeo = new THREE.BoxGeometry(0.8, 0.08, 0.14);
  const radarBar = new THREE.Mesh(radarBarGeo, stainlessSteelMat);
  radarBar.position.set(0, hullDepth + cabinHeight + 1.25, 0.1);
  radarBar.name = 'radar_scanner';
  archGroup.add(radarBar);

  // GPS Dome
  const domeGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.18, 12);
  const dome = new THREE.Mesh(domeGeo, cabinMat);
  dome.position.set(0.3, hullDepth + cabinHeight + 0.8, 0.15);
  archGroup.add(dome);

  vesselGroup.add(archGroup);

  // 4. Stainless Steel Railings (Pulpit & Stern)
  const railCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-hullWidth * 0.42, hullDepth + 0.4, 0.6),
    new THREE.Vector3(-hullWidth * 0.42, hullDepth + 0.4, hullLength * 0.32),
    new THREE.Vector3(0, hullDepth + 0.5, hullLength * 0.46),
    new THREE.Vector3(hullWidth * 0.42, hullDepth + 0.4, hullLength * 0.32),
    new THREE.Vector3(hullWidth * 0.42, hullDepth + 0.4, 0.6),
  ]);
  const railGeo = new THREE.TubeGeometry(railCurve, 20, 0.025, 6, false);
  const bowRail = new THREE.Mesh(railGeo, stainlessSteelMat);
  vesselGroup.add(bowRail);

  // 5. Navigation Lights (Port Red, Starboard Green, Mast White)
  const navLightGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const portNav = new THREE.Mesh(navLightGeo, navRedMat);
  portNav.position.set(-cabinWidth / 2 - 0.06, hullDepth + cabinHeight * 0.85, 0.6);
  vesselGroup.add(portNav);

  const stbdNav = new THREE.Mesh(navLightGeo, navGreenMat);
  stbdNav.position.set(cabinWidth / 2 + 0.06, hullDepth + cabinHeight * 0.85, 0.6);
  vesselGroup.add(stbdNav);

  // 6. Outboard Propulsion Motors / Stern Props
  const motorGeo = new THREE.BoxGeometry(0.32, 0.75, 0.45);
  const motorPort = new THREE.Mesh(motorGeo, stainlessSteelMat);
  motorPort.position.set(-hullWidth * 0.28, hullDepth * 0.35, -hullLength / 2 - 0.25);
  vesselGroup.add(motorPort);

  const motorStbd = new THREE.Mesh(motorGeo, stainlessSteelMat);
  motorStbd.position.set(hullWidth * 0.28, hullDepth * 0.35, -hullLength / 2 - 0.25);
  vesselGroup.add(motorStbd);

  // Bronze Propellers
  const propGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8);
  const propPort = new THREE.Mesh(propGeo, bronzePropMat);
  propPort.rotation.x = Math.PI / 2;
  propPort.position.set(-hullWidth * 0.28, hullDepth * 0.1, -hullLength / 2 - 0.45);
  vesselGroup.add(propPort);

  const propStbd = new THREE.Mesh(propGeo, bronzePropMat);
  propStbd.rotation.x = Math.PI / 2;
  propStbd.position.set(hullWidth * 0.28, hullDepth * 0.1, -hullLength / 2 - 0.45);
  vesselGroup.add(propStbd);

  // Soft Radial Contact Shadow Grounding
  const shadowGeo = new THREE.PlaneGeometry(hullWidth * 1.5, hullLength * 1.3);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  const sctx = shadowCanvas.getContext('2d')!;
  const grad = sctx.createRadialGradient(64, 64, 10, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0, 20, 35, 0.75)');
  grad.addColorStop(0.6, 'rgba(0, 20, 35, 0.35)');
  grad.addColorStop(1, 'rgba(0, 20, 35, 0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);

  const shadowTex = new THREE.CanvasTexture(shadowCanvas);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = -0.05;
  vesselGroup.add(shadowMesh);

  return vesselGroup;
}

// Procedural Marina Dock Pier Assembly
export function createMarinaDockAssembly(woodTex: THREE.CanvasTexture): THREE.Group {
  const dockGroup = new THREE.Group();
  dockGroup.name = 'marina_dock';

  const dockPlankMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.75,
    metalness: 0.05,
  });

  const pilingMat = new THREE.MeshStandardMaterial({
    color: 0x2A2015,
    roughness: 0.9,
    metalness: 0.1,
  });

  const cleatMat = new THREE.MeshStandardMaterial({
    color: 0x94A3B8,
    metalness: 0.85,
    roughness: 0.25,
  });

  // Main Spine Boardwalk
  const mainPierGeo = new THREE.BoxGeometry(64, 0.6, 5);
  const mainPier = new THREE.Mesh(mainPierGeo, dockPlankMat);
  mainPier.position.set(0, 0.3, -12);
  mainPier.receiveShadow = true;
  mainPier.castShadow = true;
  dockGroup.add(mainPier);

  // Finger Piers (Slips extending out)
  const fingerPositions = [-20, -8, 4, 16];
  fingerPositions.forEach((posX, idx) => {
    const fingerGeo = new THREE.BoxGeometry(2.4, 0.5, 14);
    const finger = new THREE.Mesh(fingerGeo, dockPlankMat);
    finger.position.set(posX, 0.25, -5);
    finger.receiveShadow = true;
    finger.castShadow = true;
    dockGroup.add(finger);

    // Mooring Bollards / Cleats along finger
    const cleatGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8);
    const cleat1 = new THREE.Mesh(cleatGeo, cleatMat);
    cleat1.position.set(posX + 1.0, 0.55, -2);
    dockGroup.add(cleat1);

    const cleat2 = new THREE.Mesh(cleatGeo, cleatMat);
    cleat2.position.set(posX + 1.0, 0.55, -9);
    dockGroup.add(cleat2);
  });

  // Marine Pilings (Posts going into water)
  for (let x = -30; x <= 30; x += 6) {
    const postGeo = new THREE.CylinderGeometry(0.18, 0.2, 4.0, 10);
    const post = new THREE.Mesh(postGeo, pilingMat);
    post.position.set(x, -1.2, -14.2);
    post.castShadow = true;
    dockGroup.add(post);
  }

  return dockGroup;
}

// Procedural Channel Marker Buoy
export function createMarineBuoy(colorHex: number, posX: number, posZ: number): THREE.Group {
  const buoy = new THREE.Group();
  buoy.position.set(posX, 0, posZ);

  const buoyMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.35,
    metalness: 0.2,
  });

  const baseGeo = new THREE.CylinderGeometry(0.7, 0.5, 1.2, 12);
  const baseMesh = new THREE.Mesh(baseGeo, buoyMat);
  baseMesh.position.y = 0.5;
  buoy.add(baseMesh);

  // Tower Cage
  const cageGeo = new THREE.ConeGeometry(0.4, 1.4, 6);
  const cageMesh = new THREE.Mesh(cageGeo, buoyMat);
  cageMesh.position.y = 1.7;
  buoy.add(cageMesh);

  // Flashing Light Top
  const lightGeo = new THREE.SphereGeometry(0.15, 8, 8);
  const lightMat = new THREE.MeshBasicMaterial({ color: colorHex });
  const lightMesh = new THREE.Mesh(lightGeo, lightMat);
  lightMesh.position.y = 2.45;
  buoy.add(lightMesh);

  return buoy;
}
