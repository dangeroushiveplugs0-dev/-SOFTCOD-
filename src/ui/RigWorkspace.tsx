import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF, Grid, Environment } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AnimationCameraRig, type CameraViewMode } from "./AnimationCameraRig";
import { RigPanel } from "./RigPanel";
import { RigEditor, createDefaultRigState, type ModelRigUIState } from "../rigging/RigEditorFixed";
import type { IKMode } from "../rigging/ik/types";
import { PerformanceManager } from "../performance/PerformanceManager";
import { testSceneVisibility } from "../performance/SceneCuller";
import type { PerformanceProfileName } from "../performance/PerformanceProfile";

type TransformMode = "translate" | "rotate" | "scale";
type SceneModel = { id: string; name: string; url: string };
type HierarchyItem = { id: string; name: string; type: string; modelId: string; modelName: string };
type AnimationItem = { id: string; modelId: string; modelName: string; name: string; duration: number };

function LoadedModel({ model, mode, selectedObjectId, selectedBoneId, rig, activeAnimationId, playing, performanceManager, selectedChainId, selectedGizmo, onSelect, onBoneSelect, onRigReady, onUpdateTarget, onUpdatePole, onChainSelect, onGizmoSelect, onHierarchy, onAnimations }: {
  model: SceneModel; mode: TransformMode; selectedObjectId: string | null; selectedBoneId: string | null; rig: ModelRigUIState | null; activeAnimationId: string | null; playing: boolean; performanceManager: PerformanceManager; selectedChainId: string | null; selectedGizmo: "target" | "pole" | null;
  onSelect: (modelId: string, object: THREE.Object3D) => void; onBoneSelect: (modelId: string, bone: THREE.Bone) => void; onRigReady: (modelId: string, root: THREE.Object3D) => void; onUpdateTarget: (modelId: string, chainId: string, position: [number, number, number]) => void; onUpdatePole: (modelId: string, chainId: string, position: [number, number, number]) => void; onChainSelect: (chainId: string) => void; onGizmoSelect: (kind: "target" | "pole" | null) => void; onHierarchy: (items: HierarchyItem[]) => void; onAnimations: (items: AnimationItem[]) => void;
}) {
  const { scene, animations: gltfAnimations } = useGLTF(model.url);
  const root = useMemo(() => cloneSkeleton(scene), [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  const animationItems = useMemo(() => (gltfAnimations as THREE.AnimationClip[]).map((clip) => ({ id: `${model.id}::${clip.name || "Unnamed"}`, modelId: model.id, modelName: model.name, name: clip.name || "Unnamed", duration: clip.duration })), [gltfAnimations, model.id, model.name]);
  const hierarchyItems = useMemo<HierarchyItem[]>(() => { const items: HierarchyItem[] = []; root.traverse((object) => items.push({ id: `${model.id}::${object.uuid}`, name: object.name || object.type || "Object", type: object.type, modelId: model.id, modelName: model.name })); return items; }, [model.id, model.name, root]);

  useEffect(() => onRigReady(model.id, root), [model.id, onRigReady, root]);
  useEffect(() => onHierarchy(hierarchyItems), [hierarchyItems, onHierarchy]);
  useEffect(() => onAnimations(animationItems), [animationItems, onAnimations]);
  useEffect(() => {
    mixer.stopAllAction();
    if (!activeAnimationId?.startsWith(`${model.id}::`)) return;
    const clipName = activeAnimationId.slice(model.id.length + 2);
    const clip = (gltfAnimations as THREE.AnimationClip[]).find((item) => (item.name || "Unnamed") === clipName);
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.reset().play();
    action.paused = !playing;
  }, [activeAnimationId, gltfAnimations, mixer, model.id, playing]);
  useFrame((state, delta) => {
    if (playing && activeAnimationId?.startsWith(model.id + "::")) {
      const now = performance.now();
      const visibility = testSceneVisibility(root, state.camera);
      const profile = performanceManager.resolveAutoProfile();
      const priority = visibility.visible ? "normal" : "distant";
      const hz = visibility.visible ? profile.animationUpdateHz : profile.distantUpdateHz;
      if (performanceManager.scheduler.shouldUpdate(model.id, hz, now, priority)) mixer.update(delta);
    }
  });
  useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(root); URL.revokeObjectURL(model.url); }, [mixer, model.url, root]);

  let selected: THREE.Object3D | null = null;
  if (selectedObjectId?.startsWith(`${model.id}::`)) {
    const objectId = selectedObjectId.slice(model.id.length + 2);
    root.traverse((object) => { if (object.uuid === objectId) selected = object; });
  }

  return <>
    <primitive object={root} onClick={(event: any) => { event.stopPropagation(); const object = event.object as THREE.Object3D; if (object instanceof THREE.Bone) onBoneSelect(model.id, object); else onSelect(model.id, object); }} />
    {selected && !selectedBoneId && <TransformControls object={selected} mode={mode} />}
    {rig && <RigEditor root={root} rig={rig} selectedBoneId={selectedBoneId} selectedChainId={selectedChainId} selectedGizmo={selectedGizmo} onSelectBone={(bone) => onBoneSelect(model.id, bone)} onSelectChain={onChainSelect} onSelectGizmo={onGizmoSelect} onUpdateTarget={(chainId, position) => onUpdateTarget(model.id, chainId, position)} onUpdatePole={(chainId, position) => onUpdatePole(model.id, chainId, position)} onDraggingChange={() => {}} />}
  </>;
}

