import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * VIEW: 3D Oceanic Background Scene with Three.js
 * - Animated ocean waves with multi-octave Gerstner-style vertex displacement
 * - Specular sunlight reflection and turquoise/deep-sea marine color gradients
 * - Detailed 3D Fishing Boat ("OMC-102") with realistic floating, heaving, pitch & roll rocking
 * - Coastal island, nautical lighthouse, and gliding seagulls
 * - Interactive camera parallax on mouse move
 * - Mobile GPU-optimized rendering
 */
export const OceanicBackground3D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene, Camera, Renderer Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x8ecae6, 0.008);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    // Camera positioned to view ocean and boat from slightly elevated vantage
    camera.position.set(-8, 9, 32);
    camera.lookAt(-2, 3, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // --- Atmospheric Lighting ---
    const ambientLight = new THREE.AmbientLight(0xdff4fd, 1.4);
    scene.add(ambientLight);

    // Sunlight from morning horizon
    const sunLight = new THREE.DirectionalLight(0xfff3d1, 2.8);
    sunLight.position.set(-25, 20, 15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    scene.add(sunLight);

    // Fill ocean bounce light
    const oceanFillLight = new THREE.DirectionalLight(0x0284c7, 0.8);
    oceanFillLight.position.set(15, -5, -10);
    scene.add(oceanFillLight);

    // --- Sky Dome / Gradient Background ---
    const skyGeo = new THREE.SphereGeometry(300, 32, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x38bdf8) },
        bottomColor: { value: new THREE.Color(0xfef08a) },
        horizonColor: { value: new THREE.Color(0xbae6fd) }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 horizonColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 sky = mix(horizonColor, topColor, max(pow(max(h, 0.0), 0.6), 0.0));
          if (h < 0.0) sky = mix(horizonColor, bottomColor, -h * 2.0);
          gl_FragColor = vec4(sky, 1.0);
        }
      `
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // --- Dynamic 3D Ocean Water ---
    const oceanWidth = 180;
    const oceanDepth = 180;
    const oceanSegments = 96;
    const oceanGeo = new THREE.PlaneGeometry(oceanWidth, oceanDepth, oceanSegments, oceanSegments);
    oceanGeo.rotateX(-Math.PI / 2);

    // Store original flat positions for wave displacement
    const posAttr = oceanGeo.attributes.position;
    const originalPositions = posAttr.array.slice();

    const oceanMat = new THREE.MeshPhysicalMaterial({
      color: 0x075985,
      roughness: 0.12,
      metalness: 0.15,
      transmission: 0.45,
      ior: 1.333,
      reflectivity: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      flatShading: true
    });

    const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    oceanMesh.receiveShadow = true;
    scene.add(oceanMesh);

    // Wave calculation function (used for ocean mesh & boat floating physics)
    const getWaveHeight = (x: number, z: number, time: number): number => {
      const w1 = Math.sin(x * 0.12 + time * 1.8) * Math.cos(z * 0.08 + time * 1.4) * 0.65;
      const w2 = Math.sin((x + z) * 0.18 + time * 2.2) * 0.35;
      const w3 = Math.cos(x * 0.28 - time * 1.6) * Math.sin(z * 0.25 + time * 1.9) * 0.2;
      return w1 + w2 + w3;
    };

    // --- 3D Fishing Boat ("OMC-102") ---
    const boatGroup = new THREE.Group();
    boatGroup.position.set(-3.5, 0, 8); // Positioned prominently on the left-center water
    boatGroup.rotation.y = THREE.MathUtils.degToRad(-25); // Angled showing bow and cabin

    // 1. Boat Hull (Blue with flared bow)
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, 0);
    hullShape.lineTo(2.2, 0.4);
    hullShape.lineTo(2.0, 5.5);
    hullShape.quadraticCurveTo(1.6, 7.8, 0, 9.0); // Pointed bow
    hullShape.quadraticCurveTo(-1.6, 7.8, -2.0, 5.5);
    hullShape.lineTo(-2.2, 0.4);
    hullShape.closePath();

    const hullExtrudeSettings = {
      steps: 2,
      depth: 2.2,
      bevelEnabled: true,
      bevelThickness: 0.4,
      bevelSize: 0.3,
      bevelSegments: 3
    };

    const hullGeo = new THREE.ExtrudeGeometry(hullShape, hullExtrudeSettings);
    hullGeo.rotateX(Math.PI / 2);
    hullGeo.translate(0, 1.1, -4.5);

    const hullMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8, // Deep cobalt ocean blue
      roughness: 0.35,
      metalness: 0.2
    });
    const hullMesh = new THREE.Mesh(hullGeo, hullMaterial);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    boatGroup.add(hullMesh);

    // 2. White Waterline & Gunwale Trim Stripe
    const trimGeo = new THREE.BoxGeometry(4.3, 0.25, 8.8);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.position.set(0, 1.25, 0);
    boatGroup.add(trimMesh);

    // 3. Deck Surface (Weathered Teak)
    const deckGeo = new THREE.BoxGeometry(3.8, 0.2, 8.2);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xc89666, roughness: 0.8 });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.set(0, 1.35, 0);
    boatGroup.add(deckMesh);

    // 4. White Wheelhouse / Cabin
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(0, 2.5, -0.6);

    const cabinMainGeo = new THREE.BoxGeometry(3.0, 2.2, 4.4);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25 });
    const cabinMesh = new THREE.Mesh(cabinMainGeo, cabinMat);
    cabinMesh.castShadow = true;
    cabinGroup.add(cabinMesh);

    // Cabin Visor / Overhang Roof
    const roofGeo = new THREE.BoxGeometry(3.3, 0.2, 4.8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3 }); // Cyan blue roof cap
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, 1.15, 0.1);
    cabinGroup.add(roofMesh);

    // Windshield & Windows (Tinted Glass)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      roughness: 0.05,
      metalness: 0.8,
      transmission: 0.7,
      ior: 1.5,
      transparent: true,
      opacity: 0.85
    });

    // Front windshields (3 panels)
    for (let i = -1; i <= 1; i++) {
      const frontWinGeo = new THREE.PlaneGeometry(0.75, 0.85);
      const frontWin = new THREE.Mesh(frontWinGeo, glassMat);
      frontWin.position.set(i * 0.9, 0.35, 2.22);
      cabinGroup.add(frontWin);
    }

    // Side windows (4 on each side)
    for (let i = -1; i <= 1; i++) {
      const sideWinGeo = new THREE.PlaneGeometry(0.85, 0.65);
      // Port side
      const portWin = new THREE.Mesh(sideWinGeo, glassMat);
      portWin.rotation.y = -Math.PI / 2;
      portWin.position.set(-1.52, 0.35, i * 1.1);
      cabinGroup.add(portWin);

      // Starboard side
      const starWin = new THREE.Mesh(sideWinGeo, glassMat);
      starWin.rotation.y = Math.PI / 2;
      starWin.position.set(1.52, 0.35, i * 1.1);
      cabinGroup.add(starWin);
    }

    // Radar Arch & Mast on roof
    const mastGeo = new THREE.CylinderGeometry(0.06, 0.09, 3.2, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6, roughness: 0.2 });
    const mastMesh = new THREE.Mesh(mastGeo, mastMat);
    mastMesh.position.set(0, 2.7, 0.4);
    cabinGroup.add(mastMesh);

    // Crossbar & Radio Antennas
    const crossbarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);
    crossbarGeo.rotateZ(Math.PI / 2);
    const crossbarMesh = new THREE.Mesh(crossbarGeo, mastMat);
    crossbarMesh.position.set(0, 3.4, 0.4);
    cabinGroup.add(crossbarMesh);

    // Radar Dome
    const radarGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 16);
    const radarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const radarMesh = new THREE.Mesh(radarGeo, radarMat);
    radarMesh.position.set(0, 1.45, -0.6);
    cabinGroup.add(radarMesh);

    boatGroup.add(cabinGroup);

    // 5. Orange Life Rings along deck railing
    const lifeRingGeo = new THREE.TorusGeometry(0.35, 0.12, 12, 24);
    const lifeRingMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.4 }); // Safety Orange

    const lifeRing1 = new THREE.Mesh(lifeRingGeo, lifeRingMat);
    lifeRing1.rotation.y = -Math.PI / 2;
    lifeRing1.position.set(-1.55, 2.4, 0.6);
    boatGroup.add(lifeRing1);

    const lifeRing2 = new THREE.Mesh(lifeRingGeo, lifeRingMat);
    lifeRing2.rotation.y = Math.PI / 2;
    lifeRing2.position.set(1.55, 2.4, 0.6);
    boatGroup.add(lifeRing2);

    const lifeRing3 = new THREE.Mesh(lifeRingGeo, lifeRingMat);
    lifeRing3.position.set(0, 2.2, -3.9);
    boatGroup.add(lifeRing3);

    // 6. Canvas Texture Badge for "OMC-102"
    const textCanvas = document.createElement('canvas');
    textCanvas.width = 512;
    textCanvas.height = 128;
    const ctx = textCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 74px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OMC-102', 256, 64);
    }
    const badgeTexture = new THREE.CanvasTexture(textCanvas);
    const badgeGeo = new THREE.PlaneGeometry(1.6, 0.45);
    const badgeMat = new THREE.MeshBasicMaterial({ map: badgeTexture, transparent: true });

    // Port bow badge
    const badgePort = new THREE.Mesh(badgeGeo, badgeMat);
    badgePort.rotation.y = -Math.PI / 2 + 0.35;
    badgePort.position.set(-1.7, 1.7, 2.5);
    boatGroup.add(badgePort);

    // Starboard bow badge
    const badgeStar = new THREE.Mesh(badgeGeo, badgeMat);
    badgeStar.rotation.y = Math.PI / 2 - 0.35;
    badgeStar.position.set(1.7, 1.7, 2.5);
    boatGroup.add(badgeStar);

    // 7. White Bow Wake / Wave Splash Foam
    const wakeGeo = new THREE.RingGeometry(2.4, 3.8, 32);
    wakeGeo.rotateX(-Math.PI / 2);
    const wakeMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const wakeMesh = new THREE.Mesh(wakeGeo, wakeMat);
    wakeMesh.position.set(0, 0.25, 2.0);
    wakeMesh.scale.set(0.9, 1, 1.4);
    boatGroup.add(wakeMesh);

    scene.add(boatGroup);

    // --- Coastal Island with Lighthouse (Distant Left Horizon) ---
    const islandGroup = new THREE.Group();
    islandGroup.position.set(-42, 0, -25);

    // Sandy Shore & Grassy Hill
    const islandGeo = new THREE.ConeGeometry(18, 5.5, 16);
    const islandMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const islandMesh = new THREE.Mesh(islandGeo, islandMat);
    islandMesh.position.y = 1.2;
    islandGroup.add(islandMesh);

    // Palm Tree Silhouettes
    for (let i = 0; i < 6; i++) {
      const trunkGeo = new THREE.CylinderGeometry(0.12, 0.25, 4.5, 6);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.set(-6 + i * 2.2, 4.5, -2 + (i % 2) * 2);
      trunk.rotation.z = (Math.random() - 0.5) * 0.3;
      islandGroup.add(trunk);

      const frondGeo = new THREE.ConeGeometry(2.2, 1.4, 7);
      const frondMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });
      const fronds = new THREE.Mesh(frondGeo, frondMat);
      fronds.position.set(trunk.position.x, 6.8, trunk.position.z);
      islandGroup.add(fronds);
    }

    // Lighthouse Tower with Red and White spiral bands
    const lighthouseGroup = new THREE.Group();
    lighthouseGroup.position.set(4, 3.8, 0);

    const baseGeo = new THREE.CylinderGeometry(1.6, 2.2, 1.2, 16);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    lighthouseGroup.add(baseMesh);

    // 5 alternating red and white segments
    for (let seg = 0; seg < 5; seg++) {
      const segGeo = new THREE.CylinderGeometry(1.5 - seg * 0.12, 1.6 - seg * 0.12, 2.2, 16);
      const segMat = new THREE.MeshStandardMaterial({
        color: seg % 2 === 0 ? 0xdc2626 : 0xffffff, // Red and White bands
        roughness: 0.4
      });
      const segMesh = new THREE.Mesh(segGeo, segMat);
      segMesh.position.y = 1.1 + seg * 2.2;
      lighthouseGroup.add(segMesh);
    }

    // Lantern Room & Dome
    const lanternGeo = new THREE.CylinderGeometry(1.1, 1.1, 1.4, 12);
    const lanternMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfef08a,
      emissiveIntensity: 0.9,
      roughness: 0.1
    });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.y = 12.8;
    lighthouseGroup.add(lantern);

    const domeGeo = new THREE.SphereGeometry(1.15, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 13.5;
    lighthouseGroup.add(dome);

    islandGroup.add(lighthouseGroup);
    scene.add(islandGroup);

    // --- Seagulls Gliding in the Sky ---
    const seagulls: { mesh: THREE.Group; speed: number; radius: number; angle: number; baseY: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const gull = new THREE.Group();
      // Simple stylized V-wing shape
      const wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.lineTo(1.4, 0.25);
      wingShape.lineTo(1.2, -0.2);
      wingShape.lineTo(0, -0.05);
      wingShape.lineTo(-1.2, -0.2);
      wingShape.lineTo(-1.4, 0.25);
      wingShape.closePath();

      const wingGeo = new THREE.ShapeGeometry(wingShape);
      const wingMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const wings = new THREE.Mesh(wingGeo, wingMat);
      wings.rotateX(Math.PI / 2);
      gull.add(wings);

      const radius = 18 + i * 8;
      const angle = (i * Math.PI) / 2;
      const baseY = 14 + i * 2.5;

      scene.add(gull);
      seagulls.push({
        mesh: gull,
        speed: 0.4 + i * 0.1,
        radius,
        angle,
        baseY
      });
    }

    // --- Interactive Mouse Parallax ---
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = -8;
    let targetCameraY = 9;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseX = x;
      mouseY = y;
      targetCameraX = -8 + mouseX * 2.5;
      targetCameraY = 9 + mouseY * 1.5;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- Window Resize Handling ---
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    };

    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // 1. Animate Ocean Mesh Vertices
      const pos = oceanGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = originalPositions[i * 3];
        const w = originalPositions[i * 3 + 2];
        const h = getWaveHeight(u, w, time);
        pos.setY(i, h);
      }
      pos.needsUpdate = true;
      oceanGeo.computeVertexNormals();

      // 2. Realistic Boat Floating, Pitch & Roll Physics
      const waveUnderBoat = getWaveHeight(boatGroup.position.x, boatGroup.position.z, time);
      // Floating heave
      boatGroup.position.y = THREE.MathUtils.lerp(boatGroup.position.y, waveUnderBoat - 0.4, 0.1);
      // Rocking roll (side to side)
      boatGroup.rotation.z = Math.sin(time * 1.5) * 0.08 + Math.cos(time * 0.9) * 0.04;
      // Pitch (bow up and down)
      boatGroup.rotation.x = Math.cos(time * 1.8) * 0.06;
      // Gentle yaw drift
      boatGroup.rotation.y = THREE.MathUtils.degToRad(-25) + Math.sin(time * 0.6) * 0.02;

      // Animate bow wake opacity
      wakeMesh.scale.x = 0.9 + Math.sin(time * 2.5) * 0.1;
      wakeMat.opacity = 0.5 + Math.sin(time * 3.0) * 0.2;

      // 3. Animate Seagulls circling above water
      seagulls.forEach(gull => {
        gull.angle += gull.speed * 0.02;
        gull.mesh.position.x = -8 + Math.cos(gull.angle) * gull.radius;
        gull.mesh.position.z = Math.sin(gull.angle) * (gull.radius * 0.7);
        gull.mesh.position.y = gull.baseY + Math.sin(time * 2.0 + gull.angle) * 0.6;
        gull.mesh.rotation.y = -gull.angle + Math.PI / 2;
        // Wing flapping
        gull.mesh.rotation.z = Math.sin(time * 6.0 + gull.angle) * 0.15;
      });

      // 4. Smooth Camera Parallax Lerp
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCameraX, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCameraY, 0.05);
      camera.lookAt(-2, 3, 0);

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup on Component Unmount ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      // Dispose Three.js objects
      oceanGeo.dispose();
      oceanMat.dispose();
      hullGeo.dispose();
      hullMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0"
      style={{ touchAction: 'none' }}
    />
  );
};
