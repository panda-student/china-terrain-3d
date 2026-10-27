// 一次性下载 Terrarium 高程瓦片到 data/tiles,之后页面完全离线运行
import fs from 'node:fs/promises';
import path from 'node:path';
const meta = JSON.parse(await fs.readFile('data/dem.json', 'utf8'));
const Z = process.argv.slice(2).map(Number);
const merc = (lat) => { const r = lat * Math.PI / 180; return (1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2; };
const jobs = [];
for (const z of Z) {
  const n = 2 ** z;
  const x0 = Math.floor((meta.west + 180) / 360 * n), x1 = Math.floor((meta.east + 180) / 360 * n);
  const y0 = Math.floor(merc(meta.north) * n), y1 = Math.floor(merc(meta.south) * n);
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) jobs.push([z, x, y]);
}
console.log('tiles', jobs.length);
let done = 0, fail = 0, i = 0;
async function worker() {
  while (i < jobs.length) {
    const [z, x, y] = jobs[i++];
    const f = `data/tiles/${z}/${x}/${y}.png`;
    try { await fs.access(f); done++; continue; } catch {}
    for (let t = 0; t < 4; t++) {
      try {
        const r = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`);
        if (!r.ok) throw new Error(r.status);
        await fs.mkdir(path.dirname(f), { recursive: true });
        await fs.writeFile(f, Buffer.from(await r.arrayBuffer()));
        done++; break;
      } catch (e) { if (t === 3) { fail++; console.log('fail', z, x, y, e.message); } }
    }
    if (done % 200 === 0) console.log(done, '/', jobs.length);
  }
}
await Promise.all(Array.from({ length: 16 }, worker));
console.log('done', done, 'fail', fail);
