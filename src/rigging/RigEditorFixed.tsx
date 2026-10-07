import { useLayoutEffect, useMemo, useState } from "react";
import { Line, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import type { IKMode } from "./ik/types";

export type RigChainUI = { id: string; name: string; boneIds: string[]; mode: IKMode; maxStretchRatio: number; targetPosition: [number, number, number]; polePosition: [number, number, number] };
export type ModelRigUIState = { modelId: string; mode: IKMode; chains: RigChainUI[] };

type Props = {
  root: THREE.Object3D; rig: ModelRigUIState; selectedBoneId: string | null; selectedChainId: string | null; selectedGizmo: "target" | "pole" | null;
  onSelectBone: (bone: THREE.Bone) => void; onSelectChain: (chainId: string) => void; onSelectGizmo: (kind: "target" | "pole" | null) => void;
  onUpdateTarget: (chainId: string, position: [number, number, number]) => void; onUpdatePole: (chainId: string, position: [number, number, number]) => void; onDraggingChange: (dragging: boolean) => void;
};

function endOf(bone: THREE.Bone) {
  const child = bone.children.find((item) => item instanceof THREE.Bone);
  if (child) return child.getWorldPosition(new THREE.Vector3());
  const q = bone.getWorldQuaternion(new THREE.Quaternion());
  return bone.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, Math.max(0.08, bone.position.length() || 0.25), 0).applyQuaternion(q));
}

function BoneVisual({ bone, selected, onSelect }: { bone: THREE.Bone; selected: boolean; onSelect: () => void }) {
  const start = bone.getWorldPosition(new THREE.Vector3());
  const end = endOf(bone);
  return <>
    <Line points={[start, end]} lineWidth={selected ? 4 : 2} color={selected ? "#ffffff" : "#8b95a5"} />
    <mesh position={start} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <sphereGeometry args={[selected ? 0.065 : 0.045, 10, 10]} />
      <meshBasicMaterial color={selected ? "#ffffff" : "#aab3c0"} />
    </mesh>
  </>;
}

function Handle({ object, kind, selected, onSelect, onChange, onDraggingChange }: { object: THREE.Object3D; kind: "target" | "pole"; selected: boolean; onSelect: () => void; onChange: () => void; onDraggingChange: (dragging: boolean) => void }) {
  return <>
    <mesh position={object.position} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <sphereGeometry args={[selected ? 0.12 : 0.09, 12, 12]} />
      <meshBasicMaterial color={kind === "target" ? "#ffffff" : "#9ca3af"} wireframe={kind === "pole"} />
    </mesh>
    {selected && <TransformControls object={object} mode="translate" size={0.65} onMouseDown={() => onDraggingChange(true)} onMouseUp={() => onDraggingChange(false)} onObjectChange={onChange} />}
  </>;
}

