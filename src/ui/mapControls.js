import { INITIAL_VIEW } from '../config.js';
import { $ } from './dom.js';

const TOP_PHI = 0.2; // 俯仰角小于它算作"俯视"

// 右下地图控件:缩放、指北针、俯视/斜视切换、复位
export function createMapControls({ controls, fly, onHome }) {
  $('zIn').addEventListener('click', () => fly.orbit({ scale: 0.55 }, 450));
  $('zOut').addEventListener('click', () => fly.orbit({ scale: 1.8 }, 450));
  $('compass').addEventListener('click', () => fly.orbit({ theta: 0 }, 650));
  $('v3d').addEventListener('click', () => fly.orbit({ phi: controls.getPolarAngle() < TOP_PHI ? 0.95 : 0 }, 750));
  $('vHome').addEventListener('click', () => (onHome ? onHome() : fly.to(INITIAL_VIEW.pos, INITIAL_VIEW.target, 1000)));

  const needle = $('needle'), v3d = $('v3d');
  let lastAz = null, lastTop = null;
  return {
    update() {
      const az = controls.getAzimuthalAngle();
      if (az !== lastAz) { needle.style.transform = `rotate(${az}rad)`; lastAz = az; }
      const top = controls.getPolarAngle() < TOP_PHI;
      if (top !== lastTop) {
        v3d.textContent = top ? '3D' : '2D';
        v3d.title = top ? '切换为斜视(3D)' : '切换为正上方俯视(2D)';
        lastTop = top;
      }
    },
  };
}
