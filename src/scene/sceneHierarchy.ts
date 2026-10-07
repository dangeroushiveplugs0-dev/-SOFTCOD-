import * as THREE from "three";

export interface SofcodHierarchyNode {
  object: THREE.Object3D;
  depth: number;
}

export function buildSceneHierarchy(root: THREE.Object3D): SofcodHierarchyNode[] {
  const nodes: SofcodHierarchyNode[] = [];
  root.traverse((object) => {
    let depth = 0;
    let parent = object.parent;
    while (parent && parent !== root.parent) {
      depth++;
      parent = parent.parent;
    }
    nodes.push({ object, depth });
  });
  return nodes;
}

export function getDisplayName(object: THREE.Object3D): string {
  return object.name || object.type || "Object";
}
