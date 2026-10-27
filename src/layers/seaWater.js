import * as THREE from 'three';

// 半透明海水层(海平面)
export function addSeaWater(scene, meta, kx) {
  const material = new THREE.MeshBasicMaterial({ color: 0x2a6fa8, transparent: true, opacity: 0.35, depthWrite: false });
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry((meta.east - meta.west) * kx, meta.north - meta.south).rotateX(-Math.PI / 2),
    material,
  );
  water.visible = false;
  scene.add(water);
  return { setVisible: (v) => (water.visible = v) };
}
