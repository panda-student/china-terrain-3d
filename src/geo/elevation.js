import { KM_PER_DEG } from '../config.js';

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// 与着色器 flatStep 一致:三级阶梯模式下陆地压平后的"等效海拔"
const flatStepJS = (m) => 300 + 1200 * smooth(500, 800, m) + 3000 * smooth(2500, 3300, m);

// CPU 端高程查询,让地名、分界线能贴在着色器算出的同一高度上
export function createElevation(meta, demF, shared) {
  const w = meta.width, h = meta.height;

  const sampleElev = (lon, lat) => {
    const fx = ((lon - meta.west) / (meta.east - meta.west)) * (w - 1);
    const fy = ((meta.north - lat) / (meta.north - meta.south)) * (h - 1);
    const x0 = Math.max(0, Math.min(w - 2, Math.floor(fx))), y0 = Math.max(0, Math.min(h - 2, Math.floor(fy)));
    // 权重夹在 0..1,越界时取边缘值而不是线性外推
    const tx = Math.min(1, Math.max(0, fx - x0)), ty = Math.min(1, Math.max(0, fy - y0));
    const e = (x, y) => demF[y * w + x];
    return (e(x0, y0) * (1 - tx) + e(x0 + 1, y0) * tx) * (1 - ty) + (e(x0, y0 + 1) * (1 - tx) + e(x0 + 1, y0 + 1) * tx) * ty;
  };

  // 世界坐标高度(含当前夸张倍数与底色模式)
  const heightAt = (lon, lat) => {
    const m = sampleElev(lon, lat);
    const mode = shared.uMode.value;
    if (m >= 0) return ((mode === 1 ? flatStepJS(m) : m) * shared.uLand.value) / KM_PER_DEG;
    return (m * shared.uSea.value) / KM_PER_DEG;
  };

  return { sampleElev, heightAt };
}
