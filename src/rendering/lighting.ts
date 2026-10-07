import * as THREE from "three";

export type SofcodLightType = "ambient" | "directional" | "point" | "spot" | "hemisphere";

export interface SofcodLightDesc {
  id: string;
  type: SofcodLightType;
  color: string;
  intensity: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
  castShadow?: boolean;
}

export function createSofcodLight(desc: SofcodLightDesc): THREE.Light {
  switch (desc.type) {
    case "ambient":
      return new THREE.AmbientLight(desc.color, desc.intensity);
    case "directional":
      return new THREE.DirectionalLight(desc.color, desc.intensity);
    case "point":
      return new THREE.PointLight(desc.color, desc.intensity, desc.distance ?? 0, desc.decay ?? 2);
    case "spot":
      return new THREE.SpotLight(
        desc.color,
        desc.intensity,
        desc.distance ?? 0,
        desc.angle ?? Math.PI / 6,
        desc.penumbra ?? 0,
        desc.decay ?? 2,
      );
    case "hemisphere":
      return new THREE.HemisphereLight(desc.color, "#22252b", desc.intensity);
  }
}

export function applySofcodLightTransform(light: THREE.Light, desc: SofcodLightDesc) {
  light.position.set(...desc.position);
  if (desc.rotation) light.rotation.set(...desc.rotation);
  light.castShadow = Boolean(desc.castShadow);
}
