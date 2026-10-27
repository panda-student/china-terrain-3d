// 鼠标手势:拖动时的抓手光标、双击飞到该处
export function createPointerActions({ dom, pick, fly }) {
  dom.addEventListener('pointerdown', () => dom.classList.add('drag'));
  addEventListener('pointerup', () => dom.classList.remove('drag'));

  dom.addEventListener('dblclick', (e) => {
    const hit = pick(e.clientX, e.clientY);
    if (hit) fly.orbit({ target: hit.point, scale: 0.45 }, 900);
  });
}
