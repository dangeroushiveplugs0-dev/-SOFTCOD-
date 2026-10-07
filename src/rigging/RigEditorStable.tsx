import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Line, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
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

type CurveSample = { mesh: THREE.SkinnedMesh; vertexIndex: number; weight: number };

type CurveData = { bone: THREE.Bone; samples: CurveSample[]; fallbackLocalPoint: THREE.Vector3 };

function sampleSkinnedVertex(mesh: THREE.SkinnedMesh, vertexIndex: number, target: THREE.Vector3): THREE.Vector3 {
  const position = mesh.geometry.getAttribute("position");
  const skinIndex = mesh.geometry.getAttribute("skinIndex");
  const skinWeight = mesh.geometry.getAttribute("skinWeight");
  if (!position || !skinIndex || !skinWeight) return target.set(0, 0, 0);

  mesh.skeleton.update();
  const boneMatrices = mesh.skeleton.boneMatrices;
  if (!boneMatrices) return target.set(0, 0, 0);

  const source = new THREE.Vector3().fromBufferAttribute(position, vertexIndex).applyMatrix4(mesh.bindMatrix);
  const skinned = new THREE.Vector3();
  const boneMatrix = new THREE.Matrix4();

  for (let j = 0; j < 4; j++) {
    const weight = skinWeight.getComponent(vertexIndex, j);
    if (weight === 0) continue;
    const boneIndex = skinIndex.getComponent(vertexIndex, j);
    boneMatrix.fromArray(boneMatrices, boneIndex * 16);
    skinned.addScaledVector(source.clone().applyMatrix4(boneMatrix), weight);
  }

  return target.copy(skinned).applyMatrix4(mesh.bindMatrixInverse);
}

function buildBoneCurveData(root: THREE.Object3D, bones: THREE.Bone[]): CurveData[] {
  const meshes: THREE.SkinnedMesh[] = [];
  root.traverse((object) => { if (object instanceof THREE.SkinnedMesh) meshes.push(object); });

  return bones.map((bone) => {
    const samples: CurveSample[] = [];

    for (const mesh of meshes) {
      const index = mesh.skeleton.bones.indexOf(bone);
      if (index < 0) continue;

      const position = mesh.geometry.getAttribute("position");
      const skinIndex = mesh.geometry.getAttribute("skinIndex");
      const skinWeight = mesh.geometry.getAttribute("skinWeight");
      if (!position || !skinIndex || !skinWeight) continue;

      const stride = Math.max(1, Math.floor(position.count / 600));
      for (let i = 0; i < position.count; i += stride) {
        let weight = 0;
        for (let j = 0; j < 4; j++) {
          if (skinIndex.getComponent(i, j) === index) weight += skinWeight.getComponent(i, j);
        }
        if (weight > 0.01) samples.push({ mesh, vertexIndex: i, weight });
      }
    }

    const start = bone.getWorldPosition(new THREE.Vector3());
    const end = endOf(bone);
    return {
      bone,
      samples,
      fallbackLocalPoint: bone.worldToLocal(start.lerp(end, 0.5))
    };
  });
}


function BoneVisual({ bone, selected, onSelect, curveData }: { bone: THREE.Bone; selected: boolean; onSelect: () => void; curveData: CurveData | undefined }) {
  const [points, setPoints] = useState<[THREE.Vector3, THREE.Vector3, THREE.Vector3] | null>(null);
  const accumulator = useRef(0);
  const curveWorld = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!curveData) return;
    accumulator.current += delta;
    if (accumulator.current < 1 / 30) return;
    accumulator.current = 0;

    const start = bone.getWorldPosition(new THREE.Vector3());
    const end = endOf(bone);
    if (curveData.samples.length > 0) {
      const deformed = new THREE.Vector3();
      const source = new THREE.Vector3();
      let totalWeight = 0;
      for (const sample of curveData.samples) {
        const position = sample.mesh.geometry.getAttribute("position");
        sampleSkinnedVertex(sample.mesh, sample.vertexIndex, source);
        sample.mesh.localToWorld(source);
        deformed.addScaledVector(source, sample.weight);
        totalWeight += sample.weight;
      }
      if (totalWeight > 0) curveWorld.current.copy(deformed).multiplyScalar(1 / totalWeight);
      else curveWorld.current.copy(curveData.fallbackLocalPoint).applyMatrix4(bone.matrixWorld);
    } else {
      curveWorld.current.copy(curveData.fallbackLocalPoint).applyMatrix4(bone.matrixWorld);
    }

    // Keep the bend subtle. The visible bone follows the mesh influence without
    // turning the rig line into a noodle.
    const mid = start.clone().lerp(end, 0.5);
    mid.lerp(curveWorld.current, 0.72);
    setPoints([start, mid, end]);
  });

  const initialStart = bone.getWorldPosition(new THREE.Vector3());
  const initialEnd = endOf(bone);
  const initialMid = initialStart.clone().lerp(initialEnd, 0.5);
  const visiblePoints = points ?? [initialStart, initialMid, initialEnd];

  return <>
    <Line points={visiblePoints} lineWidth={selected ? 5 : 3} color={selected ? "#ffffff" : "#8b95a5"} />
    <mesh
      position={initialStart}
      onClick={(event) => { event.stopPropagation(); onSelect(); }}
    >
      <sphereGeometry args={[selected ? 0.085 : 0.065, 12, 12]} />
      <meshBasicMaterial color={selected ? "#ffffff" : "#aab3c0"} />
    </mesh>
    {/* Large invisible hitbox: the bone is visually a thin line, but remains easy to grab on mobile. */}
    <mesh
      position={initialStart.clone().lerp(initialEnd, 0.5)}
      onClick={(event) => { event.stopPropagation(); onSelect(); }}
    >
      <capsuleGeometry args={[selected ? 0.12 : 0.105, Math.max(0.12, initialStart.distanceTo(initialEnd)), 4, 8]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  </>;
}

