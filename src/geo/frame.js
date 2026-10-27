// 经纬度 → 世界坐标的约定:1 单位 = 1° 纬度,x 方向乘 kx,北 = -z,原点在 DEM 中心
export function createFrame(meta) {
  return {
    cx: (meta.west + meta.east) / 2,
    cy: (meta.south + meta.north) / 2,
    kx: Math.cos((28.5 * Math.PI) / 180),
  };
}
