export type AnimationCameraKeyframe = {
  frame: number;
  position: [number, number, number];
  quaternion: [number, number, number, number];
  fov: number;
};

export type AnimationCameraTrack = {
  id: string;
  name: string;
  fps: number;
  keyframes: AnimationCameraKeyframe[];
};

export const DEFAULT_ANIMATION_CAMERA_FOV = 45;
