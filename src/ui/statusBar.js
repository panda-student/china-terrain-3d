import { $ } from './dom.js';

const fmtLat = (v) => `${Math.abs(v).toFixed(2)}°${v >= 0 ? 'N' : 'S'}`;
const fmtLon = (v) => `${Math.abs(v).toFixed(2)}°${v >= 0 ? 'E' : 'W'}`;
const fmtElev = (m) => (m >= 0
  ? `海拔 <b>${Math.round(m).toLocaleString()} m</b>`
  : `水深 <b>${Math.round(-m).toLocaleString()} m</b>`);

// 左下状态栏:鼠标所指位置的经纬度与海拔(每帧最多查询一次)
export function createStatusBar({ dom, pick }) {
  const coord = $('coord');
  let pending = null;
  dom.addEventListener('pointermove', (e) => (pending = [e.clientX, e.clientY]));
  dom.addEventListener('pointerleave', () => { pending = null; coord.textContent = '移动鼠标查看经纬度与海拔'; });

  return {
    update() {
      if (!pending) return;
      const h = pick(...pending);
      pending = null;
      coord.innerHTML = h ? `<b>${fmtLat(h.lat)} ${fmtLon(h.lon)}</b> · ${fmtElev(h.elev)}` : '地图范围外';
    },
  };
}
