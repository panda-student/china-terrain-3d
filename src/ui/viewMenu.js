import * as THREE from 'three';
import { PRESET_VIEWS } from '../presetViews.js';
import { DEFAULT_EXAGGERATION } from '../config.js';
import { $, createPopover } from './dom.js';

const RAD = Math.PI / 180;

// 预设视角菜单:右下"视角"按钮弹出列表,点一项(或按数字键)飞过去并显示讲解
export function createViewMenu({ dom, controls, fly, frame, heightAt, showInfo, setExaggeration }) {
  const { cx, cy, kx } = frame;
  const box = $('viewbox'), list = $('viewlist');
  const pop = createPopover({ box, button: $('views'), dom });
  const items = [];

  const go = (i) => {
    const v = PRESET_VIEWS[i];
    if (!v) return;
    const land = v.land ?? DEFAULT_EXAGGERATION.land, sea = v.sea ?? DEFAULT_EXAGGERATION.sea;
    setExaggeration(land, sea);
    // 新的夸张倍数下一帧才写进着色器参数,等一帧再取目标点高度
    requestAnimationFrame(() => {
      const target = new THREE.Vector3((v.lon - cx) * kx, heightAt(v.lon, v.lat), -(v.lat - cy));
      // heading 是相机面朝的方向;球坐标 theta=0 时相机在南侧朝北看,所以取负
      fly.look({ target, radius: v.dist, phi: v.tilt * RAD, theta: -v.heading * RAD }, 1600);
    });
    showInfo(v.name, `${v.desc}\n<small>已调为 陆地 ×${land} · 海底 ×${sea},可在"地形"里再改。</small>`, null, 'var(--accent)');
    items.forEach((el, j) => el.classList.toggle('on', j === i));
    pop.show(false);
  };

  PRESET_VIEWS.forEach((v, i) => {
    const el = document.createElement('button');
    el.innerHTML = `<span></span>${i < 9 ? `<kbd>${i + 1}</kbd>` : ''}`;
    el.querySelector('span').textContent = v.name;
    el.title = v.desc;
    el.addEventListener('click', () => go(i));
    list.appendChild(el);
    items.push(el);
  });

  // 用户自己动了镜头,就不再高亮某个预设
  controls.addEventListener('start', () => items.forEach((el) => el.classList.remove('on')));

  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target.matches?.('input[type=text], textarea')) return;
    if (e.key >= '1' && e.key <= '9') go(Number(e.key) - 1);
  });

  return { go };
}
