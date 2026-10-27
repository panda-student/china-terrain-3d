import * as THREE from 'three';

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// 相机平滑飞行:在"以目标点为中心的球坐标"里插值,转向时不会穿过地面
// 用户一按鼠标/滚轮(controls 的 start 事件)就中断飞行
export function createCameraFly(camera, controls) {
  const s0 = new THREE.Spherical(), s1 = new THREE.Spherical();
  const t0 = new THREE.Vector3(), t1 = new THREE.Vector3(), off = new THREE.Vector3();
  let anim = null;
  controls.addEventListener('start', () => (anim = null));

  const current = () => new THREE.Spherical().setFromVector3(off.subVectors(camera.position, controls.target));

  function start(target, sph, ms) {
    t0.copy(controls.target);
    s0.copy(current());
    t1.copy(target);
    s1.copy(sph);
    s1.radius = Math.min(controls.maxDistance, Math.max(controls.minDistance, s1.radius));
    s1.phi = Math.min(controls.maxPolarAngle, Math.max(0.001, s1.phi));
    s1.theta = s0.theta + wrapAngle(s1.theta - s0.theta); // 走近的那一边
    anim = { start: performance.now(), ms };
  }

  return {
    // 飞到指定相机位置与目标点
    to(pos, target, ms = 900) {
      const t = new THREE.Vector3(...target);
      start(t, new THREE.Spherical().setFromVector3(new THREE.Vector3(...pos).sub(t)), ms);
    },
    // 绕目标点的绝对视角:距离、俯仰角、方位角(弧度)
    look({ target, radius, phi, theta }, ms = 1200) {
      start(target.clone(), new THREE.Spherical(radius, phi, theta), ms);
    },
    // 相对当前视角:缩放距离、改方位角/俯仰角、换目标点
    orbit({ scale = 1, theta, phi, target } = {}, ms = 600) {
      const c = current();
      start(target ? target.clone() : controls.target.clone(),
        new THREE.Spherical(c.radius * scale, phi ?? c.phi, theta ?? c.theta), ms);
    },
    update(now) {
      if (!anim) return;
      const k = ease(Math.min(1, (now - anim.start) / anim.ms));
      controls.target.lerpVectors(t0, t1, k);
      const r = Math.exp(Math.log(s0.radius) + (Math.log(s1.radius) - Math.log(s0.radius)) * k);
      off.setFromSphericalCoords(r, s0.phi + (s1.phi - s0.phi) * k, s0.theta + (s1.theta - s0.theta) * k);
      camera.position.copy(controls.target).add(off);
      if (k >= 1) anim = null;
    },
  };
}
