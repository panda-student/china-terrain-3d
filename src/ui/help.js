import { $, createPopover } from './dom.js';

const SEEN_KEY = '3dmap.helpSeen';

// 操作说明浮层:"?" 按钮切换;第一次打开页面时自动弹出,点地图或几秒后收起
export function createHelp({ dom }) {
  const pop = createPopover({ box: $('helpbox'), button: $('help'), dom });

  let seen = false;
  try { seen = localStorage.getItem(SEEN_KEY) === '1'; localStorage.setItem(SEEN_KEY, '1'); } catch { /* 隐私模式等 */ }
  if (!seen) { pop.show(true); setTimeout(() => pop.show(false), 10000); }
}
