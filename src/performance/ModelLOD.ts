import * as THREE from "three";

export type ModelLODLevel = {
  object: THREE.Object3D;
  distance: number;
  hysteresis?: number;
};

export type ModelLODConfig = {
  enabled: boolean;
  levels: ModelLODLevel[];
};

export class ModelLOD {
  private readonly lod: THREE.LOD;

  constructor(config: ModelLODConfig) {
    this.lod = new THREE.LOD();
    for (const level of [...config.levels].sort((a, b) => a.distance - b.distance)) {
      this.lod.addLevel(level.object, level.distance, level.hysteresis ?? 0.1);
    }
    this.lod.autoUpdate = config.enabled;
  }

  get object() {
    return this.lod;
  }

  setEnabled(enabled: boolean) {
    this.lod.autoUpdate = enabled;
  }

  update(camera: THREE.Camera) {
    if (!this.lod.autoUpdate) this.lod.update(camera);
  }

  getCurrentLevel() {
    return this.lod.getCurrentLevel();
  }
}
