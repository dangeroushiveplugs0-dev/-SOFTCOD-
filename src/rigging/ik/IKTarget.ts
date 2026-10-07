import * as THREE from "three";

export type IKTargetKind = "target" | "pole";

export class IKTarget {
  readonly object: THREE.Object3D;
  readonly kind: IKTargetKind;

  constructor(kind: IKTargetKind, name = kind === "pole" ? "IK Pole" : "IK Target") {
    this.kind = kind;
    this.object = new THREE.Object3D();
    this.object.name = name;
  }

  setPosition(position: THREE.Vector3): void {
    this.object.position.copy(position);
  }
}