function Handle({ object, kind, selected, onSelect, onChange, onDraggingChange }: { object: THREE.Object3D; kind: "target" | "pole"; selected: boolean; onSelect: () => void; onChange: () => void; onDraggingChange: (dragging: boolean) => void }) {
  return <>
    <primitive object={object} />
    <mesh position={object.position} onClick={(event) => { event.stopPropagation(); onSelect(); }}>
      <sphereGeometry args={[selected ? 0.12 : 0.09, 12, 12]} />
      <meshBasicMaterial color={kind === "target" ? "#ffffff" : "#9ca3af"} wireframe={kind === "pole"} />
    </mesh>
    {selected && <TransformControls object={object} mode="translate" size={0.65} onMouseDown={() => onDraggingChange(true)} onMouseUp={() => onDraggingChange(false)} onObjectChange={onChange} />}
  </>;
}

export function RigEditor({ root, rig, selectedBoneId, selectedChainId, selectedGizmo, onSelectBone, onSelectChain, onSelectGizmo, onUpdateTarget, onUpdatePole, onDraggingChange }: Props) {
  const bones = useMemo(() => {
    const result: THREE.Bone[] = [];
    root.traverse((object) => { if (object instanceof THREE.Bone) result.push(object); });
    return result;
  }, [root]);

  const boneById = useMemo(() => new Map(bones.map((bone) => [bone.uuid, bone])), [bones]);
  const curveData = useMemo(() => buildBoneCurveData(root, bones), [root, bones]);
  const curveById = useMemo(() => new Map(curveData.map((item) => [item.bone.uuid, item])), [curveData]);

  // One joint sphere per actual joint, rather than two overlapping spheres per bone.
  // A shared parent/child location is therefore represented once.
  const joints = useMemo(() => {
    const result = new Map<string, THREE.Bone>();
    bones.forEach((bone) => {
      const key = bone.uuid;
      result.set(key, bone);
    });
    return [...result.values()];
  }, [bones]);

  const [targets] = useState(() => new Map(rig.chains.map((chain) => {
    const object = new THREE.Object3D();
    object.name = `IK Target: ${chain.name}`;
    object.position.fromArray(chain.targetPosition);
    return [chain.id, object] as const;
  })));

  const [poles] = useState(() => new Map(rig.chains.map((chain) => {
    const object = new THREE.Object3D();
    object.name = `IK Pole: ${chain.name}`;
    object.position.fromArray(chain.polePosition);
    return [chain.id, object] as const;
  })));

  useLayoutEffect(() => {
    rig.chains.forEach((chain) => {
      targets.get(chain.id)?.position.fromArray(chain.targetPosition);
      poles.get(chain.id)?.position.fromArray(chain.polePosition);
    });
  }, [rig, targets, poles]);

  return <group>
    {bones.map((bone) => (
      <BoneVisual
        key={bone.uuid}
        bone={bone}
        curveData={curveById.get(bone.uuid)}
        selected={selectedBoneId === bone.uuid}
        onSelect={() => onSelectBone(bone)}
      />
    ))}

    {joints.map((bone) => {
      const selected = selectedBoneId === bone.uuid;
      return (
        <mesh
          key={`joint-${bone.uuid}`}
          position={bone.getWorldPosition(new THREE.Vector3())}
          onClick={(event) => { event.stopPropagation(); onSelectBone(bone); }}
        >
          <sphereGeometry args={[selected ? 0.105 : 0.075, 14, 14]} />
          <meshBasicMaterial color={selected ? "#ffffff" : "#aab3c0"} />
        </mesh>
      );
    })}

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

    {selectedBoneId && boneById.get(selectedBoneId) && (
      <TransformControls object={boneById.get(selectedBoneId)!} mode="rotate" size={0.7} onMouseDown={() => onDraggingChange(true)} onMouseUp={() => onDraggingChange(false)} />
    )}
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
