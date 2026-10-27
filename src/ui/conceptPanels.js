import { TYPE_META, BASE_MODES } from '../features.js';
import { $, switchRow } from './dom.js';

const MODE_ID = { normal: 0, steps: 1, sea: 2 };
const TYPE_INFO = {
  prov: '各省、自治区、直辖市、特别行政区的名称,标注点位于行政中心附近。',
  mtn: '山脉是地势的骨架,很多地理分界线都沿山脉延伸。点击地图上的山脉名称可查看说明。拉近镜头会显示更多山脉。',
  land: '高原、平原、盆地、丘陵是五种基本陆地地形(另有山地)。点击地图上的名称查看它位于第几级阶梯及特点。',
  river: '大河多发源于第一级阶梯,穿越阶梯交界处时落差大、水能丰富,最终注入海洋。点击名称查看说明。',
  sea: '包括渤海、黄海、东海、南海四大边海,以及主要岛屿与海峡。点击名称查看说明。',
};

// 概念图层:底色模式(分段按钮)、地理分界线、地名类别(开关)
export function createConceptPanels({ shared, geoLines, labels, showInfo }) {
  // 底色模式
  const modesEl = $('modes');
  const btns = [];
  for (const [key, m] of Object.entries(BASE_MODES)) {
    const b = document.createElement('button');
    b.textContent = m.name;
    b.classList.toggle('on', key === 'normal');
    b.addEventListener('click', () => {
      btns.forEach((x) => x.classList.toggle('on', x === b));
      shared.uMode.value = MODE_ID[key];
      showInfo(m.name, m.desc, m.legend);
    });
    btns.push(b);
    modesEl.appendChild(b);
  }

  // 分界线
  for (const L of geoLines.entries) {
    const { el, input } = switchRow({ label: L.name.replace(/\(示意\)/, ''), color: L.color, checked: L.on, title: L.name });
    input.addEventListener('change', () => {
      L.setVisible(input.checked);
      if (input.checked) showInfo(L.name, L.desc, null, L.color);
    });
    $('lines').appendChild(el);
  }

  // 地名类别
  for (const [key, t] of Object.entries(TYPE_META)) {
    const { el, input } = switchRow({ label: t.label, color: t.color, checked: labels.isTypeOn(key) });
    input.addEventListener('change', () => {
      labels.setTypeOn(key, input.checked);
      if (input.checked) showInfo(t.label, TYPE_INFO[key], null, t.color);
    });
    $('types').appendChild(el);
  }
}
