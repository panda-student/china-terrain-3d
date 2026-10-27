# 中国三维地势

渲染一张可自由漫游的中国(含海域)三维地形图,全离线运行。

```bash
npm run dev        # 启动 http://127.0.0.1:5173
npm run convert    # 从 scripts/raw 的 NetCDF 重新生成 data/dem.bin(一般不用)
node scripts/fetch-tiles.mjs 7 8   # 一次性下载细节瓦片到 data/tiles(想更精细可加 9)
```

## 渲染需要的资源

| 资源 | 位置 | 用途 |
|---|---|---|
| 基础高程 DEM(ETOPO 2022 1′,Int16) | `data/dem.bin` + `dem.json` | 整张地形底图 |
| 细节瓦片(Terrarium PNG,z7/z8) | `data/tiles/{z}/{x}/{y}.png` | 拉近后的高精度细节 |
| 省界 GeoJSON | `data/china_provinces_datav.json` | 省界线、省名标注 |
| 概念数据(阶梯、分界线、地名文案) | `src/features.js` | 概念图层与标注 |

`data/` 在 vite 里配置为 `publicDir`,文件按原路径对外提供(`/dem.bin`、`/tiles/...`)。
`scripts/` 是一次性的数据准备工具,`scripts/raw/` 放它们的原始输入。

## 需要的动作 → 对应模块

| 动作 | 模块 |
|---|---|
| 读取 DEM、省界 | `src/io/loadData.js` |
| 经纬度 ↔ 世界坐标、墨卡托换算 | `src/geo/frame.js`、`geo/mercator.js` |
| CPU 端查高程(地名/分界线贴地) | `src/geo/elevation.js` |
| 屏幕点 → 经纬度/海拔(悬停读数、双击定位) | `src/geo/picker.js` |
| 渲染器、相机、地图式操作 | `src/scene/stage.js` |
| 相机平滑飞行(缩放、回正北、2D/3D、复位) | `src/scene/cameraFly.js` |
| 着色器共用参数(夸张、底色模式、细节范围) | `src/scene/uniforms.js` |
| GLSL 代码 | `src/shaders/*.js` |
| 网格构造 | `src/geometry/*.js` |
| 底图地形 + 沙盘侧壁 | `src/layers/baseTerrain.js` |
| 细节图层(瓦片解码、视野→级别、拼图、挖洞) | `src/layers/detail/`(`tileLoader` / `viewBounds` / `detailLayer`) |
| 省界线 / 剖面 / 海水 / 分界线 / 地名 | `src/layers/` 下同名文件 |
| DOM 小工具(开关行、滑块填充) | `src/ui/dom.js` |
| 面板外壳(折叠、标签页)/ 地形与图层控件 / 底色与地名分类 | `src/ui/panelShell.js`、`controlPanel.js`、`conceptPanels.js` |
| 右下角地图按钮(缩放、指南针、2D/3D、复位) | `src/ui/mapControls.js` |
| 预设视角数据(地点、距离、俯仰、朝向、推荐夸张倍数) | `src/presetViews.js` |
| 预设视角菜单与数字键 1–9 | `src/ui/viewMenu.js` |
| 拖拽光标、双击飞到该处 | `src/ui/pointerActions.js` |
| 底部状态栏(经纬度、海拔) | `src/ui/statusBar.js` |
| 信息卡片 / 操作说明 | `src/ui/infoCard.js`、`help.js` |
| 组装与每帧循环 | `src/main.js`(只做拼装,不写业务) |

改动指引:调参数改 `config.js`;改配色/光照只动 `shaders/terrain.js`;改某个图层只动 `layers/` 里对应文件;加新概念图层改 `features.js` 的数据即可;加/改预设视角只改 `presetViews.js`。

## 许可

代码以 MIT 协议开源。数据来源:NOAA ETOPO 2022(公有领域)、Terrarium 高程瓦片(Mapzen/AWS Open Data)、省界来自 DataV.GeoAtlas,各数据版权归原提供方,仅供学习演示。
