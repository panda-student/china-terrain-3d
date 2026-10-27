// 资源:本地 Terrarium 高程瓦片(data/tiles/{z}/{x}/{y}.png,完全离线)
// 动作:把 PNG 解码成 256×256 的海拔(米)数组,带 LRU 缓存
const TILE_URL = (z, x, y) => `/tiles/${z}/${x}/${y}.png`;
const CACHE_MAX = 400;

const cache = new Map();
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 256;
const ctx = canvas.getContext('2d', { willReadFrequently: true });

export function loadTile(z, x, y) {
  const n = 2 ** z;
  if (y < 0 || y >= n) return Promise.resolve(null);
  x = ((x % n) + n) % n;
  const key = `${z}/${x}/${y}`;
  if (cache.has(key)) return cache.get(key);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const px = ctx.getImageData(0, 0, 256, 256).data;
      const out = new Float32Array(256 * 256);
      // Terrarium 编码:r*256 + g + b/256 - 32768
      for (let i = 0; i < out.length; i++) out[i] = px[i * 4] * 256 + px[i * 4 + 1] + px[i * 4 + 2] / 256 - 32768;
      resolve(out);
    };
    img.onerror = () => { cache.delete(key); resolve(null); };
    img.src = TILE_URL(z, x, y);
  });
  cache.set(key, p);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
  return p;
}
