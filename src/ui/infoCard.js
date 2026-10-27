import { CLOSE_SVG } from './dom.js';

// 右上信息卡:点击地名 / 图层时滑出,× 或 Esc 关闭
export function createInfoCard(el) {
  const hide = () => el.classList.remove('on');
  addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });

  return function showInfo(title, desc, legend, color) {
    const lg = legend ? `<div class="lg">${legend.map(([c, t]) => `<span><i style="background:${c}"></i>${t}</span>`).join('')}</div>` : '';
    el.innerHTML = `<button class="icon x" title="关闭">${CLOSE_SVG}</button>`
      + `<h2><em style="background:${color || 'var(--accent)'}"></em><span></span></h2><p>${desc.replace(/\n/g, '<br>')}</p>${lg}`;
    el.querySelector('h2 span').textContent = title;
    el.querySelector('.x').addEventListener('click', hide);
    el.scrollTop = 0;
    el.classList.add('on');
  };
}
