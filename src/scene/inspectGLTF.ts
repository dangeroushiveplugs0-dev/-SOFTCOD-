import * as THREE from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

export interface SofcodAssetInspection {
  objectCount: number;
  meshCount: number;
  skinnedMeshCount: number;
  boneCount: number;
  materialCount: number;
  morphTargetMeshCount: number;
  morphTargetCount: number;
  animationCount: number;
  animations: string[];
}

export function inspectGLTF(gltf: GLTF): SofcodAssetInspection {
  const materials = new Set<THREE.Material>();
  let objectCount = 0;
  let meshCount = 0;
  let skinnedMeshCount = 0;
  let boneCount = 0;
  let morphTargetMeshCount = 0;
  let morphTargetCount = 0;

  gltf.scene.traverse((object) => {
    objectCount++;
    if (object instanceof THREE.Bone) boneCount++;
    if (object instanceof THREE.Mesh) {
      meshCount++;
      if (object instanceof THREE.SkinnedMesh) skinnedMeshCount++;
      const material = object.material;
      if (Array.isArray(material)) material.forEach((item) => materials.add(item));
      else if (material) materials.add(material);

      const morph = object.morphTargetDictionary;
      if (morph) {
        morphTargetMeshCount++;
        morphTargetCount += Object.keys(morph).length;
      }
    }
  });

  return {
    objectCount,
    meshCount,
    skinnedMeshCount,
    boneCount,
    materialCount: materials.size,
    morphTargetMeshCount,
    morphTargetCount,
    animationCount: gltf.animations.length,
    animations: gltf.animations.map((clip) => clip.name || "Unnamed animation"),
  };
}
