import { VERT_COMMON } from './common.js';

// 贴地线(省界、剖面线):顶点高度取自底图 DEM,在细节图层范围内改取细节高程
export const LINE_VERT = /* glsl */ `
  ${VERT_COMMON}
  uniform sampler2D uPatch;
  uniform float uPatchOn;
  uniform vec4 uPatchO; // x0m, y0m, scale, 宽
  uniform float uPatchH; // 高
  void main() {
    float lon = uExtent.x + aTexel.x / (uDim.x - 1.0) * (uExtent.y - uExtent.x);
    float lat = uExtent.w - aTexel.y / (uDim.y - 1.0) * (uExtent.w - uExtent.z);
    float h = hOf(elevAt(aTexel));
    if (uPatchOn > 0.5) {
      float latR = radians(lat);
      float ym = (1.0 - log(tan(latR) + 1.0 / cos(latR)) / 3.14159265) / 2.0;
      vec2 lp = (vec2((lon + 180.0) / 360.0, ym) - uPatchO.xy) * uPatchO.z;
      if (lp.x >= 0.0 && lp.y >= 0.0 && lp.x < uPatchO.w - 1.0 && lp.y < uPatchH - 1.0) {
        h = hOf(texelFetch(uPatch, ivec2(floor(lp + 0.5)), 0).r);
      }
    }
    h += uLift;
    vec3 p = vec3((lon - uCenter.x) * uKx, h, -(lat - uCenter.y));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
export const LINE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  void main() { gl_FragColor = vec4(uColor, uAlpha); }
`;
