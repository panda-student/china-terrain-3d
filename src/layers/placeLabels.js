import * as THREE from 'three';
import { FEATURES, TYPE_META } from '../features.js';

const shortProv = (s) => s.replace(/特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|省|市/g, '');
const _v = new THREE.Vector3();

// 地名标注:DOM 标签投影到屏幕,按远近分级(tier)显示并做碰撞避让
// 资源:省界 GeoJSON 的中心点 + features.js 的 FEATURES;动作:update() 每帧重新定位
export function createPlaceLabels({ container, camera, prov, heightAt, frame, onSelect }) {
  const { cx, cy, kx } = frame;
  const items = [];

  const add = (o) => {
    const el = document.createElement('div');
    el.className = `lb ${TYPE_META[o.t].cls}`;
    el.textContent = o.n;
    el.style.display = 'none';
    el.addEventListener('click', () => onSelect(o.full || o.n, o.d, TYPE_META[o.t].color));
    container.appendChild(el);
    const charW = { prov: 13, land: 16, sea: 17, mtn: 14, river: 14 }[o.t];
    items.push({ ...o, el, shown: false, on: o.t === 'prov' || o.t === 'land' || o.t === 'sea', wpx: o.n.length * charW + 14 });
  };

  for (const f of prov.features) {
    const c = f.properties.center || f.properties.centroid;
    if (!c || !f.properties.name) continue;
    add({ n: shortProv(f.properties.name), full: f.properties.name, lon: c[0], lat: c[1], t: 'prov', tier: 1,
      d: `${f.properties.name}。标注点为其省会/首府(行政中心)附近。` });
  }
  for (const f of FEATURES) add(f);
  items.sort((a, b) => a.tier - b.tier);

  return {
    isTypeOn: (type) => items.find((i) => i.t === type).on,
    setTypeOn: (type, on) => items.forEach((i) => { if (i.t === type) i.on = on; }),

    update(dist) {
      const maxTier = dist > 45 ? 1 : dist > 20 ? 2 : 3;
      const W = innerWidth, H = innerHeight;
      const placed = [];
      for (const it of items) {
        let ok = it.on && it.tier <= maxTier;
        let sx = 0, sy = 0;
        if (ok) {
          _v.set((it.lon - cx) * kx, heightAt(it.lon, it.lat) + 0.08, -(it.lat - cy)).project(camera);
          ok = _v.z < 1 && Math.abs(_v.x) < 1.02 && Math.abs(_v.y) < 1.02;
          sx = (_v.x * 0.5 + 0.5) * W; sy = (-_v.y * 0.5 + 0.5) * H;
        }
        if (ok) {
          const x0 = sx - it.wpx / 2, y0 = sy - 22;
          for (const p of placed) {
            if (x0 < p[2] && x0 + it.wpx > p[0] && y0 < p[3] && y0 + 20 > p[1]) { ok = false; break; }
          }
          if (ok) {
            placed.push([x0, y0, x0 + it.wpx, y0 + 20]);
            it.el.style.transform = `translate(${x0.toFixed(0)}px,${y0.toFixed(0)}px)`;
          }
        }
        if (ok !== it.shown) { it.el.style.display = ok ? 'block' : 'none'; it.shown = ok; }
      }
    },
  };
}
