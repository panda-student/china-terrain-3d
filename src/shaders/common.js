import { KM_PER_DEG } from '../config.js';

// 着色器公用片段:高度映射(uMode=1 三级阶梯时把陆地压平成三个台面)与底图顶点输入
export const HOF = /* glsl */ `
  float flatStep(float m) {
    return 300.0 + 1200.0 * smoothstep(500.0, 800.0, m) + 3000.0 * smoothstep(2500.0, 3300.0, m);
  }
  float hOf(float m) {
    if (m >= 0.0) {
      float mm = (uMode > 0.5 && uMode < 1.5) ? flatStep(m) : m;
      return mm * uLand / ${KM_PER_DEG.toFixed(1)};
    }
    return m * uSea / ${KM_PER_DEG.toFixed(1)};
  }
`;
export const VERT_COMMON = /* glsl */ `
  uniform sampler2D uDem;
  uniform vec2 uDim;
  uniform vec4 uExtent;   // west east south north
  uniform vec2 uCenter;   // lon lat
  uniform float uKx;
  uniform float uLand;
  uniform float uSea;
  uniform float uBase;
  uniform float uStep;
  uniform float uLift;
  attribute vec2 aTexel;
  attribute float aBottom;
  attribute float aWall;
  attribute vec3 aWallN;

  float elevAt(vec2 t) {
    ivec2 i = ivec2(clamp(floor(t + 0.5), vec2(0.0), uDim - 1.0));
    return texelFetch(uDem, i, 0).r;
  }
  uniform float uMode;
  ${HOF}
`;
