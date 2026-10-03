import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  REGION, VARIABLES, PLATFORMS, PLATFORM_META, sample, bathymetry, isLand, currentVector,
} from '../lib/ocean.js';
import { COLORMAPS } from '../lib/colormap.js';

/* -------------------------- coordinate mapping -------------------------- */
const SX = 22;
const SZ = 19;
const SY = 7.5;

const lonToX = (lon) => ((lon - REGION.lon0) / (REGION.lon1 - REGION.lon0) - 0.5) * SX;
const latToZ = (lat) => -((lat - REGION.lat0) / (REGION.lat1 - REGION.lat0) - 0.5) * SZ;
const depthToY = (d) => -SY * Math.pow(Math.min(d, REGION.maxDepth) / REGION.maxDepth, 0.45);

const NX = 130;
const NY = 110;

function norm(v, key) {
  const [a, b] = (VARIABLES[key] || VARIABLES.temperature).range;
  return Math.max(0, Math.min(1, (v - a) / (b - a)));
}

/* --------------------------- Horizontal Slice Mesh --------------------------- */
function useSliceGeometry(variable, depth, time, opacityFade = 1, customColormap = null) {
  return useMemo(() => {
    const defaultCmapKey = (VARIABLES[variable] || VARIABLES.temperature).cmap;
    const cmapKey = customColormap || defaultCmapKey;
    const cmap = COLORMAPS[cmapKey] || COLORMAPS.thermal;
    const pos = [];
    const col = [];
    const y = depthToY(depth);
    const lonStep = (REGION.lon1 - REGION.lon0) / NX;
    const latStep = (REGION.lat1 - REGION.lat0) / NY;

    const cache = new Float32Array((NX + 1) * (NY + 1));
    const isLandCache = new Uint8Array((NX + 1) * (NY + 1));

    for (let j = 0; j <= NY; j++) {
      const lat = REGION.lat0 + j * latStep;
      for (let i = 0; i <= NX; i++) {
        const lon = REGION.lon0 + i * lonStep;
        const idx = j * (NX + 1) + i;
        const land = isLand(lon, lat);
        isLandCache[idx] = land ? 1 : 0;
        const v = sample(variable, lon, lat, depth, time);
        cache[idx] = v !== null ? v : -999;
      }
    }

    const P = (i, j) => [
      lonToX(REGION.lon0 + i * lonStep), y, latToZ(REGION.lat0 + j * latStep),
    ];

    for (let j = 0; j < NY; j++) {
      for (let i = 0; i < NX; i++) {
        const idx00 = j * (NX + 1) + i;
        const idx10 = j * (NX + 1) + i + 1;
        const idx01 = (j + 1) * (NX + 1) + i;
        const idx11 = (j + 1) * (NX + 1) + i + 1;

        // Skip quad if all 4 corners are inside land
        const landSum = isLandCache[idx00] + isLandCache[idx10] + isLandCache[idx01] + isLandCache[idx11];
        if (landSum === 4) continue;

        const v00 = cache[idx00];
        const v10 = cache[idx10];
        const v01 = cache[idx01];
        const v11 = cache[idx11];

        const valid = [v00, v10, v01, v11].filter((v) => v !== -999);
        if (valid.length === 0) continue;
        const avg = valid.reduce((a, b) => a + b, 0) / valid.length;

        const val00 = v00 !== -999 ? v00 : avg;
        const val10 = v10 !== -999 ? v10 : avg;
        const val01 = v01 !== -999 ? v01 : avg;
        const val11 = v11 !== -999 ? v11 : avg;

        const p00 = P(i, j), p10 = P(i + 1, j), p01 = P(i, j + 1), p11 = P(i + 1, j + 1);

        pos.push(...p00, ...p10, ...p11, ...p00, ...p11, ...p01);

        const c = (v) => {
          const rgb = cmap(norm(v, variable));
          return [rgb[0] * opacityFade, rgb[1] * opacityFade, rgb[2] * opacityFade];
        };

        col.push(...c(val00), ...c(val10), ...c(val11), ...c(val00), ...c(val11), ...c(val01));
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    if (pos.length > 0) g.computeVertexNormals();
    return g;
  }, [variable, depth, time, opacityFade, customColormap]);
}

function SliceMesh({ variable, depth, time, opacity = 0.95, fade = 1, customColormap = null }) {
  const geo = useSliceGeometry(variable, depth, time, fade, customColormap);
  const wireRef = useRef(null);
  const y = depthToY(depth);

  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((state) => {
    if (wireRef.current && wireRef.current.material) {
      wireRef.current.material.opacity = 0.6 + 0.3 * Math.sin(state.clock.elapsedTime * 3);
    }
  });

  const boxWireGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(SX, 0.05, SZ);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, []);

  useEffect(() => () => boxWireGeo.dispose(), [boxWireGeo]);

  return (
    <group>
      <mesh geometry={geo} renderOrder={2}>
        <meshBasicMaterial vertexColors transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      
      {/* Glowing Neon Perimeter Box for Active Slice */}
      {opacity > 0.8 && (
        <group position={[0, y, 0]}>
          <lineSegments ref={wireRef} geometry={boxWireGeo}>
            <lineBasicMaterial color="#38bdf8" transparent opacity={0.8} />
          </lineSegments>
        </group>
      )}
    </group>
  );
}

/* ---------------------------- Vertical Transect Curtain ---------------------------- */
const NZ = 72;
function TransectMesh({ variable, lat, time, customColormap = null }) {
  const geo = useMemo(() => {
    const defaultCmapKey = (VARIABLES[variable] || VARIABLES.temperature).cmap;
    const cmapKey = customColormap || defaultCmapKey;
    const cmap = COLORMAPS[cmapKey] || COLORMAPS.thermal;
    const pos = [];
    const col = [];
    const lonStep = (REGION.lon1 - REGION.lon0) / NX;
    const dAt = (k) => REGION.maxDepth * Math.pow(k / NZ, 2.0);
    const value = (i, k) => sample(variable, REGION.lon0 + i * lonStep, lat, dAt(k), time);
    const P = (i, k) => [lonToX(REGION.lon0 + i * lonStep), depthToY(dAt(k)), latToZ(lat)];
    
    for (let k = 0; k < NZ; k++) {
      for (let i = 0; i < NX; i++) {
        const a = value(i, k), b = value(i + 1, k), c = value(i + 1, k + 1), d = value(i, k + 1);
        const validVals = [a, b, c, d].filter((v) => v !== null);
        if (validVals.length === 0) continue;
        const avg = validVals.reduce((x, y) => x + y, 0) / validVals.length;
        const fa = a !== null ? a : avg;
        const fb = b !== null ? b : avg;
        const fc = c !== null ? c : avg;
        const fd = d !== null ? d : avg;

        pos.push(...P(i, k), ...P(i + 1, k), ...P(i + 1, k + 1), ...P(i, k), ...P(i + 1, k + 1), ...P(i, k + 1));
        const cc = (v) => cmap(norm(v, variable));
        col.push(...cc(fa), ...cc(fb), ...cc(fc), ...cc(fa), ...cc(fc), ...cc(fd));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    return g;
  }, [variable, lat, time, customColormap]);

  useEffect(() => () => geo.dispose(), [geo]);

  const laserGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([lonToX(REGION.lon0), 0.05, latToZ(lat), lonToX(REGION.lon1), 0.05, latToZ(lat)], 3));
    return g;
  }, [lat]);

  useEffect(() => () => laserGeo.dispose(), [laserGeo]);

  return (
    <group>
      <mesh geometry={geo} renderOrder={1}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      {/* Transect top neon laser line */}
      <line geometry={laserGeo}>
        <lineBasicMaterial color="#f472b6" linewidth={2} transparent opacity={0.9} />
      </line>
    </group>
  );
}

