import * as THREE from "three";

export type IKMode = "human" | "stylized";

export type IKChainDefinition = {
  id: string;
  name: string;
  boneIds: string[];
  targetBoneId?: string;
  targetPosition?: [number, number, number];
  polePosition?: [number, number, number];
  mode: IKMode;
  weight: number;
  maxStretchRatio: number;
};

export type IKRestState = {
  boneId: string;
  restLength: number;
  restDirection: THREE.Vector3;
};

export type IKChainState = {
  chain: IKChainDefinition;
  rest: IKRestState[];
  currentLengths: number[];
  stretchAmount: number;
  solved: boolean;
};

export type SecondaryMotionSettings = {
  enabled: boolean;
  stiffness: number;
  damping: number;
  inertia: number;
  returnSpeed: number;
  impactRipple: number;
  maxDisplacement: number;
};

export const HUMAN_IK_DEFAULTS: SecondaryMotionSettings = {
  enabled: true,
  stiffness: 18,
  damping: 8,
  inertia: 0.12,
  returnSpeed: 14,
  impactRipple: 0.15,
  maxDisplacement: 0.08,
};

export const STYLIZED_IK_DEFAULTS: SecondaryMotionSettings = {
  enabled: true,
  stiffness: 14,
  damping: 5,
  inertia: 0.28,
  returnSpeed: 10,
  impactRipple: 0.25,
  maxDisplacement: 0.2,
};

export function getIKMaxStretchRatio(mode: IKMode): number {
  return mode === "human" ? 1 : 1.15;
}
