import * as THREE from 'three';
import { STEP, DEFAULT_EXAGGERATION } from '../config.js';

// 所有着色器共用的 uniform:DEM 纹理、坐标系、夸张倍数、底色模式、细节图层范围
export function createUniforms(meta, demF, { cx, cy, kx }) {
  const tex = new THREE.DataTexture(demF, meta.width, meta.height, THREE.RedFormat, THREE.FloatType);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;

  return {
    uDem: { value: tex },
    uDim: { value: new THREE.Vector2(meta.width, meta.height) },
    uExtent: { value: new THREE.Vector4(meta.west, meta.east, meta.south, meta.north) },
    uCenter: { value: new THREE.Vector2(cx, cy) },
    uKx: { value: kx },
    uLand: { value: DEFAULT_EXAGGERATION.land },
    uSea: { value: DEFAULT_EXAGGERATION.sea },
    uBase: { value: 1.8 },
    uStep: { value: STEP },
    uLift: { value: 0 },
    uMode: { value: 0 },
    uHole: { value: new THREE.Vector4(1, 0, 1, 0) },
    uPatch: { value: null },
    uPatchOn: { value: 0 },
    uPatchO: { value: new THREE.Vector4() },
    uPatchH: { value: 0 },
  };
}