/* ------------------------------ Sea Floor & Continents ------------------------------ */
function SeaFloor() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(SX, SZ, NX, NY);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const colors = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const lon = REGION.lon0 + ((x / SX) + 0.5) * (REGION.lon1 - REGION.lon0);
      const lat = REGION.lat0 + ((-z / SZ) + 0.5) * (REGION.lat1 - REGION.lat0);
      
      if (isLand(lon, lat)) {
        p.setY(i, 0.35);
        colors.push(0.12, 0.22, 0.18);
      } else {
        const b = bathymetry(lon, lat);
        p.setY(i, depthToY(b) - 0.05);
        const s = Math.min(1, b / 5200);
        colors.push(0.04 + 0.12 * (1 - s), 0.08 + 0.18 * (1 - s), 0.18 + 0.25 * (1 - s));
      }
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <mesh geometry={geo} receiveShadow renderOrder={3}>
      <meshStandardMaterial vertexColors flatShading roughness={0.7} metalness={0.2} />
    </mesh>
  );
}

/* ------------------------------ Geological Ridge Labels ------------------------------ */
function OceanLandmarks() {
  const landmarks = [
    { name: 'Carlsberg Ridge', lon: 64, lat: 5, depth: 3200 },
    { name: 'Ninetyeast Ridge', lon: 90, lat: 0, depth: 2800 },
    { name: 'Chagos-Laccadive Plateau', lon: 73, lat: 6, depth: 2100 },
    { name: 'Java / Sunda Trench', lon: 102, lat: -6, depth: 4800 },
    { name: 'Somali Basin', lon: 52, lat: 2, depth: 4200 },
    { name: 'Arabian Sea Basin', lon: 66, lat: 15, depth: 3600 },
    { name: 'Bay of Bengal Plume', lon: 86, lat: 14, depth: 2900 },
  ];

  return (
    <group>
      {landmarks.map((lm) => (
        <group key={lm.name} position={[lonToX(lm.lon), depthToY(lm.depth) + 0.2, latToZ(lm.lat)]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 6]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
          </mesh>
          <Html position={[0, 0.5, 0]} center distanceFactor={28}>
            <div className="select-none whitespace-nowrap rounded-md border border-cyan-500/30 bg-slate-950/80 px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider text-cyan-300 backdrop-blur-md shadow-lg pointer-events-none">
              ⛰️ {lm.name}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------ Animated Dynamic Flow Vectors ------------------------------ */
const AX = 32;
const AY = 26;
function CurrentArrows({ depth, time }) {
  const ref = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geom = useMemo(() => {
    const cone = new THREE.ConeGeometry(0.065, 0.32, 7);
    cone.translate(0, 0.16, 0);
    cone.rotateX(Math.PI / 2);
    return cone;
  }, []);

  useEffect(() => () => geom.dispose(), [geom]);

  const vectorGrid = useMemo(() => {
    const items = [];
    const y = depthToY(depth) + 0.06;
    for (let j = 0; j < AY; j++) {
      for (let i = 0; i < AX; i++) {
        const lon = REGION.lon0 + ((i + 0.5) / AX) * (REGION.lon1 - REGION.lon0);
        const lat = REGION.lat0 + ((j + 0.5) / AY) * (REGION.lat1 - REGION.lat0);
        const idx = j * AX + i;
        const v = sample('currents', lon, lat, depth, time);
        if (v == null) {
          items.push({ active: false, idx });
          continue;
        }
        const { u, v: vv } = currentVector(lon, lat, depth, time);
        const sp = Math.hypot(u, vv);
        items.push({
          active: true,
          idx,
          lon,
          lat,
          u,
          vv,
          sp,
          angle: Math.atan2(u, -vv),
          phaseSeed: (i * 3.7 + j * 5.3) * 0.15,
        });
      }
    }
    return { items, y };
  }, [depth, time]);

  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const cmap = COLORMAPS.ice;
    vectorGrid.items.forEach((item) => {
      if (!item.active) {
        dummy.position.set(0, 999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(item.idx, dummy.matrix);
      } else {
        const c = cmap(Math.min(1, 0.3 + item.sp * 1.2));
        mesh.setColorAt(item.idx, new THREE.Color(c[0], c[1], c[2]));
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [vectorGrid, dummy]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const y = vectorGrid.y;

    vectorGrid.items.forEach((item) => {
      if (!item.active) return;
      const speedFactor = 0.4 + item.sp * 1.3;
      const phase = (((t * speedFactor + item.phaseSeed) % 1.0) - 0.5) * 0.85;
      const normU = item.sp > 1e-4 ? item.u / item.sp : 0;
      const normV = item.sp > 1e-4 ? item.vv / item.sp : 0;

      const px = lonToX(item.lon) + normU * phase;
      const pz = latToZ(item.lat) - normV * phase;

      dummy.position.set(px, y, pz);
      dummy.rotation.set(0, item.angle, 0);

      const pulse = (0.6 + Math.min(1.9, item.sp * 2.4)) * (0.9 + 0.1 * Math.sin(t * 4.0 + item.idx));
      dummy.scale.set(1.1, 1.1, pulse);
      dummy.updateMatrix();

      mesh.setMatrixAt(item.idx, dummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} geometry={geom} count={AX * AY} renderOrder={4}>
      <meshBasicMaterial transparent opacity={0.95} />
    </instancedMesh>
  );
}

/* ------------------------------ Argo Robotic Platforms ------------------------------ */
function PlatformMarker({ p, selected, onSelect }) {
  const metaType = PLATFORM_META[p.type] || PLATFORM_META.incois || { label: 'In-Situ Cast', color: '#38bdf8', icon: '⚓' };
  const color = metaType.color;
  const maxD = p.depths[p.depths.length - 1];
  const x = lonToX(p.lon);
  const z = latToZ(p.lat);
  const yBottom = depthToY(maxD);
  const ringRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 1.6;
      ringRef.current.scale.setScalar(1 + 0.12 * Math.sin(state.clock.elapsedTime * 4));
    }
  });

  const handleClick = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (onSelect) onSelect(p.id);
  };

  return (
    <group 
      position={[x, 0, z]}
      onClick={handleClick}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto'; }}
    >
      {/* Invisible bounding cylinder for generous raycast hit target */}
      <mesh position={[0, yBottom / 2, 0]}>
        <cylinderGeometry args={[0.45, 0.45, Math.abs(yBottom) + 0.8, 8]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Vertical cast cable */}
      <mesh position={[0, yBottom / 2, 0]}>
        <cylinderGeometry args={[selected ? 0.05 : 0.02, selected ? 0.05 : 0.02, Math.abs(yBottom), 8]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.95 : 0.55} />
      </mesh>

      {/* Sensor beads along the CTD profile cast */}
      {(selected || hovered) &&
        p.depths.map((d) => (
          <mesh key={d} position={[0, depthToY(d), 0]}>
            <sphereGeometry args={[selected ? 0.1 : 0.07, 12, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} />
          </mesh>
        ))}

      {/* Surface Robotic Buoy Head */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[selected ? 0.32 : hovered ? 0.26 : 0.2, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={selected ? 1.8 : hovered ? 1.3 : 0.8} />
      </mesh>

      {/* Surface Antenna Beacon */}
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.5, 6]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Sonar Pulse Ripple on Surface */}
      <mesh ref={ringRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[selected ? 0.6 : 0.38, selected ? 0.85 : 0.5, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={selected ? 0.9 : 0.45} />
      </mesh>

      {/* 3D Holographic Label */}
      {(selected || hovered) && (
        <Html position={[0, 1.3, 0]} center distanceFactor={24}>
          <div 
            onClick={handleClick}
            className={`whitespace-nowrap rounded-xl border p-2.5 text-xs font-mono shadow-2xl backdrop-blur-xl transition-transform cursor-pointer select-none ${
              selected 
                ? 'bg-slate-950/95 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400/50 scale-110' 
                : 'bg-slate-900/90 border-white/20 text-white hover:border-cyan-400/60'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-[13px]">
              <span>{metaType.icon || '⚓'}</span>
              <span>{p.name || p.id}</span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">
              {p.lat.toFixed(2)}°N, {p.lon.toFixed(2)}°E · {p.depths.length} CTD Casts · {p.lastSeen || 'active'}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ------------------------------ Spatial Frame, Compass Rose & HUD ------------------------------ */
function BoxFrame({ transectLat }) {
  const edges = useMemo(() => {
    const g = new THREE.BoxGeometry(SX, SY, SZ);
    const ed = new THREE.EdgesGeometry(g);
    g.dispose();
    return ed;
  }, []);

  useEffect(() => () => edges.dispose(), [edges]);

  const depthMarkers = [0, 200, 500, 1000, 2000];
  const lonMarkers = [60, 80, 100];
  const latMarkers = [-10, 0, 10, 20];

  return (
    <group>
      {/* Perimeter Bounding Box with subtle cyan glow */}
      <lineSegments position={[0, -SY / 2, 0]} geometry={edges}>
        <lineBasicMaterial color="#1e3a5f" transparent opacity={0.7} />
      </lineSegments>

      {/* Seabed Grid Helper */}
      <gridHelper args={[SX, 10, '#224a73', '#112338']} position={[0, -SY - 0.02, 0]} scale={[1, 1, SZ / SX]} />

      {/* Longitude Labels at Surface */}
      {lonMarkers.map((lon) => (
        <Html key={`lon-${lon}`} position={[lonToX(lon), 0.15, latToZ(-15) + 0.8]} center distanceFactor={28}>
          <div className="select-none whitespace-nowrap text-xs font-mono font-bold tracking-wider text-cyan-300/90 bg-slate-950/70 px-2 py-0.5 rounded border border-cyan-500/20">
            {lon}°E
          </div>
        </Html>
      ))}

      {/* Latitude Labels at Surface */}
      {latMarkers.map((lat) => (
        <Html key={`lat-${lat}`} position={[lonToX(50) - 1.2, 0.15, latToZ(lat)]} center distanceFactor={28}>
          <div className="select-none whitespace-nowrap text-xs font-mono font-bold tracking-wider text-cyan-300/90 bg-slate-950/70 px-2 py-0.5 rounded border border-cyan-500/20">
            {lat >= 0 ? `${lat}°N` : `${Math.abs(lat)}°S`}
          </div>
        </Html>
      ))}

      {/* Vertical Depth Scale Tower (Corner Pillar) */}
      {depthMarkers.map((d) => (
        <Html key={`d-${d}`} position={[lonToX(110) + 0.9, depthToY(d), latToZ(-15)]} center distanceFactor={28}>
          <div className="select-none whitespace-nowrap text-[11px] font-mono font-bold text-sky-200 bg-slate-950/90 px-2.5 py-0.5 rounded-md border border-cyan-400/40 shadow-md">
            ▼ {d} m
          </div>
        </Html>
      ))}

      {/* 3D Compass Rose on Seabed */}
      <group position={[lonToX(55), -SY + 0.05, latToZ(-12)]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.0, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
        </mesh>
        <Html position={[0, 0.1, -1.2]} center distanceFactor={25}>
          <span className="text-xs font-black font-mono text-cyan-400">N (North)</span>
        </Html>
        <Html position={[1.2, 0.1, 0]} center distanceFactor={25}>
          <span className="text-xs font-black font-mono text-cyan-400">E</span>
        </Html>
      </group>
    </group>
  );
}

/* --------------------------------- Scene Content --------------------------------- */
function SceneContent(o) {
  const stackDepths = [50, 200, 700, 1500];
  const isFogActive = o.fogEnabled !== false;

  return (
    <>
      <color attach="background" args={['#030816']} />
      {isFogActive && <fog attach="fog" args={['#030816', 36, 75]} />}
      
      {/* Multi-directional Ocean Lighting */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[15, 22, 12]} intensity={1.3} color="#e0f2fe" />
      <directionalLight position={[-14, 10, -15]} intensity={0.6} color="#38bdf8" />
      <pointLight position={[0, -2, 0]} intensity={0.8} color="#06b6d4" distance={25} />

      <group position={[0, 1.2, 0]}>
        {o.showFloor && <SeaFloor />}
        {o.showFloor && <OceanLandmarks />}
        {o.showTransect && <TransectMesh variable={o.variable} lat={o.transectLat} time={o.time} customColormap={o.customColormap} />}
        
        {o.showStack &&
          stackDepths.map((d) => (
            <SliceMesh key={d} variable={o.variable} depth={d} time={o.time} opacity={0.4} fade={0.85} customColormap={o.customColormap} />
          ))}
          
        {o.showSlice && <SliceMesh variable={o.variable} depth={o.depth} time={o.time} opacity={0.95} customColormap={o.customColormap} />}
        {o.showVectors && <CurrentArrows depth={o.depth} time={o.time} />}
        
        {o.showObs &&
          PLATFORMS.map((p) => (
            <PlatformMarker key={p.id} p={p} selected={o.selected === p.id} onSelect={o.onSelect} />
          ))}
          
        <BoxFrame transectLat={o.transectLat} />
      </group>

      <OrbitControls
        enablePan
        target={[0, -2.2, 0]}
        minDistance={8}
        maxDistance={65}
        maxPolarAngle={Math.PI * 0.92}
      />
    </>
  );
}

class SceneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("WebGL 3D Ocean Scene Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#020a18] p-6 text-center text-slate-300">
          <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/30 max-w-md space-y-3 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-300 font-['Outfit']">3D Viewport Rendering Notice</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              {this.state.error?.message || 'WebGL context or 3D scene initialization error.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer hover:scale-105 transition shadow-md font-mono"
            >
              Retry 3D Scene
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function OceanScene(props) {
  const [aspect, setAspect] = useState(() => (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.6));

  useEffect(() => {
    const handleResize = () => {
      setAspect(window.innerWidth / window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Responsive camera framing: mobile screens (<1.1 aspect ratio) get wider FOV & position adjustment
  const isNarrowMobile = aspect < 1.1;
  const cameraPos = isNarrowMobile ? [20, 16, 28] : [16, 13, 22];
  const cameraFov = isNarrowMobile ? 52 : 40;

  return (
    <SceneErrorBoundary>
      <Canvas
        camera={{ position: cameraPos, fov: cameraFov }}
        dpr={[1, 2]}
        onPointerMissed={() => props.onSelect && props.onSelect(null)}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, touchAction: 'none' }}
      >
        <SceneContent {...props} />
      </Canvas>
    </SceneErrorBoundary>
  );
}
