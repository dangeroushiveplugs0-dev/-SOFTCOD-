import * as THREE from "three";
import type { SecondaryMotionSettings } from "./types";

export type SecondaryMotionState = {
  displacement: THREE.Vector3;
  velocity: THREE.Vector3;
};

export class SecondaryMotionSolver {
  private readonly states = new Map<string, SecondaryMotionState>();

  getState(id: string): SecondaryMotionState {
    let state = this.states.get(id);
    if (!state) {
      state = { displacement: new THREE.Vector3(), velocity: new THREE.Vector3() };
      this.states.set(id, state);
    }
    return state;
  }

  reset(id: string): void {
    this.states.delete(id);
  }

  clear(): void {
    this.states.clear();
  }

  step(id: string, delta: number, settings: SecondaryMotionSettings, targetDisplacement = new THREE.Vector3(), impact = 0): THREE.Vector3 {
    const state = this.getState(id);
    const dt = Math.min(0.05, Math.max(0, delta));
    const inertiaTarget = targetDisplacement.clone().multiplyScalar(settings.inertia);

    const ripple = Math.max(0, impact) * settings.impactRipple;
    if (state.velocity.lengthSq() > 0.000001) {
      inertiaTarget.addScaledVector(state.velocity.clone().normalize(), ripple);
    }

    const spring = inertiaTarget.clone().sub(state.displacement).multiplyScalar(settings.stiffness);
    const damping = state.velocity.clone().multiplyScalar(settings.damping);

    state.velocity.addScaledVector(spring.sub(damping), dt);
    state.displacement.addScaledVector(state.velocity, dt);

    const limit = Math.max(0, settings.maxDisplacement);
    if (state.displacement.length() > limit) state.displacement.setLength(limit);

    state.velocity.addScaledVector(
      state.displacement.clone().negate(),
      settings.returnSpeed * dt,
    );

    return state.displacement.clone();
  }
}
