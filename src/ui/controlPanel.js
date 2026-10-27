import { DEFAULT_EXAGGERATION } from '../config.js';
import { $, trackFill } from './dom.js';

// 面板里的基础控件:夸张倍数、剖面纬度、图层开关
// 只负责读取输入并调用回调,不碰三维对象
export function createControlPanel({ onLat, onProvinces, onProfile, onWater }) {
  let land = DEFAULT_EXAGGERATION.land, sea = DEFAULT_EXAGGERATION.sea;

  const bind = (id, fn, labelId, fmt) => {
    const el = $(id);
    const apply = () => {
      const v = parseFloat(el.value);
      fn(v);
      trackFill(el);
      if (labelId) $(labelId).textContent = fmt(v);
    };
    el.addEventListener('input', apply);
    apply();
  };
  bind('land', (v) => (land = v), 'vLand', (v) => `×${v}`);
  bind('sea', (v) => (sea = v), 'vSea', (v) => `×${v}`);
  bind('lat', onLat);

  const setSliders = (l, s) => {
    $('land').value = l; $('sea').value = s;
    $('land').dispatchEvent(new Event('input')); $('sea').dispatchEvent(new Event('input'));
  };
  $('rReal').addEventListener('click', () => setSliders(1, 1));
  $('rDef').addEventListener('click', () => setSliders(DEFAULT_EXAGGERATION.land, DEFAULT_EXAGGERATION.sea));

  // 开关:初始化时按 HTML 里的默认勾选同步一次
  const toggle = (id, fn) => {
    const el = $(id);
    el.addEventListener('change', () => fn(el.checked));
    fn(el.checked);
  };
  toggle('tProv', onProvinces);
  toggle('tProfile', onProfile);
  toggle('tWater', onWater);
  $('chartClose').addEventListener('click', () => { $('tProfile').checked = false; onProfile(false); });

  return {
    land: () => land,
    sea: () => sea,
    autoAttenuate: () => $('tAuto').checked,
    setExaggeration: setSliders,
  };
}
