// 把 ETOPO 的 .nc 转成网页可直接加载的 Int16 二进制 + 元数据 JSON
import { readFileSync, writeFileSync } from 'node:fs';
import { NetCDFReader } from 'netcdfjs';

const r = new NetCDFReader(readFileSync('scripts/raw/etopo2022_china_1min.nc'));
const lat = r.getDataVariable('latitude');
const lon = r.getDataVariable('longitude');
const z = r.getDataVariable('z');
const h = lat.length, w = lon.length;

// 保证第 0 行是最北端(便于直接当图像用)
const flip = lat[0] < lat[h - 1];
const out = new Int16Array(w * h);
let min = Infinity, max = -Infinity;
for (let y = 0; y < h; y++) {
  const sy = flip ? h - 1 - y : y;
  for (let x = 0; x < w; x++) {
    const v = Math.round(z[sy * w + x]);
    out[y * w + x] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
}
writeFileSync('data/dem.bin', Buffer.from(out.buffer));
const meta = {
  width: w, height: h, min, max,
  west: Math.min(lon[0], lon[w - 1]), east: Math.max(lon[0], lon[w - 1]),
  south: Math.min(lat[0], lat[h - 1]), north: Math.max(lat[0], lat[h - 1]),
  dtype: 'int16', rowOrder: 'north-to-south', unit: 'm',
};
writeFileSync('data/dem.json', JSON.stringify(meta, null, 2));
console.log(meta);
