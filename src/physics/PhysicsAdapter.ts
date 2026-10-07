import type {
  PhysicsBackendId,
  PhysicsSettings,
  RigidBodyDesc,
  SoftBodyDesc,
  ClothDesc,
  ConstraintDesc,
  SimulationState,
} from "./types";

export interface PhysicsWorld {
  readonly backend: PhysicsBackendId;
  readonly settings: PhysicsSettings;

  addRigidBody(desc: RigidBodyDesc): void;
  addSoftBody(desc: SoftBodyDesc): void;
  addCloth(desc: ClothDesc): void;
  addConstraint(desc: ConstraintDesc): void;

  step(dt: number): void;
  readState(): SimulationState;
  reset(): void;
  dispose(): void;
}

export interface PhysicsAdapter {
  readonly id: PhysicsBackendId;
  readonly displayName: string;

  createWorld(settings: PhysicsSettings): PhysicsWorld;
  isSupported(): boolean;
}
