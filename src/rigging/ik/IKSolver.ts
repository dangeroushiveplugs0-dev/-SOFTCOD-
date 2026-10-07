import * as THREE from "three";
import type { IKChainDefinition, IKChainState, IKRestState } from "./types";
import { getIKMaxStretchRatio } from "./types";

export type IKBoneLike = {
  id: string;
  object: THREE.Object3D;
  length: number;
};

function worldPosition(object: THREE.Object3D): THREE.Vector3 {
  return object.getWorldPosition(new THREE.Vector3());
}

function rotateBoneToward(bone: THREE.Object3D, desiredWorldDirection: THREE.Vector3, weight: number): void {
  const direction = desiredWorldDirection.clone().normalize();
  if (direction.lengthSq() < 1e-8) return;

  const parent = bone.parent;
  const parentQuaternion = parent
    ? parent.getWorldQuaternion(new THREE.Quaternion())
    : new THREE.Quaternion();

  const currentWorldQuaternion = bone.getWorldQuaternion(new THREE.Quaternion());
  const currentAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(currentWorldQuaternion).normalize();
  const delta = new THREE.Quaternion().setFromUnitVectors(currentAxis, direction);
  const desiredWorldQuaternion = delta.multiply(currentWorldQuaternion);
  const desiredLocalQuaternion = parentQuaternion.clone().invert().multiply(desiredWorldQuaternion);

  bone.quaternion.slerp(desiredLocalQuaternion, THREE.MathUtils.clamp(weight, 0, 1));
}

export class IKSolver {
  buildState(chain: IKChainDefinition, bones: IKBoneLike[]): IKChainState {
    const rest: IKRestState[] = bones.map((bone, index) => {
      const next = bones[index + 1];
      const start = worldPosition(bone.object);
      const end = next ? worldPosition(next.object) : start.clone().add(
        new THREE.Vector3(0, bone.length, 0).applyQuaternion(bone.object.getWorldQuaternion(new THREE.Quaternion()))
      );
      return {
        boneId: bone.id,
        restLength: Math.max(0.0001, bone.length || start.distanceTo(end)),
        restDirection: end.sub(start).normalize(),
      };
    });

    return {
      chain,
      rest,
      currentLengths: rest.map((item) => item.restLength),
      stretchAmount: 0,
      solved: false,
      restScales: bones.map((bone) => bone.object.scale.clone()),
    };
  }

  solve(state: IKChainState, bones: IKBoneLike[], target: THREE.Vector3, weight = state.chain.weight): IKChainState {
    if (bones.length === 0) return state;

    const root = worldPosition(bones[0].object);
    const totalRestLength = state.rest.reduce((sum, item) => sum + item.restLength, 0);
    const distance = root.distanceTo(target);
    const maxRatio = Math.max(1, state.chain.maxStretchRatio || getIKMaxStretchRatio(state.chain.mode));
    const allowedLength = totalRestLength * maxRatio;

    const effectiveTarget = target.clone();
    if (distance > allowedLength) {
      effectiveTarget.sub(root).setLength(allowedLength).add(root);
    }

    const ratio = totalRestLength > 0
      ? Math.min(maxRatio, Math.max(1, distance / totalRestLength))
      : 1;

    const segmentLength = state.rest.map((item) => item.restLength * ratio);
    const points = bones.map((bone) => worldPosition(bone.object));

    if (points.length === 1) {
      points[0].lerp(effectiveTarget, weight);
      state.currentLengths = [];
      state.stretchAmount = ratio - 1;
      state.solved = true;
      return state;
    }

    // FABRIK computes the desired joint positions. We then convert those
    // positions into bone rotations instead of moving the skeleton's joints,
    // which keeps authored bone origins stable.
    for (let iteration = 0; iteration < 8; iteration += 1) {
      points[points.length - 1].copy(effectiveTarget);

      for (let i = points.length - 2; i >= 0; i -= 1) {
        const length = segmentLength[Math.min(i, segmentLength.length - 1)];
        const direction = points[i].clone().sub(points[i + 1]).normalize();
        points[i].copy(points[i + 1]).add(direction.multiplyScalar(length));
      }

      points[0].copy(root);

      for (let i = 1; i < points.length; i += 1) {
        const length = segmentLength[Math.min(i - 1, segmentLength.length - 1)];
        const direction = points[i].clone().sub(points[i - 1]).normalize();
        points[i].copy(points[i - 1]).add(direction.multiplyScalar(length));
      }

      if (points[points.length - 1].distanceTo(effectiveTarget) < 0.0005) break;
    }

    for (let i = 0; i < bones.length; i += 1) {
      const end = i < points.length - 1
        ? points[i + 1]
        : effectiveTarget;
      const start = points[i];
      rotateBoneToward(bones[i].object, end.clone().sub(start), weight);

      const baseScale = state.restScales[i];
      bones[i].object.scale.copy(baseScale);

      if (state.chain.mode === "stylized") {
        // Most authored character bones point down local +Y. Stretch that
        // axis only, preserving the other two dimensions.
        bones[i].object.scale.y = baseScale.y * ratio;
      }
    }

    state.currentLengths = segmentLength;
    state.stretchAmount = ratio - 1;
    state.solved = true;
    return state;
  }
}
