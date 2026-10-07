import type * as THREE from "three";

export class AssetCache {
  private readonly entries = new Map<string, THREE.Object3D>();

  get<T extends THREE.Object3D = THREE.Object3D>(key: string): T | undefined {
    return this.entries.get(key) as T | undefined;
  }

  set(key: string, root: THREE.Object3D): void {
    this.entries.set(key, root);
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  remove(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}

export const globalAssetCache = new AssetCache();
