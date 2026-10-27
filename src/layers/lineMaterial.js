import * as THREE from 'three';
import { LINE_VERT, LINE_FRAG } from '../shaders/line.js';

// 贴地线材质工厂:共用底图 uniform,所以会跟随夸张倍数和细节图层
export function createLineMaterialFactory(shared) {
  return (color, lift, alpha = 1) =>
    new THREE.ShaderMaterial({
      uniforms: { ...shared, uLift: { value: lift }, uColor: { value: new THREE.Color(color) }, uAlpha: { value: alpha } },
      vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, transparent: alpha < 1,
    });
}
