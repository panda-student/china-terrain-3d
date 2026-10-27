import * as THREE from 'three';
import { dummyPositions } from './terrainMesh.js';

function lonLatToTexel(lon, lat, m) {
  return [
    ((lon - m.west) / (m.east - m.west)) * (m.width - 1),
    ((m.north - lat) / (m.north - m.south)) * (m.height - 1),
  ];
}

export function buildProvinceLines(prov, m) {
  const t = [];
  const addLine = (coords) => {
    for (let i = 0; i < coords.length - 1; i++) {
      t.push(...lonLatToTexel(coords[i][0], coords[i][1], m));
      t.push(...lonLatToTexel(coords[i + 1][0], coords[i + 1][1], m));
    }
  };
  for (const f of prov.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Polygon') g.coordinates.forEach(addLine);
    else if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => p.forEach(addLine));
    else if (g.type === 'LineString') addLine(g.coordinates);
    else if (g.type === 'MultiLineString') g.coordinates.forEach(addLine);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', dummyPositions(t.length / 2));
  geo.setAttribute('aTexel', new THREE.BufferAttribute(new Float32Array(t), 2));
  return geo;
}
