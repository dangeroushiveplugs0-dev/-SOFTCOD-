import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { DEFAULT_ANIMATION_CAMERA_FOV } from "../animation/AnimationCamera";

export type CameraViewMode = "editor" | "shot";

export function AnimationCameraRig({
  mode,
  syncFromEditor,
}: {
  mode: CameraViewMode;
  syncFromEditor: number;
}) {
  const { camera, set, size } = useThree();
  const editorCamera = useRef(camera);
  const shotCamera = useMemo(
    () => new THREE.PerspectiveCamera(DEFAULT_ANIMATION_CAMERA_FOV, 1, 0.01, 5000),
    [],
  );

  useEffect(() => {
    shotCamera.aspect = size.width / Math.max(1, size.height);
    shotCamera.updateProjectionMatrix();
  }, [shotCamera, size.width, size.height]);

  useEffect(() => {
    if (syncFromEditor < 0) return;
    shotCamera.position.copy(editorCamera.current.position);
    shotCamera.quaternion.copy(editorCamera.current.quaternion);
    shotCamera.fov = (editorCamera.current as THREE.PerspectiveCamera).fov ?? DEFAULT_ANIMATION_CAMERA_FOV;
    shotCamera.updateProjectionMatrix();
  }, [shotCamera, syncFromEditor]);

  useEffect(() => {
    if (mode === "shot") {
      set({ camera: shotCamera });
      return () => set({ camera: editorCamera.current });
    }
    set({ camera: editorCamera.current });
  }, [mode, set, shotCamera]);

  useEffect(() => {
    return () => {
      set({ camera: editorCamera.current });
      shotCamera.clear();
    };
  }, [set, shotCamera]);

  return null;
}
