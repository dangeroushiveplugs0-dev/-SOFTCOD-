import * as THREE from "three";

export interface CullingResult { visible: boolean; distance: number; }

export function getSceneBounds(root: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  box.setFromObject(root);
  return box;
}

export function testSceneVisibility(root: THREE.Object3D, camera: THREE.Camera): CullingResult {
  const box = getSceneBounds(root);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const distance = sphere.center.distanceTo(camera.position);
  const frustum = new THREE.Frustum().setFromProjectionMatrix(
    new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
  );
  return { visible: frustum.intersectsSphere(sphere), distance };
}
