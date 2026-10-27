import * as THREE from 'three';
import { buildProvinceLines } from '../geometry/provinceLines.js';

// 省界线(贴地)
export function addProvinceBorders(scene, prov, meta, lineMat) {
  const lines = new THREE.LineSegments(buildProvinceLines(prov, meta), lineMat(0xffffff, 0.02, 0.55));
  lines.frustumCulled = false;
  scene.add(lines);
  return { setVisible: (v) => (lines.visible = v) };
}
