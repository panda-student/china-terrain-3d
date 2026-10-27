import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { INITIAL_VIEW } from '../config.js';

// 舞台:渲染器、场景、相机与地图式操作(左键平移 / 右键旋转 / 滚轮向光标缩放)
export function createStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x0a0f18);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.03, 1000);
  camera.position.set(...INITIAL_VIEW.pos); // 偏低的南向视角,便于看出西高东低的阶梯

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE };
  controls.screenSpacePanning = false; // 沿地面平移,不会越拖越飘
  controls.zoomToCursor = true;
  controls.minDistance = 0.2;
  controls.maxDistance = 250;
  controls.panSpeed = 1.2;
  controls.rotateSpeed = 0.7;

  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  return { renderer, scene, camera, controls };
}
