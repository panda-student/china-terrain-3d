import * as THREE from 'three';
import { DETAIL } from '../../config.js';
import { PATCH_VERT } from '../../shaders/patch.js';
import { TERRAIN_FRAG } from '../../shaders/terrain.js';
import { buildTerrain } from '../../geometry/terrainMesh.js';
import { latOfMerc, mercOfLat } from '../../geo/mercator.js';
import { loadTile } from './tileLoader.js';
import { visibleLonLatBounds } from './viewBounds.js';

const { TX, TY, MIN_Z, MAX_Z, NEAR_DIST, MESH_STEP, TICK_MS } = DETAIL;
const PW = TX * 256, PH = TY * 256;
const IDLE_TEXT = '细节图层:拉近后自动加载';

// 细节图层:相机拉近后,按视野选瓦片级别,把 TX×TY 块瓦片拼成一张高程纹理,
// 用独立网格盖在底图上(底图在该范围内挖洞)。
export function createDetailLayer({ scene, camera, controls, meta, shared, frame, onStatus }) {
  const { cx, cy, kx } = frame;

  const data = new Float32Array(PW * PH);
  const tex = new THREE.DataTexture(data, PW, PH, THREE.RedFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  shared.uPatch.value = tex; // 贴地线也要读它

  const uniforms = {
    uPatch: { value: tex },
    uPatchN: { value: new THREE.Vector2(PW, PH) },
    uPatchGeo: { value: new THREE.Vector4() },
    uCenter: shared.uCenter, uKx: shared.uKx, uLand: shared.uLand, uSea: shared.uSea, uMode: shared.uMode,
    uHole: { value: new THREE.Vector4(1, 0, 1, 0) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: PATCH_VERT, fragmentShader: TERRAIN_FRAG,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(buildTerrain(PW, PH, MESH_STEP), material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  scene.add(mesh);

  let patchKey = '';
  let wantKey = '';
  let cov = null; // 当前细节块覆盖的瓦片范围 {z,x,y}
  let lastCamSig = '';
  let lastTick = 0;

  async function setPatch(z, tx0, ty0) {
    const key = `${z}/${tx0}/${ty0}`;
    wantKey = key;
    onStatus(`细节图层 z${z} 加载中…`);
    const jobs = [];
    for (let r = 0; r < TY; r++) for (let c = 0; c < TX; c++) jobs.push(loadTile(z, tx0 + c, ty0 + r));
    const tiles = await Promise.all(jobs);
    if (wantKey !== key) return; // 已被更新的请求取代
    data.fill(0);
    tiles.forEach((t, i) => {
      if (!t) return;
      const r = Math.floor(i / TX), c = i % TX;
      for (let row = 0; row < 256; row++) {
        data.set(t.subarray(row * 256, (row + 1) * 256), (r * 256 + row) * PW + c * 256);
      }
    });
    tex.needsUpdate = true;

    const n = 2 ** z;
    const cellLon = 360 / (n * 256);
    const lon0 = (tx0 / n) * 360 - 180;
    uniforms.uPatchGeo.value.set(lon0, cellLon, ty0 / n, 1 / (n * 256));
    shared.uPatchO.value.set(tx0 / n, ty0 / n, n * 256, PW);
    shared.uPatchH.value = PH;
    // 底图上挖洞的范围(略缩进,保证边缘重叠不留缝)
    const inset = cellLon * 3;
    const lonE = lon0 + (PW - 1) * cellLon;
    const latN = latOfMerc(ty0 / n);
    const latS = latOfMerc((ty0 * 256 + PH - 1) / (n * 256));
    shared.uHole.value.set(
      (lon0 + inset - cx) * kx, (lonE - inset - cx) * kx,
      -(latN - inset - cy), -(latS + inset - cy),
    );
    shared.uPatchOn.value = 1;
    mesh.visible = true;
    patchKey = key;
    onStatus(`细节图层 z${z}(约 ${Math.round(40075000 * Math.cos((cy * Math.PI) / 180) / (n * 256))} m/像素)`);
  }

  function disable() {
    wantKey = patchKey = '';
    cov = null;
    mesh.visible = false;
    shared.uPatchOn.value = 0;
    shared.uHole.value.set(1, 0, 1, 0);
    onStatus(IDLE_TEXT);
  }

  // 选能让可见范围装进 TX×TY 块瓦片的最高级别;返回 {z, bx0, bx1, by0, by1}
  function pickLevel(b) {
    let z = MAX_Z, bx0, bx1, by0, by1;
    for (; z >= MIN_Z; z--) {
      const n = 2 ** z;
      bx0 = Math.floor(((b.minLon + 180) / 360) * n); bx1 = Math.floor(((b.maxLon + 180) / 360) * n);
      by0 = Math.floor(mercOfLat(b.maxLat) * n); by1 = Math.floor(mercOfLat(b.minLat) * n);
      if (bx1 - bx0 < TX && by1 - by0 < TY) return { z, bx0, bx1, by0, by1 };
    }
    // 视野太大,最低级别也装不下:退到以视野中心为准
    const n = 2 ** MIN_Z;
    const bx = Math.floor((((controls.target.x / kx + cx) + 180) / 360) * n);
    const by = Math.floor(mercOfLat(cy - controls.target.z) * n);
    return { z: MIN_Z, bx0: bx, bx1: bx, by0: by, by1: by };
  }

  function refresh() {
    const dist = camera.position.distanceTo(controls.target);
    if (dist >= NEAR_DIST) { if (patchKey || wantKey) disable(); return; }
    // 镜头还在动就先不加载,停稳后再取
    const sig = [camera.position.x, camera.position.y, camera.position.z, controls.target.x, controls.target.z].join(',');
    if (sig !== lastCamSig) { lastCamSig = sig; return; }
    const bounds = visibleLonLatBounds(camera, dist, frame, meta);
    if (!bounds) return;
    const { z, bx0, bx1, by0, by1 } = pickLevel(bounds);
    // 已有的块级别相同且完全覆盖视野,就不动,避免来回切换
    if (cov && cov.z === z && bx0 >= cov.x && bx1 < cov.x + TX && by0 >= cov.y && by1 < cov.y + TY) return;
    const x0 = bx0 - ((TX - (bx1 - bx0 + 1)) >> 1), y0 = by0 - ((TY - (by1 - by0 + 1)) >> 1);
    cov = { z, x: x0, y: y0 };
    setPatch(z, x0, y0);
  }

  onStatus(IDLE_TEXT);

  return {
    // 每帧调用,内部按 TICK_MS 节流
    update(now) {
      if (now - lastTick < TICK_MS) return;
      lastTick = now;
      refresh();
    },
  };
}
