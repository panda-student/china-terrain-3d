// 界面小工具:滑块进度色、开关行
export const $ = (id) => document.getElementById(id);

// 让滑块左侧已选部分显示为强调色(配合 CSS 变量 --p)
export function trackFill(el) {
  const p = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--p', `${p}%`);
}

// 一行"色块 + 文字 + 开关"
export function switchRow({ label, color, checked, title }) {
  const el = document.createElement('label');
  el.className = 'sw';
  if (title) el.title = title;
  el.innerHTML = `${color ? `<em style="background:${color}"></em>` : ''}<span></span><input type="checkbox"${checked ? ' checked' : ''}/><i></i>`;
  el.querySelector('span').textContent = label;
  return { el, input: el.querySelector('input') };
}

// 按钮弹出的浮层:同一时间只开一个;× / Esc / 点地图 关闭
const popovers = new Set();
export function createPopover({ box, button, dom }) {
  const show = (v) => {
    if (v) popovers.forEach((p) => p !== api && p.show(false));
    box.classList.toggle('on', v);
    button?.classList.toggle('on', v);
  };
  const api = { show, isOpen: () => box.classList.contains('on') };
  popovers.add(api);
  button?.addEventListener('click', () => show(!api.isOpen()));
  box.querySelector('.x')?.addEventListener('click', () => show(false));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') show(false); });
  dom.addEventListener('pointerdown', () => show(false));
  return api;
}

export const CLOSE_SVG = '<svg class="i" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>';
