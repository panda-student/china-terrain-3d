import * as THREE from 'three';
import { STEP } from '../config.js';

// 几何:网格只存"取样的 DEM 像素坐标"(aTexel),真正的位置与高度全在着色器里算
// ---------- 几何构造 ----------
export function dummyPositions(n) {
  return new THREE.BufferAttribute(new Float32Array(n * 3), 3);
}

export function buildTerrain(w, h, step = STEP) {
  const nx = Math.floor((w - 1) / step) + 1;
  const ny = Math.floor((h - 1) / step) + 1;
  const n = nx * ny;
  const texel = new Float32Array(n * 2);
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const k = (j * nx + i) * 2;
      texel[k] = Math.min(i * step, w - 1);
      texel[k + 1] = Math.min(j * step, h - 1);
    }
  }
  const index = new Uint32Array((nx - 1) * (ny - 1) * 6);
  let q = 0;
  for (let j = 0; j < ny - 1; j++) {
    for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      index.set([a, c, b, b, c, d], q);
      q += 6;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', dummyPositions(n));
  g.setAttribute('aTexel', new THREE.BufferAttribute(texel, 2));
  g.setIndex(new THREE.BufferAttribute(index, 1));
  return g;
}

// 四周的"沙盘"侧壁
export function buildWalls(w, h) {
  const verts = []; // {x, y, bottom, nx, ny, nz}
  const idx = [];
  const edges = [
    { pts: (t) => [t, 0], n: [0, 0, -1], len: w },
    { pts: (t) => [t, h - 1], n: [0, 0, 1], len: w },
    { pts: (t) => [0, t], n: [-1, 0, 0], len: h },
    { pts: (t) => [w - 1, t], n: [1, 0, 0], len: h },
  ];
  for (const e of edges) {
    const base = verts.length / 7;
    const m = Math.floor((e.len - 1) / STEP) + 1;
    for (let s = 0; s < m; s++) {
      const [x, y] = e.pts(Math.min(s * STEP, e.len - 1));
      verts.push(x, y, 0, 1, ...e.n); // top
      verts.push(x, y, 1, 1, ...e.n); // bottom
    }
    for (let s = 0; s < m - 1; s++) {
      const a = base + s * 2;
      idx.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }
  }
  const stride = 7;
  const count = verts.length / stride;
  const texel = new Float32Array(count * 2);
  const bottom = new Float32Array(count);
  const wall = new Float32Array(count).fill(1);
  const wn = new Float32Array(count * 3);
  for (let v = 0; v < count; v++) {
    const o = v * stride;
    texel[v * 2] = verts[o];
    texel[v * 2 + 1] = verts[o + 1];
    bottom[v] = verts[o + 2];
    wn.set([verts[o + 4], verts[o + 5], verts[o + 6]], v * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', dummyPositions(count));
  g.setAttribute('aTexel', new THREE.BufferAttribute(texel, 2));
  g.setAttribute('aBottom', new THREE.BufferAttribute(bottom, 1));
  g.setAttribute('aWall', new THREE.BufferAttribute(wall, 1));
  g.setAttribute('aWallN', new THREE.BufferAttribute(wn, 3));
  g.setIndex(idx);
  return g;
}
