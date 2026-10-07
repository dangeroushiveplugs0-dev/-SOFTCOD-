import type { MediaTrack } from "../media/types";
import type {
  PhysicsSettings,
  RigidBodyDesc,
  SoftBodyDesc,
  ClothDesc,
  ConstraintDesc,
} from "../physics/types";

export interface SofcodScene {
  id: string;
  name: string;

  // Editable scene data.
  meshes: string[];
  materials: string[];
  skeletons: string[];
  animationClips: string[];
  morphTargets: string[];
  outfits: string[];

  // Solver-independent physics description.
  physics: {
    settings: PhysicsSettings;
    rigidBodies: RigidBodyDesc[];
    softBodies: SoftBodyDesc[];
    cloth: ClothDesc[];
    constraints: ConstraintDesc[];
  };

  // Baked simulation and rendered media references.
  simulationCacheIds: string[];
  mediaTracks: MediaTrack[];
}
