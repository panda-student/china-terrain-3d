import * as THREE from 'three';

// 采样点(NDC):屏幕下 3/4 区域,忽略地平线附近
const VIEW_PTS = [[-1, -1], [1, -1], [-1, 0], [1, 0], [0, -1], [0, 0], [0, -0.4]];
const _ray = new THREE.Vector3();

// 动作:把当前视野投到地面(y=0),得到可见的经纬度范围,并限制在 DEM 范围内;无效时返回 null
export function visibleLonLatBounds(camera, dist, { cx, cy, kx }, meta) {
  let minLon = 1e9, maxLon = -1e9, minLat = 1e9, maxLat = -1e9;
  for (const [sx, sy] of VIEW_PTS) {
    _ray.set(sx, sy, 0.5).unproject(camera).sub(camera.position).normalize();
    const t = _ray.y < -1e-3 ? Math.min(-camera.position.y / _ray.y, 1.6 * dist) : 1.6 * dist;
    const px = camera.position.x + _ray.x * t, pz = camera.position.z + _ray.z * t;
    const lon = px / kx + cx, lat = cy - pz;
    minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
  }
  minLon = Math.max(minLon, meta.west); maxLon = Math.min(maxLon, meta.east);
  minLat = Math.max(minLat, meta.south); maxLat = Math.min(maxLat, meta.north);
  if (minLon >= maxLon || minLat >= maxLat) return null;
  return { minLon, maxLon, minLat, maxLat };
}
