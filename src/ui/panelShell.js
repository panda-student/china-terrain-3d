import { $ } from './dom.js';

// 左侧面板外壳:标签页切换、收起/展开
export function createPanelShell() {
  const panel = $('panel');
  $('pfold').addEventListener('click', () => panel.classList.toggle('min'));

  const tabs = panel.querySelectorAll('.tabs button');
  const panes = panel.querySelectorAll('.pane');
  tabs.forEach((b) => b.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.toggle('on', t === b));
    panes.forEach((p) => p.classList.toggle('on', p.dataset.pane === b.dataset.tab));
  }));
}
