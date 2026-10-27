// Web Mercator 归一化 y(0=北极侧,1=南极侧)与纬度互转,瓦片坐标用
export const latOfMerc = (ym) => (Math.atan(Math.sinh(Math.PI * (1 - 2 * ym))) * 180) / Math.PI;

export const mercOfLat = (lat) => {
  const r = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2;
};
