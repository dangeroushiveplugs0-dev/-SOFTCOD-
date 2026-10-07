export type PhysicsBackendId = "rapier" | "jolt" | "bullet" | string;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Transform {
  position: Vec3;
  rotation: Quat;
  scale: Vec3;
}

export interface ColliderDesc {
  id: string;
  shape: "box" | "sphere" | "capsule" | "cylinder" | "convex" | "trimesh";
  size: Vec3;
  isSensor?: boolean;
  friction?: number;
  restitution?: number;
}

export interface RigidBodyDesc {
  id: string;
  transform: Transform;
  mass: number;
  kinematic?: boolean;
  colliders: ColliderDesc[];
}

export interface SoftBodyDesc {
  id: string;
  sourceMeshId: string;
  simulationMeshId?: string;
  mass: number;
  particleRadius?: number;
  stiffness?: number;
  damping?: number;
  bendStiffness?: number;
  volumeStiffness?: number;
  collisionEnabled?: boolean;
}

export interface ClothDesc extends SoftBodyDesc {
  bendStiffness?: number;
  stretchStiffness?: number;
  shearStiffness?: number;
  pinVertexIndices?: number[];
}

export interface ConstraintDesc {
  id: string;
  type: "fixed" | "spring" | "distance" | "hinge" | "ball" | "generic";
  bodyA: string;
  bodyB?: string;
  stiffness?: number;
  damping?: number;
}

export interface PhysicsSettings {
  gravity: Vec3;
  timestep: number;
  substeps: number;
  solverIterations: number;
}

export interface SimulationState {
  frame: number;
  timeSeconds: number;
  rigidBodies: Record<string, Transform>;
  softBodyVertices: Record<string, Float32Array>;
}
