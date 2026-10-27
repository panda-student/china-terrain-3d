// 资源:基础 DEM(ETOPO 2022 1′)与省界 GeoJSON,均来自 data/ 目录(由 vite 原样提供)
export async function loadData() {
  const [meta, buf, prov] = await Promise.all([
    fetch('/dem.json').then((r) => r.json()),
    fetch('/dem.bin').then((r) => r.arrayBuffer()),
    fetch('/china_provinces_datav.json').then((r) => r.json()),
  ]);
  return { meta, dem: new Int16Array(buf), prov };
}
