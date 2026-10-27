import * as THREE from 'three';
import { TERRAIN_VERT, TERRAIN_FRAG } from '../shaders/terrain.js';
import { buildTerrain, buildWalls } from '../geometry/terrainMesh.js';

// 底图:整张 DEM 的地形网格 + 四周沙盘侧壁
export function addBaseTerrain(scene, meta, shared) {
  const material = new THREE.ShaderMaterial({
    uniforms: shared, vertexShader: TERRAIN_VERT, fragmentShader: TERRAIN_FRAG, side: THREE.DoubleSide,
  });
  const terrain = new THREE.Mesh(buildTerrain(meta.width, meta.height), material);
  const walls = new THREE.Mesh(buildWalls(meta.width, meta.height), material);
  terrain.frustumCulled = walls.frustumCulled = false;
  scene.add(terrain, walls);
}
