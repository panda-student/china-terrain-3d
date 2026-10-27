import { defineConfig } from 'vite';

// data/ 下的文件(DEM、边界、瓦片)原样对外提供,URL 即 /dem.json、/tiles/...
export default defineConfig({ publicDir: 'data' });
