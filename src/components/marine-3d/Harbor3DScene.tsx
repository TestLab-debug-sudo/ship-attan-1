import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Boat } from '../../types/marine.js';
import { 
  createWoodPierTexture, 
  createMarineVesselModel, 
  createMarinaDockAssembly, 
  createMarineBuoy 
} from './proceduralModels.js';
import { 
  Anchor, Compass, Eye, Sun, Sunset, Moon, Waves, 
  ChevronDown, ChevronUp, Navigation, Fuel, Gauge, Ship 
} from 'lucide-react';

interface Harbor3DSceneProps {
  boats: Boat[];
  onSelectBoat?: (boat: Boat) => void;
  selectedBoatId?: string;
}

export const Harbor3DScene: React.FC<Harbor3DSceneProps> = ({
  boats,
  onSelectBoat,
  selectedBoatId
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<'overview' | 'dock' | 'at_sea' | 'top_down'>('overview');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'sunset' | 'night'>('day');
  const [seaState, setSeaState] = useState<'calm' | 'moderate' | 'rough'>('moderate');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [inspectedBoat, setInspectedBoat] = useState<Boat | null>(null);

  // Mutable refs for Three.js instance
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const waterMeshRef = useRef<THREE.Mesh | null>(null);
  const boatMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 480;

    // 1. Software WebGL Guard
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer & Color Pipeline
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 3. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x063B5C);
    scene.fog = new THREE.FogExp2(0x082F49, 0.012);
    sceneRef.current = scene;

    // 4. Camera & Damped Controls
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.2, 1000);
    camera.position.set(0, 24, 38);
    cameraRef.current = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.04; // Don't submerge below water
    controls.minDistance = 4;
    controls.maxDistance = 140;
    controls.target.set(0, 0, -2);
    controlsRef.current = controls;

    // 5. Studio Environment Map (PMREMGenerator + RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Lighting Rig (Key, Fill, Rim)
    const dirLight = new THREE.DirectionalLight(0xFFF4E0, 2.2);
    dirLight.position.set(40, 50, 30);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 160;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    dirLight.shadow.bias = -0.0004;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const hemiLight = new THREE.HemisphereLight(0x70C7DE, 0x06283D, 1.2);
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    // 7. Ocean Water Surface (Physical Material with procedural animated ripples)
    const waterGeo = new THREE.PlaneGeometry(320, 320, 64, 64);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x0A5C80,
      roughness: 0.12,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: isSoftwareGl ? 0 : 0.45,
      transparent: true,
      opacity: 0.92,
      ior: 1.333, // Real water refractive index
    });

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = 0;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    waterMeshRef.current = waterMesh;

    // 8. Marina Wooden Pier Assembly
    const woodTex = createWoodPierTexture();
    const dockAssembly = createMarinaDockAssembly(woodTex);
    scene.add(dockAssembly);

    // Channel buoys
    const redBuoy = createMarineBuoy(0xEF4444, 28, 12);
    const greenBuoy = createMarineBuoy(0x10B981, -28, 12);
    const outerBuoy = createMarineBuoy(0xF59E0B, 0, 45);
    scene.add(redBuoy);
    scene.add(greenBuoy);
    scene.add(outerBuoy);

    // 9. Procedural Fleet Vessels
    const boatMap = new Map<string, THREE.Group>();
    const slipOffsets: Record<string, { x: number; z: number; rotY: number }> = {
      'boat-01': { x: -14, z: -5, rotY: 0 }, // Sea Sovereign (Slip A-04)
      'boat-02': { x: 12, z: 26, rotY: Math.PI * 0.25 }, // Ocean Hunter IV (At Sea)
      'boat-03': { x: -26, z: -5, rotY: 0 }, // Aquamarine Breeze (Slip A-01)
      'boat-04': { x: -2, z: 18, rotY: -Math.PI * 0.15 }, // Pelican Swift (Mooring)
      'boat-05': { x: 10, z: -5, rotY: 0 }, // Marina Titan (Slip C-02)
      'boat-06': { x: 22, z: -5, rotY: 0 }, // Coral Princess (Maintenance)
    };

    boats.forEach((b) => {
      const offset = slipOffsets[b.id] || { x: 0, z: 0, rotY: 0 };
      const vesselMesh = createMarineVesselModel(
        b.vesselType,
        b.name,
        b.vesselType === 'sport_fisherman' ? 0x0284C7 : b.vesselType === 'catamaran' ? 0x0D9488 : 0xF8FAFC
      );
      vesselMesh.position.set(offset.x, 0, offset.z);
      vesselMesh.rotation.y = offset.rotY;
      vesselMesh.userData = { boatId: b.id, boatData: b };

      scene.add(vesselMesh);
      boatMap.set(b.id, vesselMesh);
    });
    boatMeshesRef.current = boatMap;

    // 10. Raycasting for Vessel Click Inspection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const interactiveObjects: THREE.Object3D[] = [];
      boatMap.forEach((mesh) => {
        mesh.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            interactiveObjects.push(child);
          }
        });
      });

      const intersects = raycaster.intersectObjects(interactiveObjects, false);
      if (intersects.length > 0) {
        let parent: THREE.Object3D | null = intersects[0].object;
        while (parent && !parent.userData?.boatId) {
          parent = parent.parent;
        }
        if (parent && parent.userData?.boatData) {
          const clickedBoat = parent.userData.boatData as Boat;
          setInspectedBoat(clickedBoat);
          if (onSelectBoat) {
            onSelectBoat(clickedBoat);
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 11. Animation Loop with Software-WebGL Guard Pacing
    let frameId = 0;
    const startTime = performance.now();
    const posAttribute = waterGeo.attributes.position;
    const originalPositions = posAttribute.array.slice();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const elapsedTime = (performance.now() - startTime) / 1000;
      const waveAmplitude = seaState === 'calm' ? 0.08 : seaState === 'rough' ? 0.35 : 0.18;

      // Animate ocean waves displacement
      for (let i = 0; i < posAttribute.count; i++) {
        const x = originalPositions[i * 3];
        const z = originalPositions[i * 3 + 2];
        const wave = Math.sin(x * 0.15 + elapsedTime * 1.5) * Math.cos(z * 0.12 + elapsedTime * 1.2) * waveAmplitude;
        posAttribute.setY(i, wave);
      }
      posAttribute.needsUpdate = true;

      // Gentle boat bobbing and roll
      boatMap.forEach((mesh, id) => {
        const isUnderway = id === 'boat-02';
        const bob = Math.sin(elapsedTime * 1.4 + mesh.position.x * 0.5) * (waveAmplitude * 0.6);
        const roll = Math.cos(elapsedTime * 1.2 + mesh.position.z * 0.3) * (waveAmplitude * 0.2);
        mesh.position.y = bob;
        mesh.rotation.z = roll;

        // Spin radar scanners
        const radar = mesh.getObjectByName('radar_scanner');
        if (radar) {
          radar.rotation.y += 0.045;
        }

        // Move underway vessel slightly forward along course
        if (isUnderway) {
          mesh.position.z += Math.sin(elapsedTime * 0.8) * 0.015;
          mesh.position.x += Math.cos(elapsedTime * 0.8) * 0.012;
        }
      });

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    frameId = requestAnimationFrame(tick);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 480;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      waterGeo.dispose();
      waterMat.dispose();
    };
  }, [boats, seaState]);

  // Lighting & Mood Switcher
  useEffect(() => {
    if (!dirLightRef.current || !hemiLightRef.current || !sceneRef.current) return;
    const scene = sceneRef.current;
    const dirLight = dirLightRef.current;
    const hemiLight = hemiLightRef.current;

    if (timeOfDay === 'day') {
      scene.background = new THREE.Color(0x063B5C);
      scene.fog = new THREE.FogExp2(0x082F49, 0.012);
      dirLight.color.setHex(0xFFF4E0);
      dirLight.intensity = 2.2;
      dirLight.position.set(40, 50, 30);
      hemiLight.color.setHex(0x70C7DE);
      hemiLight.groundColor.setHex(0x06283D);
      hemiLight.intensity = 1.2;
    } else if (timeOfDay === 'sunset') {
      scene.background = new THREE.Color(0x2B1A3D);
      scene.fog = new THREE.FogExp2(0x3B1F3D, 0.014);
      dirLight.color.setHex(0xFF875E); // Coral orange glow
      dirLight.intensity = 2.6;
      dirLight.position.set(60, 18, 40);
      hemiLight.color.setHex(0xFFB17A);
      hemiLight.groundColor.setHex(0x1B1028);
      hemiLight.intensity = 0.9;
    } else {
      // Night Patrol
      scene.background = new THREE.Color(0x031322);
      scene.fog = new THREE.FogExp2(0x031322, 0.018);
      dirLight.color.setHex(0x60A5FA);
      dirLight.intensity = 0.6;
      dirLight.position.set(-20, 40, -10);
      hemiLight.color.setHex(0x1E3A8A);
      hemiLight.groundColor.setHex(0x020817);
      hemiLight.intensity = 0.4;
    }
  }, [timeOfDay]);

  // Camera Presets
  const setCameraPreset = (preset: 'overview' | 'dock' | 'at_sea' | 'top_down') => {
    setActivePreset(preset);
    if (!cameraRef.current || !controlsRef.current) return;
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;

    if (preset === 'overview') {
      cam.position.set(0, 24, 38);
      ctrl.target.set(0, 0, -2);
    } else if (preset === 'dock') {
      cam.position.set(-14, 6, 8);
      ctrl.target.set(-14, 1.5, -5);
    } else if (preset === 'at_sea') {
      cam.position.set(12, 8, 38);
      ctrl.target.set(12, 1, 24);
    } else if (preset === 'top_down') {
      cam.position.set(0, 58, 2);
      ctrl.target.set(0, 0, 0);
    }
  };

  return (
    <div className="relative w-full h-[360px] sm:h-[460px] md:h-[540px] lg:h-[640px] rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#063B5C] shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Maritime Telemetry Header Badge */}
      <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 pointer-events-auto z-10 max-w-[calc(100%-20px)]">
        <div className="marine-glass px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-white/10 flex items-center gap-2 sm:gap-3 shadow-lg">
          <div className="p-1.5 sm:p-2 bg-[#27C5C1]/20 rounded-lg text-[#27C5C1] shrink-0">
            <Ship className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-cyan-300 truncate">
              Navlakhi Harbor Digital Twin
            </div>
            <div className="text-xs sm:text-sm font-medium text-white flex items-center gap-1 sm:gap-2 flex-wrap">
              <span>Navlakhi Tidal Harbor Basin</span>
              <span className="text-slate-400 font-mono text-[10px] sm:text-xs">22.9583° N, 70.4430° E</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inspected Boat Quick HUD (if clicked) */}
      {inspectedBoat && (
        <div className="absolute top-4 right-4 pointer-events-auto z-10 w-80 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="marine-card p-4 rounded-xl border border-cyan-500/30 text-white shadow-2xl">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                  {inspectedBoat.registrationNumber}
                </span>
                <h4 className="text-base font-bold text-white leading-tight">
                  {inspectedBoat.name}
                </h4>
              </div>
              <button 
                onClick={() => setInspectedBoat(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-white/10 mb-3 font-mono">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                <span className="font-semibold text-cyan-300 capitalize">{inspectedBoat.status.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Slip / Berth</span>
                <span className="truncate block">{inspectedBoat.currentMarinaSlip}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Fuel Level</span>
                <span className="text-emerald-400 font-semibold">{inspectedBoat.fuelLevelPct}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Engine Hours</span>
                <span>{inspectedBoat.engineHours} hrs</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Capacity: {inspectedBoat.capacityPax} Pax</span>
              <span className="text-cyan-400 font-mono text-[11px]">
                {inspectedBoat.lengthFt} ft {inspectedBoat.vesselType.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ergonomic Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-3xl pointer-events-auto">
        {/* Collapse / Expand Tab */}
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="bg-[#082F49] text-cyan-300 text-xs font-medium px-4 py-1.5 rounded-t-lg border-t border-x border-cyan-500/30 flex items-center gap-1.5 hover:bg-[#063B5C] transition-colors"
          >
            {isDockCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                <span>Show 3D Harbor Controls</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                <span>Hide Controls</span>
              </>
            )}
          </button>
        </div>

        {/* Floating Dock Surface */}
        {!isDockCollapsed && (
          <div className="bg-[#082F49]/95 border border-cyan-500/30 rounded-2xl p-2.5 sm:p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-white max-w-full overflow-x-auto scrollbar-none">
            {/* Camera View Switcher */}
            <div className="flex items-center gap-1 bg-[#063B5C] p-1 rounded-xl border border-white/5">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Camera:</span>
              <button
                onClick={() => setCameraPreset('overview')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activePreset === 'overview'
                    ? 'bg-[#27C5C1] text-[#063B5C] font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setCameraPreset('dock')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activePreset === 'dock'
                    ? 'bg-[#27C5C1] text-[#063B5C] font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Dock Slip
              </button>
              <button
                onClick={() => setCameraPreset('at_sea')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activePreset === 'at_sea'
                    ? 'bg-[#27C5C1] text-[#063B5C] font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Offshore
              </button>
              <button
                onClick={() => setCameraPreset('top_down')}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activePreset === 'top_down'
                    ? 'bg-[#27C5C1] text-[#063B5C] font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Radar Top
              </button>
            </div>

            {/* Environment Lighting Modes */}
            <div className="flex items-center gap-1 bg-[#063B5C] p-1 rounded-xl border border-white/5">
              <span className="text-[11px] text-slate-400 px-2 font-medium">Lighting:</span>
              <button
                onClick={() => setTimeOfDay('day')}
                title="Midday Sun"
                className={`p-1.5 rounded-lg transition-colors ${
                  timeOfDay === 'day' ? 'bg-[#27C5C1] text-[#063B5C]' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTimeOfDay('sunset')}
                title="Golden Sunset"
                className={`p-1.5 rounded-lg transition-colors ${
                  timeOfDay === 'sunset' ? 'bg-[#FF875E] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sunset className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTimeOfDay('night')}
                title="Night Patrol"
                className={`p-1.5 rounded-lg transition-colors ${
                  timeOfDay === 'night' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {/* Sea State Toggle */}
            <div className="flex items-center gap-1 bg-[#063B5C] p-1 rounded-xl border border-white/5">
              <span className="text-[11px] text-slate-400 px-2 font-medium flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                Sea:
              </span>
              {(['calm', 'moderate', 'rough'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSeaState(st)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                    seaState === st
                      ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
