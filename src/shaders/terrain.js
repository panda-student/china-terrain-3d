import { VERT_COMMON } from './common.js';

// 底图:顶点着色器读 DEM 纹理抬高网格,片元着色器负责配色/光照/细节图层挖洞
export const TERRAIN_VERT = /* glsl */ `
  ${VERT_COMMON}
  varying float vElev;
  varying vec3 vN;
  varying float vBottom;
  varying float vWall;
  varying vec2 vXZ;

  void main() {
    float e = elevAt(aTexel);
    float h = hOf(e);
    float lon = uExtent.x + aTexel.x / (uDim.x - 1.0) * (uExtent.y - uExtent.x);
    float lat = uExtent.w - aTexel.y / (uDim.y - 1.0) * (uExtent.w - uExtent.z);
    float cellX = (uExtent.y - uExtent.x) / (uDim.x - 1.0) * uKx;
    float cellZ = (uExtent.w - uExtent.z) / (uDim.y - 1.0);
    float hL = hOf(elevAt(aTexel - vec2(uStep, 0.0)));
    float hR = hOf(elevAt(aTexel + vec2(uStep, 0.0)));
    float hN = hOf(elevAt(aTexel - vec2(0.0, uStep)));
    float hS = hOf(elevAt(aTexel + vec2(0.0, uStep)));
    vec3 n = normalize(vec3(-(hR - hL) / (2.0 * cellX * uStep), 1.0, -(hS - hN) / (2.0 * cellZ * uStep)));
    vN = aWall > 0.5 ? aWallN : n;
    vElev = e;
    vBottom = aBottom;
    vWall = aWall;
    float y = mix(h, -uBase, aBottom);
    vec3 p = vec3((lon - uCenter.x) * uKx, y, -(lat - uCenter.y));
    vXZ = p.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

export const TERRAIN_FRAG = /* glsl */ `
  uniform vec4 uHole; // 细节图层覆盖的世界范围 x0 x1 z0 z1,x0>x1 表示关闭
  uniform float uMode;
  varying float vElev;
  varying vec3 vN;
  varying float vBottom;
  varying float vWall;
  varying vec2 vXZ;

  vec3 landRamp(float m) {
    vec3 c = mix(vec3(.20,.34,.16), vec3(.38,.47,.22), smoothstep(0., 500., m));
    c = mix(c, vec3(.58,.52,.32), smoothstep(500., 1500., m));
    c = mix(c, vec3(.55,.42,.32), smoothstep(1500., 3500., m));
    c = mix(c, vec3(.72,.68,.64), smoothstep(3500., 5000., m));
    c = mix(c, vec3(.97,.97,.98), smoothstep(5000., 6500., m));
    return c;
  }
  vec3 seaRamp(float d) {
    vec3 c = mix(vec3(.20,.50,.64), vec3(.10,.30,.50), smoothstep(0., 300., d));
    c = mix(c, vec3(.03,.12,.28), smoothstep(300., 3000., d));
    c = mix(c, vec3(.01,.04,.12), smoothstep(3000., 8000., d));
    return c;
  }

  vec3 stepRamp(float m) {
    vec3 c = mix(vec3(.38,.73,.38), vec3(.96,.80,.36), smoothstep(500., 800., m));
    return mix(c, vec3(.82,.36,.28), smoothstep(2500., 3300., m));
  }
  vec3 seaZone(float d) {
    vec3 c = vec3(.50,.82,.86);
    c = mix(c, vec3(.23,.53,.75), smoothstep(190., 210., d));
    c = mix(c, vec3(.11,.29,.55), smoothstep(1900., 2100., d));
    return mix(c, vec3(.04,.10,.28), smoothstep(5900., 6100., d));
  }

  void main() {
    if (vWall < 0.5 && vXZ.x > uHole.x && vXZ.x < uHole.y && vXZ.y > uHole.z && vXZ.y < uHole.w) discard;
    vec3 base;
    float amb = 0.38, dif = 0.85;
    if (uMode > 1.5) {
      base = vElev >= 0.0 ? vec3(.42,.42,.40) + 0.04 * landRamp(vElev) : seaZone(-vElev);
    } else if (uMode > 0.5) {
      base = vElev >= 0.0 ? stepRamp(vElev) : seaRamp(-vElev) * 0.8;
      amb = 0.62; dif = 0.5;
    } else {
      base = vElev >= 0.0 ? landRamp(vElev) : seaRamp(-vElev);
    }
    if (vWall > 0.5) base *= mix(1.0, 0.4, vBottom);
    vec3 L = normalize(vec3(-0.55, 0.75, 0.45));
    float d = max(dot(normalize(vN), L), 0.0);
    gl_FragColor = vec4(base * (amb + dif * d), 1.0);
  }
`;
