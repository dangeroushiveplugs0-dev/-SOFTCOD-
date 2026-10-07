import { useEffect, useMemo, useRef } from "react";
import { Line, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { IKMode } from "./ik/types";

export type RigChainUI = {
  id: string;
  name: string;
  boneIds: string[];
  mode: IKMode;
  maxStretchRatio: number;
  targetPosition: [number, number, number];
  polePosition: [number, number, number];
};

export type ModelRigUIState = {
  modelId: string;
  mode: IKMode;
  chains: RigChainUI[];
};

type RigEditorProps = {
  root: THREE.Object3D;
  rig: ModelRigUIState;
  selectedBoneId: string | null;
  selectedChainId: string | null;
  selectedGizmo: "target" | "pole" | null;
  onSelectBone: (bone: THREE.Bone) => void;
  onSelectChain: (chainId: string) => void;
  onSelectGizmo: (kind: "target" | "pole" | null) => void;
  onUpdateTarget: (chainId: string, position: [number, number, number]) => void;
  onUpdatePole: (chainId: string, position: [number, number, number]) => void;
  onDraggingChange: (dragging: boolean) => void;
};

function worldEnd(bone: THREE.Bone, out = new THREE.Vector3()): THREE.Vector3 {
  const child = bone.children.find((item) => item instanceof THREE.Bone);
  if (child) return child.getWorldPosition(out);
  const length = Math.max(0.08, bone.position.length() || 0.25);
  return bone.getWorldPosition(out).add(new THREE.Vector3(0, length, 0).applyQuaternion(bone.getWorldQuaternion(new THREE.Quaternion())));
}

function BoneVisual({ bone, selected, onSelect }: { bone: THREE.Bone; selected: boolean; onSelect: () => void }) {
  const start = useMemo(() => bone.getWorldPosition(new THREE.Vector3()), [bone]);
  const end = useMemo(() => worldEnd(bone), [bone]);
  return <>
    <Line points={[start, end]} lineWidth={selected ? 4 : 2} color={selected ? "#ffffff" : "#8b95a5"} />
    <mesh position={start} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <sphereGeometry args={[selected ? 0.065 : 0.045, 10, 10]} />
      <meshBasicMaterial color={selected ? "#ffffff" : "#aab3c0"} />
    </mesh>
  </>;
}

function Handle({ object, kind, selected, onSelect, onChange, onDraggingChange }: {
  object: THREE.Object3D;
  kind: "target" | "pole";
  selected: boolean;
  onSelect: () => void;
  onChange: () => void;
  onDraggingChange: (dragging: boolean) => void;
}) {
  const color = kind === "target" ? "#ffffff" : "#9ca3af";
  return <>
    <mesh position={object.position} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <sphereGeometry args={[selected ? 0.12 : 0.09, 12, 12]} />
      <meshBasicMaterial color={color} wireframe={kind === "pole"} />
    </mesh>
    {selected && <TransformControls
      object={object}
      mode="translate"
      size={0.65}
      onMouseDown={() => onDraggingChange(true)}
      onMouseUp={() => onDraggingChange(false)}
      onObjectChange={onChange}
    />}
  </>;
}

export function RigEditor({ root, rig, selectedBoneId, selectedChainId, selectedGizmo, onSelectBone, onSelectChain, onSelectGizmo, onUpdateTarget, onUpdatePole, onDraggingChange }: RigEditorProps) {
  const targetRefs = useRef(new Map<string, THREE.Object3D>());
  const poleRefs = useRef(new Map<string, THREE.Object3D>());

  const bones = useMemo(() => {
    const found: THREE.Bone[] = [];
    root.traverse((object) => { if (object instanceof THREE.Bone) found.push(object); });
    return found;
  }, [root]);

  const boneById = useMemo(() => new Map(bones.map((bone) => [bone.uuid, bone])), [bones]);

  useEffect(() => {
    rig.chains.forEach((chain) => {
      let target = targetRefs.current.get(chain.id);
      if (!target) {
        target = new THREE.Object3D();
        target.name = `IK Target: ${chain.name}`;
        targetRefs.current.set(chain.id, target);
      }
      target.position.fromArray(chain.targetPosition);
      let pole = poleRefs.current.get(chain.id);
      if (!pole) {
        pole = new THREE.Object3D();
        pole.name = `IK Pole: ${chain.name}`;
        poleRefs.current.set(chain.id, pole);
      }
      pole.position.fromArray(chain.polePosition);
    });
  }, [rig.chains]);

  return <group>
    {bones.map((bone) => <BoneVisual key={bone.uuid} bone={bone} selected={selectedBoneId === bone.uuid} onSelect={() => onSelectBone(bone)} />)}
    {rig.chains.map((chain) => {
      const target = targetRefs.current.get(chain.id);
      const pole = poleRefs.current.get(chain.id);
      if (!target || !pole) return null;
      const selected = selectedChainId === chain.id;
      const endBone = boneById.get(chain.boneIds[chain.boneIds.length - 1]);
      const end = endBone ? worldEnd(endBone) : new THREE.Vector3();
      return <group key={chain.id}>
        <Line points={[end, target.position]} lineWidth={selected ? 2 : 1} color="#ffffff" dashed={!selected} dashSize={0.06} gapSize={0.04} />
        <Handle object={target} kind="target" selected={selected && selectedGizmo === "target"} onSelect={() => { onSelectChain(chain.id); onSelectGizmo("target"); }} onChange={() => onUpdateTarget(chain.id, target.position.toArray() as [number, number, number])} onDraggingChange={onDraggingChange} />
        <Handle object={pole} kind="pole" selected={selected && selectedGizmo === "pole"} onSelect={() => { onSelectChain(chain.id); onSelectGizmo("pole"); }} onChange={() => onUpdatePole(chain.id, pole.position.toArray() as [number, number, number])} onDraggingChange={onDraggingChange} />
      </group>;
    })}
    {selectedBoneId && boneById.get(selectedBoneId) && <TransformControls object={boneById.get(selectedBoneId)!} mode="rotate" size={0.7} onMouseDown={() => onDraggingChange(true)} onMouseUp={() => onDraggingChange(false)} />}
  </group>;
}

export function createDefaultRigState(modelId: string, root: THREE.Object3D): ModelRigUIState {
  const bones: THREE.Bone[] = [];
  root.traverse((object) => { if (object instanceof THREE.Bone) bones.push(object); });
  const lower = (bone: THREE.Bone) => bone.name.toLowerCase();
  const groups: { name: string; keys: string[] }[] = [
    { name: "Left Arm", keys: ["leftarm", "leftupperarm", "leftforearm", "left_hand", "lefthand"] },
    { name: "Right Arm", keys: ["rightarm", "rightupperarm", "rightforearm", "right_hand", "righthand"] },
    { name: "Left Leg", keys: ["leftupleg", "leftthigh", "leftleg", "leftfoot"] },
    { name: "Right Leg", keys: ["rightupleg", "rightthigh", "rightleg", "rightfoot"] },
    { name: "Spine", keys: ["hips", "hip", "spine", "chest", "neck", "head"] }
  ];
  const chains: RigChainUI[] = [];
  for (const group of groups) {
    const matched = bones.filter((bone) => group.keys.some((key) => lower(bone).replace(/[ .-]/g, "").includes(key.replace(/[ .-]/g, "")))).slice(0, 4);
    if (matched.length >= 2) {
      const rootPos = matched[0].getWorldPosition(new THREE.Vector3());
      const lastPos = matched[matched.length - 1].getWorldPosition(new THREE.Vector3());
      chains.push({
        id: `${modelId}:chain:${group.name.toLowerCase().replace(/ /g, "-")}`,
        name: group.name,
        boneIds: matched.map((bone) => bone.uuid),
        mode: "human",
        maxStretchRatio: 1,
        targetPosition: [lastPos.x, lastPos.y, lastPos.z],
        polePosition: [rootPos.x + 0.35, rootPos.y, rootPos.z + 0.35]
      });
    }
  }
  if (!chains.length && bones.length >= 2) {
    const matched = bones.slice(0, Math.min(4, bones.length));
    const end = matched[matched.length - 1].getWorldPosition(new THREE.Vector3());
    chains.push({
      id: `${modelId}:chain:primary`,
      name: "Primary Chain",
      boneIds: matched.map((bone) => bone.uuid),
      mode: "human",
      maxStretchRatio: 1,
      targetPosition: end.toArray() as [number, number, number],
      polePosition: [end.x + 0.35, end.y, end.z + 0.35]
    });
  }
  return { modelId, mode: "human", chains };
}
