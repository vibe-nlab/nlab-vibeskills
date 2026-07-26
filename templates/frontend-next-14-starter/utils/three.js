import * as THREE from "three";

export const toWorld = (x, y, z, camera) => {
  const vec = new THREE.Vector3();
  const pos = new THREE.Vector3();

  vec.set(
    (x / window.innerWidth) * 2 - 1,
    -(y / window.innerHeight) * 2 + 1,
    0.5
  );

  vec.unproject(camera);
  vec.sub(camera.position).normalize();

  var distance = (z - camera.position.z) / vec.z;

  pos.copy(camera.position).add(vec.multiplyScalar(distance));

  return pos;
};

export const toScreen = (obj, camera) => {
  var p = new THREE.Vector3().copy(obj.position);
  var vector = p.project(camera);

  vector.x = ((vector.x + 1) / 2) * window.innerWidth;
  vector.y = (-(vector.y - 1) / 2) * window.innerHeight;

  return vector;
};

export const calcPosition = (scroll, originalPos, whole, offset) => {
  return ((((scroll + originalPos) % whole) + whole + offset) % whole) - offset;
};

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export const roundToStep = (num, step) => {
  return Math.round(num / step) * step;
};

export const clearScene = (scene) => {
  scene.traverse((o) => {
    if (o.geometry) {
      o.geometry.dispose();
      o.material.emissiveMap?.dispose();
      o.material.dispose();
    }
  });
  scene?.clear();
};