function SceneContents({ models, mode, lighting, selectedObjectId, selectedBoneId, rigs, activeAnimationId, playing, cameraMode, syncCameraFromEditor, performanceProfile, selectedChainId, selectedGizmo, onSelect, onBoneSelect, onRigReady, onUpdateTarget, onUpdatePole, onChainSelect, onGizmoSelect, onHierarchy, onAnimations }: {
  models: SceneModel[]; mode: TransformMode; lighting: boolean; selectedObjectId: string | null; selectedBoneId: string | null; rigs: Record<string, ModelRigUIState>; activeAnimationId: string | null; playing: boolean; cameraMode: CameraViewMode; syncCameraFromEditor: number; performanceProfile: PerformanceProfileName; selectedChainId: string | null; selectedGizmo: "target" | "pole" | null;
  onSelect: (modelId: string, object: THREE.Object3D) => void; onBoneSelect: (modelId: string, bone: THREE.Bone) => void; onRigReady: (modelId: string, root: THREE.Object3D) => void; onUpdateTarget: (modelId: string, chainId: string, position: [number, number, number]) => void; onUpdatePole: (modelId: string, chainId: string, position: [number, number, number]) => void; onChainSelect: (chainId: string) => void; onGizmoSelect: (kind: "target" | "pole" | null) => void; onHierarchy: (items: HierarchyItem[]) => void; onAnimations: (items: AnimationItem[]) => void;
}) {
  const { camera } = useThree();
  const performanceManager = useMemo(() => new PerformanceManager(), []);
  const [gizmoDragging, setGizmoDragging] = useState(false);
  useEffect(() => { camera.position.set(3, 2, 5); }, [camera]);
  useEffect(() => { performanceManager.setProfile(performanceProfile); }, [performanceManager, performanceProfile]);
  useFrame(() => { performanceManager.beginFrame(performance.now()); performanceManager.endFrame(performance.now()); });

  return <>
    <color attach="background" args={["#0b0d10"]} />
    {lighting && <ambientLight intensity={1.5} />}
    {lighting && <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />}
    <Grid infiniteGrid cellSize={0.5} sectionSize={2} fadeDistance={30} />
    {lighting && <Environment preset="city" />}
    <AnimationCameraRig mode={cameraMode} syncFromEditor={syncCameraFromEditor} />
    {cameraMode === "editor" && <OrbitControls key="editor-camera-controls" makeDefault enableDamping dampingFactor={0.08} enabled={!gizmoDragging} />}
    {models.length === 0 ? <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#6b7280" /></mesh> : <Suspense fallback={null}>{models.map((model) => <LoadedModel key={model.id} model={model} mode={mode} selectedObjectId={selectedObjectId} selectedBoneId={selectedBoneId} rig={rigs[model.id] ?? null} activeAnimationId={activeAnimationId} playing={playing} performanceManager={performanceManager} selectedChainId={selectedChainId} selectedGizmo={selectedGizmo} onSelect={onSelect} onBoneSelect={onBoneSelect} onRigReady={onRigReady} onUpdateTarget={onUpdateTarget} onUpdatePole={onUpdatePole} onChainSelect={onChainSelect} onGizmoSelect={onGizmoSelect} onHierarchy={onHierarchy} onAnimations={onAnimations} />)}</Suspense>}
  </>;
}

export function RigWorkspace() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [models, setModels] = useState<SceneModel[]>([]);
  const [mode, setMode] = useState<TransformMode>("translate");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedBoneId, setSelectedBoneId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [selectedGizmo, setSelectedGizmo] = useState<"target" | "pole" | null>(null);
  const [selectedName, setSelectedName] = useState("Nothing selected");
  const [lighting, setLighting] = useState(true);
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
  const [animations, setAnimations] = useState<AnimationItem[]>([]);
  const [rigs, setRigs] = useState<Record<string, ModelRigUIState>>({});
  const [panel, setPanel] = useState<"outliner" | "rig" | "lighting" | "animation" | "camera">("rig");
  const [cameraMode, setCameraMode] = useState<CameraViewMode>("editor");
  const [performanceProfile, setPerformanceProfile] = useState<"auto" | "battery" | "balanced" | "quality">("auto");
  const [syncCameraFromEditor, setSyncCameraFromEditor] = useState(-1);
  const [activeAnimationId, setActiveAnimationId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const onRigReady = (modelId: string, root: THREE.Object3D) => {
    setRigs((current) => current[modelId] ? current : { ...current, [modelId]: createDefaultRigState(modelId, root) });
    setSelectedModelId((current) => current ?? modelId);
  };
  const updateRig = (modelId: string, updater: (rig: ModelRigUIState) => ModelRigUIState) => setRigs((current) => current[modelId] ? { ...current, [modelId]: updater(current[modelId]) } : current);
  const setModelIKMode = (nextMode: IKMode) => { if (!selectedModelId) return; updateRig(selectedModelId, (rig) => ({ ...rig, mode: nextMode, chains: rig.chains.map((chain) => ({ ...chain, mode: nextMode, maxStretchRatio: nextMode === "human" ? 1 : Math.max(1.15, chain.maxStretchRatio) })) })); };
  const setChainIKMode = (chainId: string, nextMode: IKMode) => { if (!selectedModelId) return; updateRig(selectedModelId, (rig) => ({ ...rig, chains: rig.chains.map((chain) => chain.id === chainId ? { ...chain, mode: nextMode, maxStretchRatio: nextMode === "human" ? 1 : Math.max(1.15, chain.maxStretchRatio) } : chain) })); };
  const updateStretch = (chainId: string, value: number) => { if (!selectedModelId) return; updateRig(selectedModelId, (rig) => ({ ...rig, chains: rig.chains.map((chain) => chain.id === chainId ? { ...chain, maxStretchRatio: value } : chain) })); };
  const updateTarget = (modelId: string, chainId: string, position: [number, number, number]) => updateRig(modelId, (rig) => ({ ...rig, chains: rig.chains.map((chain) => chain.id === chainId ? { ...chain, targetPosition: position } : chain) }));
  const updatePole = (modelId: string, chainId: string, position: [number, number, number]) => updateRig(modelId, (rig) => ({ ...rig, chains: rig.chains.map((chain) => chain.id === chainId ? { ...chain, polePosition: position } : chain) }));

  const selectObject = (modelId: string, object: THREE.Object3D) => { setSelectedModelId(modelId); setSelectedObjectId(`${modelId}::${object.uuid}`); setSelectedBoneId(null); setSelectedName(object.name || object.type || "Object"); setSelectedChainId(null); setSelectedGizmo(null); };
  const selectBone = (modelId: string, bone: THREE.Bone) => { setSelectedModelId(modelId); setSelectedObjectId(`${modelId}::${bone.uuid}`); setSelectedBoneId(bone.uuid); setSelectedName(bone.name || "Bone"); setSelectedChainId(null); setSelectedGizmo(null); setPanel("rig"); };

  const onFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const glbs = Array.from(event.target.files ?? []).filter((file) => /\.glb$/i.test(file.name));
    if (!glbs.length) return;
    const added = glbs.map((file) => ({ id: crypto.randomUUID(), name: file.name, url: URL.createObjectURL(file) }));
    setModels((current) => [...current, ...added]);
    if (!selectedModelId && added[0]) setSelectedModelId(added[0].id);
    event.target.value = "";
  };
  const clear = () => { models.forEach((model) => URL.revokeObjectURL(model.url)); setModels([]); setRigs({}); setHierarchy([]); setAnimations([]); setSelectedModelId(null); setSelectedObjectId(null); setSelectedBoneId(null); setSelectedChainId(null); setSelectedGizmo(null); setSelectedName("Nothing selected"); setActiveAnimationId(null); setPlaying(false); };

  const selectItem = (item: HierarchyItem) => {
    setSelectedModelId(item.modelId); setSelectedObjectId(item.id); setSelectedName(item.name); setSelectedChainId(null); setSelectedGizmo(null);
    if (item.type === "Bone") { setSelectedBoneId(item.id.slice(item.modelId.length + 2)); setPanel("rig"); } else setSelectedBoneId(null);
  };

  const animationGroups = models.map((model) => ({ model, items: animations.filter((animation) => animation.modelId === model.id) }));
  const selectedRig = selectedModelId ? rigs[selectedModelId] ?? null : null;

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><strong>SOFTCOD</strong><span>{models.length} model{models.length === 1 ? "" : "s"} in scene</span></div><div className="top-actions"><button className="light-button" onClick={() => setLighting((value) => !value)}>{lighting ? "Lights" : "Dark"}</button><button className="import-button" onClick={() => inputRef.current?.click()}>Import</button>{models.length > 0 && <button className="clear-button" onClick={clear}>Clear</button>}</div><input ref={inputRef} type="file" accept=".glb,model/gltf-binary" multiple hidden onChange={onFiles} /></header>
    <section className="editor-layout">
      <aside className="side-panel left-panel">
        <div className="panel-heading"><strong>Rig Editor</strong><span>{models.length} model{models.length === 1 ? "" : "s"}</span></div>
        <div className="panel-tabs"><button className="panel-button" onClick={() => setPanel("outliner")}>Outliner</button><button className="panel-button active">Rig</button><button className="panel-button" onClick={() => setPanel("animation")}>Anim</button><button className="panel-button" onClick={() => setPanel("camera")}>Camera</button></div>
        {panel === "rig" && <RigPanel models={models} selectedModelId={selectedModelId} selectedChainId={selectedChainId} rig={selectedRig} onSelectModel={(modelId) => { setSelectedModelId(modelId); setSelectedBoneId(null); setSelectedChainId(null); setSelectedGizmo(null); }} onSelectChain={(chainId) => { setSelectedChainId(chainId); setSelectedGizmo(null); }} onModelMode={setModelIKMode} onChainMode={setChainIKMode} onStretch={updateStretch} />}
        {panel === "outliner" && <div className="outliner">{models.map((model) => <div className="model-group" key={model.id}><div className="model-header"><span>◇</span><strong>{model.name}</strong></div>{hierarchy.filter((item) => item.modelId === model.id && item.type !== "Scene").slice(0, 150).map((item) => <button key={item.id} className={selectedObjectId === item.id ? "tree-item selected" : "tree-item"} onClick={() => selectItem(item)}><span className="tree-icon">{item.type === "Bone" ? "🦴" : "◇"}</span><span>{item.name}</span></button>)}</div>)}</div>}
        {panel === "animation" && <div className="animation-panel">{!animations.length ? <div className="empty-panel">No animation clips found in the imported models.</div> : <>{animationGroups.map(({ model, items }) => items.length > 0 && <div className="animation-group" key={model.id}><div className="group-title">{model.name}</div>{items.map((item) => <button key={item.id} className={activeAnimationId === item.id ? "animation-item active" : "animation-item"} onClick={() => { setActiveAnimationId(item.id); setPlaying(true); }}><span>{item.name}</span><small>{item.duration.toFixed(2)}s</small></button>)}</div>)}</>}</div>}
        {panel === "camera" && <div className="settings-panel"><div className="camera-mode-buttons"><button className={cameraMode === "editor" ? "camera-mode active" : "camera-mode"} onClick={() => setCameraMode("editor")}>Editor View</button><button className={cameraMode === "shot" ? "camera-mode active" : "camera-mode"} onClick={() => setCameraMode("shot")}>Animation Camera</button></div><button className="sync-camera-button" onClick={() => setSyncCameraFromEditor((value) => value + 1)}>Set Shot From Current View</button></div>}
      </aside>
      <section className="viewport-shell">
        <Canvas camera={{ position: [3, 2, 5], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
          <SceneContents models={models} mode={mode} lighting={lighting} selectedObjectId={selectedObjectId} selectedBoneId={selectedBoneId} rigs={rigs} activeAnimationId={activeAnimationId} playing={playing} cameraMode={cameraMode} syncCameraFromEditor={syncCameraFromEditor} performanceProfile={performanceProfile} selectedChainId={selectedChainId} selectedGizmo={selectedGizmo} onSelect={selectObject} onBoneSelect={selectBone} onRigReady={onRigReady} onUpdateTarget={updateTarget} onUpdatePole={updatePole} onChainSelect={(chainId) => { setSelectedChainId(chainId); setSelectedGizmo(null); }} onGizmoSelect={setSelectedGizmo} onHierarchy={(items) => setHierarchy((current) => [...current.filter((item) => !items.length || item.modelId !== items[0].modelId), ...items])} onAnimations={(items) => setAnimations((current) => [...current.filter((item) => !items.length || item.modelId !== items[0].modelId), ...items])} />
        </Canvas>
        <aside className="tool-panel"><div className="file-name">{models.length ? `${models.length} model${models.length === 1 ? "" : "s"} loaded` : "No models loaded"}</div><div className="selection">{selectedName}</div><div className="tool-group"><button className={mode === "translate" ? "active" : ""} onClick={() => setMode("translate")}>Move</button><button className={mode === "rotate" ? "active" : ""} onClick={() => setMode("rotate")}>Rotate</button><button className={mode === "scale" ? "active" : ""} onClick={() => setMode("scale")}>Scale</button></div><div className="hint">Bones are selectable in the viewport. IK target = solid handle, pole = ring handle.</div></aside>
      </section>
      <aside className="side-panel right-panel"><div className="panel-heading"><strong>Selection</strong><span>{selectedRig?.mode === "stylized" ? "Stylized IK" : "Human IK"}</span></div><div className="inspector"><div className="inspector-title">{selectedName}</div><div className="inspector-section"><span>Rig</span><button className="sync-camera-button" onClick={() => setPanel("rig")}>Rig Controls</button></div><div className="empty-panel">Human IK preserves authored bone lengths. Stylized IK can temporarily stretch selected chains and return toward their authored proportions.</div></div></aside>
    </section>
  </main>;
}
