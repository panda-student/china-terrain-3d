// 入口:只负责按顺序组装各模块并驱动每帧循环。具体职责见各目录:
//   io/        取资源(DEM、省界)
//   geo/       坐标系、墨卡托、CPU 高程查询、屏幕拾取
//   shaders/   GLSL      geometry/  网格构造
//   scene/     舞台、共用 uniform、相机飞行
//   layers/    各三维图层(底图、细节、省界、剖面、分界线、海水、地名)
//   ui/        面板、地图控件、状态栏、信息卡片、帮助
import { loadData } from './io/loadData.js';
import { createFrame } from './geo/frame.js';
import { createElevation } from './geo/elevation.js';
import { createPicker } from './geo/picker.js';
import { createStage } from './scene/stage.js';
import { createUniforms } from './scene/uniforms.js';
import { createCameraFly } from './scene/cameraFly.js';
import { addBaseTerrain } from './layers/baseTerrain.js';
import { createDetailLayer } from './layers/detail/detailLayer.js';
import { createLineMaterialFactory } from './layers/lineMaterial.js';
import { addProvinceBorders } from './layers/provinceBorders.js';
import { addTerrainProfile } from './layers/terrainProfile.js';
import { addSeaWater } from './layers/seaWater.js';
import { addGeoLines } from './layers/geoLines.js';
import { createPlaceLabels } from './layers/placeLabels.js';
import { $ } from './ui/dom.js';
import { createInfoCard } from './ui/infoCard.js';
import { createPanelShell } from './ui/panelShell.js';
import { createControlPanel } from './ui/controlPanel.js';
import { createConceptPanels } from './ui/conceptPanels.js';
import { createMapControls } from './ui/mapControls.js';
import { createPointerActions } from './ui/pointerActions.js';
import { createStatusBar } from './ui/statusBar.js';
import { createHelp } from './ui/help.js';
import { createViewMenu } from './ui/viewMenu.js';

async function main() {
  const { meta, dem, prov } = await loadData();
  const demF = new Float32Array(dem);
  const frame = createFrame(meta);

  const { renderer, scene, camera, controls } = createStage($('app'));
  const dom = renderer.domElement;
  const fly = createCameraFly(camera, controls);
  const shared = createUniforms(meta, demF, frame);
  const { sampleElev, heightAt } = createElevation(meta, demF, shared);
  const pick = createPicker({ camera, dom, frame, meta, heightAt, sampleElev });
  const lineMat = createLineMaterialFactory(shared);

  // 三维图层
  addBaseTerrain(scene, meta, shared);
  const detail = createDetailLayer({
    scene, camera, controls, meta, shared, frame,
    onStatus: (text) => ($('detail').textContent = text),
  });
  const provinces = addProvinceBorders(scene, prov, meta, lineMat);
  const profile = addTerrainProfile({
    scene, meta, demF, lineMat, canvas: $('chart'), titleEl: $('chart-title'), wrapEl: $('chart-wrap'),
  });
  const water = addSeaWater(scene, meta, frame.kx);
  const geoLines = addGeoLines({ scene, shared, heightAt, frame });

  // 界面
  const showInfo = createInfoCard($('info'));
  const labels = createPlaceLabels({
    container: $('labels'), camera, prov, heightAt, frame,
    onSelect: (title, desc, color) => showInfo(title, desc, null, color),
  });
  createPanelShell();
  const panel = createControlPanel({
    onLat: profile.setLat,
    onProvinces: provinces.setVisible,
    onProfile: profile.setVisible,
    onWater: water.setVisible,
  });
  createConceptPanels({ shared, geoLines, labels, showInfo });
  const views = createViewMenu({ dom, controls, fly, frame, heightAt, showInfo, setExaggeration: panel.setExaggeration });
  const mapCtl = createMapControls({ controls, fly, onHome: () => views.go(0) }); // 复位 = 第一个预设(全国全景)
  const status = createStatusBar({ dom, pick });
  createPointerActions({ dom, pick, fly });
  createHelp({ dom });
  const loading = $('loading');
  loading.style.opacity = 0;
  setTimeout(() => loading.remove(), 500);

  renderer.setAnimationLoop((now) => {
    fly.update(now);
    controls.update();
    // 拉近时可选自动降低夸张倍数,避免高精度数据出现尖刺
    const dist = camera.position.distanceTo(controls.target);
    const k = panel.autoAttenuate() ? Math.min(1, Math.max(0.15, dist / 30)) : 1;
    shared.uLand.value = panel.land() * k;
    shared.uSea.value = panel.sea() * k;
    geoLines.refresh();
    labels.update(dist);
    detail.update(now);
    mapCtl.update();
    status.update();
    renderer.render(scene, camera);
  });
}

main().catch((e) => {
  console.error(e);
  $('loading').textContent = '加载失败:' + e.message;
});
