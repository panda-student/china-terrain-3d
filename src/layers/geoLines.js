import * as THREE from 'three';
import { LINES } from '../features.js';

// 概念分界线(秦岭—淮河线、胡焕庸线、阶梯分界等):按经纬折线加密后贴在地形高度上
// 资源:features.js 的 LINES;动作:refresh() 在夸张倍数/底色模式变化时重算高度
export function addGeoLines({ scene, shared, heightAt, frame }) {
  const { cx, cy, kx } = frame;
  const drawn = [];
  const entries = []; // 供界面生成开关

  for (const [key, L] of Object.entries(LINES)) {
    const mat = new THREE.LineBasicMaterial({ color: L.color, depthTest: false, transparent: true, opacity: 0.95 });
    const group = [];
    for (const seg of L.segs || [L.pts]) {
      const pts = [];
      for (let i = 0; i < seg.length - 1; i++) {
        const [a, b] = [seg[i], seg[i + 1]];
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.15));
        for (let s = 0; s < n; s++) pts.push([a[0] + ((b[0] - a[0]) * s) / n, a[1] + ((b[1] - a[1]) * s) / n]);
      }
      pts.push(seg[seg.length - 1]);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts.length * 3), 3));
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      line.renderOrder = 10;
      line.visible = !!L.on;
      scene.add(line);
      drawn.push({ line, pts });
      group.push(line);
    }
    entries.push({
      key, name: L.name, desc: L.desc, color: L.color, on: !!L.on,
      setVisible: (v) => group.forEach((l) => (l.visible = v)),
    });
  }

  let lastSig = '';
  return {
    entries,
    refresh() {
      const sig = `${shared.uMode.value}|${shared.uLand.value.toFixed(2)}|${shared.uSea.value.toFixed(2)}`;
      if (sig === lastSig) return;
      lastSig = sig;
      for (const g of drawn) {
        const a = g.line.geometry.getAttribute('position');
        g.pts.forEach(([lon, lat], i) => a.setXYZ(i, (lon - cx) * kx, heightAt(lon, lat) + 0.05, -(lat - cy)));
        a.needsUpdate = true;
      }
    },
  };
}
