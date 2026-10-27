import * as THREE from 'three';

// 屏幕点 → 地面经纬度:沿视线在高度场上步进,穿过地面后二分求交
// (地形是着色器里位移出来的,不能直接用 three 的网格射线检测)
export function createPicker({ camera, dom, frame, meta, heightAt, sampleElev }) {
  const { cx, cy, kx } = frame;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const P = new THREE.Vector3();

  const gapAt = (o, d, t) => {
    P.copy(d).multiplyScalar(t).add(o);
    const lon = P.x / kx + cx, lat = cy - P.z;
    // DEM 范围外当作海平面,避免边缘外的高度干扰步进
    const inside = lon >= meta.west && lon <= meta.east && lat >= meta.south && lat <= meta.north;
    return P.y - (inside ? heightAt(lon, lat) : 0);
  };

  return function pick(clientX, clientY) {
    const r = dom.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    camera.updateMatrixWorld(); // 首帧渲染前矩阵可能还没更新
    ray.setFromCamera(ndc, camera);
    const { origin: o, direction: d } = ray.ray;

    let t = 0, g = gapAt(o, d, 0);
    if (g < 0) return null;
    let hit = -1;
    for (let i = 0; i < 600 && t < 600; i++) {
      const step = Math.min(2, Math.max(0.004, g * 0.5));
      const g2 = gapAt(o, d, t + step);
      if (g2 < 0) { hit = t; t += step; break; }
      t += step; g = g2;
      if (P.y < -20) return null;
    }
    if (hit < 0) return null;
    let a = hit, b = t;
    for (let i = 0; i < 20; i++) { const m = (a + b) / 2; if (gapAt(o, d, m) > 0) a = m; else b = m; }
    gapAt(o, d, b);
    const lon = P.x / kx + cx, lat = cy - P.z;
    if (lon < meta.west || lon > meta.east || lat < meta.south || lat > meta.north) return null;
    return { lon, lat, elev: sampleElev(lon, lat), point: P.clone() };
  };
}