export function RigEditor({ root, rig, selectedBoneId, selectedChainId, selectedGizmo, onSelectBone, onSelectChain, onSelectGizmo, onUpdateTarget, onUpdatePole, onDraggingChange }: Props) {
  const bones = useMemo(() => { const result: THREE.Bone[] = []; root.traverse((object) => { if (object instanceof THREE.Bone) result.push(object); }); return result; }, [root]);
  const boneById = useMemo(() => new Map(bones.map((bone) => [bone.uuid, bone])), [bones]);
  const [targets] = useState(() => new Map(rig.chains.map((chain) => { const object = new THREE.Object3D(); object.name = `IK Target: ${chain.name}`; object.position.fromArray(chain.targetPosition); return [chain.id, object] as const; })));
  const [poles] = useState(() => new Map(rig.chains.map((chain) => { const object = new THREE.Object3D(); object.name = `IK Pole: ${chain.name}`; object.position.fromArray(chain.polePosition); return [chain.id, object] as const; })));

  useLayoutEffect(() => {
    rig.chains.forEach((chain) => {
      targets.get(chain.id)?.position.fromArray(chain.targetPosition);
      poles.get(chain.id)?.position.fromArray(chain.polePosition);
    });
  }, [rig, targets, poles]);

  return <group>
    {bones.map((bone) => <BoneVisual key={bone.uuid} bone={bone} selected={selectedBoneId === bone.uuid} onSelect={() => onSelectBone(bone)} />)}
    {rig.chains.map((chain) => {
      const target = targets.get(chain.id);
      const pole = poles.get(chain.id);
      if (!target || !pole) return null;
      const endBone = boneById.get(chain.boneIds[chain.boneIds.length - 1]);
      const end = endBone ? endOf(endBone) : new THREE.Vector3();
      const active = selectedChainId === chain.id;
      return <group key={chain.id}>
        <Line points={[end, target.position]} lineWidth={active ? 2 : 1} color="#ffffff" dashed={!active} dashSize={0.06} gapSize={0.04} />
        <Handle object={target} kind="target" selected={active && selectedGizmo === "target"} onSelect={() => { onSelectChain(chain.id); onSelectGizmo("target"); }} onChange={() => onUpdateTarget(chain.id, target.position.toArray() as [number, number, number])} onDraggingChange={onDraggingChange} />
        <Handle object={pole} kind="pole" selected={active && selectedGizmo === "pole"} onSelect={() => { onSelectChain(chain.id); onSelectGizmo("pole"); }} onChange={() => onUpdatePole(chain.id, pole.position.toArray() as [number, number, number])} onDraggingChange={onDraggingChange} />
      </group>;
    })}
    {selectedBoneId && boneById.get(selectedBoneId) && <TransformControls object={boneById.get(selectedBoneId)!} mode="rotate" size={0.7} onMouseDown={() => onDraggingChange(true)} onMouseUp={() => onDraggingChange(false)} />}
  </group>;
}

export function createDefaultRigState(modelId: string, root: THREE.Object3D): ModelRigUIState {
  const bones: THREE.Bone[] = [];
  root.traverse((object) => { if (object instanceof THREE.Bone) bones.push(object); });
  const normalize = (value: string) => value.toLowerCase().replace(/[ .-]/g, "");
  const groups = [
    ["Left Arm", ["leftarm", "leftupperarm", "leftforearm", "lefthand"]],
    ["Right Arm", ["rightarm", "rightupperarm", "rightforearm", "righthand"]],
    ["Left Leg", ["leftupleg", "leftthigh", "leftleg", "leftfoot"]],
    ["Right Leg", ["rightupleg", "rightthigh", "rightleg", "rightfoot"]],
    ["Spine", ["hips", "hip", "spine", "chest", "neck", "head"]]
  ] as const;
  const chains: RigChainUI[] = [];
  for (const [name, keys] of groups) {
    const matched = bones.filter((bone) => keys.some((key) => normalize(bone.name).includes(key))).slice(0, 4);
    if (matched.length < 2) continue;
    const rootPos = matched[0].getWorldPosition(new THREE.Vector3());
    const lastPos = matched[matched.length - 1].getWorldPosition(new THREE.Vector3());
    chains.push({ id: `${modelId}:chain:${normalize(name)}`, name, boneIds: matched.map((bone) => bone.uuid), mode: "human", maxStretchRatio: 1, targetPosition: lastPos.toArray() as [number, number, number], polePosition: [rootPos.x + 0.35, rootPos.y, rootPos.z + 0.35] });
  }
  if (!chains.length && bones.length >= 2) {
    const matched = bones.slice(0, Math.min(4, bones.length));
    const end = matched[matched.length - 1].getWorldPosition(new THREE.Vector3());
    chains.push({ id: `${modelId}:chain:primary`, name: "Primary Chain", boneIds: matched.map((bone) => bone.uuid), mode: "human", maxStretchRatio: 1, targetPosition: end.toArray() as [number, number, number], polePosition: [end.x + 0.35, end.y, end.z + 0.35] });
  }
  return { modelId, mode: "human", chains };
}
