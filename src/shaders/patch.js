import { HOF } from './common.js';

// 细节图层:Web Mercator 瓦片拼成的高程纹理(见 DETAIL.TX/TY)
export const PATCH_VERT = /* glsl */ `
  uniform sampler2D uPatch;
  uniform vec2 uPatchN;
  uniform vec4 uPatchGeo; // lon0, cellLon, y0(归一化墨卡托), yStep
  uniform vec2 uCenter;
  uniform float uKx;
  uniform float uLand;
  uniform float uSea;
  uniform float uMode;
  attribute vec2 aTexel;
  varying float vElev;
  varying vec3 vN;
  varying float vBottom;
  varying float vWall;
  varying vec2 vXZ;

  float elevAt(vec2 t) {
    ivec2 i = ivec2(clamp(floor(t + 0.5), vec2(0.0), (uPatchN - 1.0)));
    return texelFetch(uPatch, i, 0).r;
  }
  ${HOF}
  float latOf(float ym) { return degrees(atan(sinh(3.14159265 * (1.0 - 2.0 * ym)))); }

  void main() {
    float e = elevAt(aTexel);
    float lon = uPatchGeo.x + aTexel.x * uPatchGeo.y;
    float lat = latOf(uPatchGeo.z + aTexel.y * uPatchGeo.w);
    float cellX = uPatchGeo.y * uKx;
    float cellZ = uPatchGeo.y * cos(radians(lat));
    float hL = hOf(elevAt(aTexel - vec2(1.0, 0.0)));
    float hR = hOf(elevAt(aTexel + vec2(1.0, 0.0)));
    float hN = hOf(elevAt(aTexel - vec2(0.0, 1.0)));
    float hS = hOf(elevAt(aTexel + vec2(0.0, 1.0)));
    vN = normalize(vec3(-(hR - hL) / (2.0 * cellX), 1.0, -(hS - hN) / (2.0 * cellZ)));
    vElev = e;
    vBottom = 0.0;
    vWall = 0.0;
    vec3 p = vec3((lon - uCenter.x) * uKx, hOf(e), -(lat - uCenter.y));
    vXZ = p.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
