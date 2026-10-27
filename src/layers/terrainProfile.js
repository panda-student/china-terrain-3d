import * as THREE from 'three';
import { dummyPositions } from '../geometry/terrainMesh.js';

// 剖面:三维里一条沿纬线的黄线 + 底部卡片里的二维剖面图(画布)
export function addTerrainProfile({ scene, meta, demF, lineMat, canvas, titleEl, wrapEl }) {
  const w = meta.width, h = meta.height;
  const ctx = canvas.getContext('2d');
  let curLat = 35, visible = false;

  const pts = Math.floor((w - 1) / 2) + 1;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', dummyPositions(pts));
  geo.setAttribute('aTexel', new THREE.BufferAttribute(new Float32Array(pts * 2), 2));
  const line = new THREE.Line(geo, lineMat(0xffd54a, 0.04));
  line.frustumCulled = false;
  line.visible = false;
  scene.add(line);

  // 按画布实际显示尺寸绘制(CSS 像素坐标),避免拉伸变形
  function drawChart() {
    if (!visible) return;
    const dpr = Math.min(devicePixelRatio, 2);
    const W = canvas.clientWidth, H = canvas.clientHeight;
    if (!W || !H) return;
    if (canvas.width !== Math.round(W * dpr)) { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const row = Math.round(((meta.north - curLat) / (meta.north - meta.south)) * (h - 1));
    const padL = 52, padR = 6, padB = 18, padT = 6;
    const plotW = W - padL - padR, plotH = H - padB - padT;
    const eMin = -6000, eMax = 9000;
    const yOf = (e) => padT + (1 - (Math.max(eMin, Math.min(eMax, e)) - eMin) / (eMax - eMin)) * plotH;
    const elevAtPx = (px) => demF[row * w + Math.round((px / plotW) * (w - 1))];
    ctx.clearRect(0, 0, W, H);

    // 网格与刻度
    ctx.font = '11px "Microsoft YaHei UI", sans-serif';
    ctx.fillStyle = '#637184';
    ctx.textAlign = 'right';
    for (const e of [-4000, 0, 4000, 8000]) {
      const y = yOf(e);
      ctx.strokeStyle = e === 0 ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.06)';
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillText(`${e} m`, padL - 6, y + 4);
    }
    ctx.textAlign = 'center';
    for (let lon = 80; lon <= 130; lon += 10) {
      ctx.fillText(`${lon}°E`, padL + ((lon - meta.west) / (meta.east - meta.west)) * plotW, H - 4);
    }

    // 陆地 / 海底填充
    const y0 = yOf(0);
    const fill = (clampFn, color) => {
      ctx.beginPath(); ctx.moveTo(padL, y0);
      for (let px = 0; px <= plotW; px++) ctx.lineTo(padL + px, yOf(clampFn(elevAtPx(px))));
      ctx.lineTo(padL + plotW, y0); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
    };
    fill((e) => Math.max(0, e), 'rgba(214,170,104,.35)');
    fill((e) => Math.min(0, e), 'rgba(78,161,255,.30)');

    // 轮廓
    ctx.beginPath();
    for (let px = 0; px <= plotW; px++) {
      const y = yOf(elevAtPx(px));
      px === 0 ? ctx.moveTo(padL, y) : ctx.lineTo(padL + px, y);
    }
    ctx.strokeStyle = '#ffd54a'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'; ctx.stroke();
  }

  addEventListener('resize', drawChart);

  return {
    setVisible(v) {
      visible = v;
      line.visible = v;
      wrapEl.classList.toggle('on', v);
      drawChart();
    },
    setLat(lat) {
      curLat = lat;
      const row = ((meta.north - lat) / (meta.north - meta.south)) * (h - 1);
      const a = geo.getAttribute('aTexel');
      for (let i = 0; i < pts; i++) {
        a.array[i * 2] = Math.min(i * 2, w - 1);
        a.array[i * 2 + 1] = row;
      }
      a.needsUpdate = true;
      titleEl.innerHTML = `沿 ${lat.toFixed(1)}°N 的地形剖面<small>垂直方向未夸张</small>`;
      drawChart();
    },
  };
}
