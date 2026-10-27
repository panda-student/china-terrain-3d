// 全局常量与默认参数:想调参数先看这里
export const STEP = 3; // 底图网格每隔几个高程像素取一个点
export const KM_PER_DEG = 111000; // 1° 纬度对应的米数;高度 = 米 * 夸张 / KM_PER_DEG,夸张 ×1 即真实比例

export const DEFAULT_EXAGGERATION = { land: 30, sea: 10 }; // 需与 index.html 滑块初始值一致
export const INITIAL_VIEW = { pos: [-6, 20, 60], target: [0, 0, 0] };

// 细节图层(拉近后按需加载的高精度瓦片)
export const DETAIL = {
  TX: 9, TY: 6, // 一块细节图覆盖的瓦片数(宽×高)
  MIN_Z: 7, MAX_Z: 8, // 本地已下载的瓦片级别范围(见 scripts/fetch-tiles.mjs)
  NEAR_DIST: 24, // 相机离目标点小于该值才启用
  MESH_STEP: 3, // 细节网格取点间隔(瓦片像素)
  TICK_MS: 150, // 视野检查间隔
};
