import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF, Grid, Environment } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AnimationCameraRig, type CameraViewMode } from "./AnimationCameraRig";
import { PerformanceManager } from "../performance/PerformanceManager";

type TransformMode = "translate" | "rotate" | "scale";
type SceneModel = { id: string; name: string; url: string };
type HierarchyItem = { id: string; name: string; type: string; modelId: string; modelName: string };
type AnimationItem = { id: string; modelId: string; modelName: string; name: string; duration: number };

function LoadedModel({ model, mode, selectedObjectId, activeAnimationId, playing, onSelect, onHierarchy, onAnimations }: {
  model: SceneModel; mode: TransformMode; selectedObjectId: string | null; activeAnimationId: string | null; playing: boolean;
  onSelect: (modelId: string, object: THREE.Object3D) => void; onHierarchy: (items: HierarchyItem[]) => void; onAnimations: (items: AnimationItem[]) => void;
}) {
  const { scene, animations: gltfAnimations } = useGLTF(model.url);
  const root = useMemo(() => cloneSkeleton(scene), [scene]);
  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);
  const performanceManager = useMemo(() => new PerformanceManager(), []);
  const animationItems = useMemo(() => (gltfAnimations as THREE.AnimationClip[]).map((clip) => ({
    id: `${model.id}::${clip.name || "Unnamed"}`, modelId: model.id, modelName: model.name, name: clip.name || "Unnamed", duration: clip.duration,
  })), [gltfAnimations, model.id, model.name]);
  const hierarchyItems = useMemo<HierarchyItem[]>(() => {
    const items: HierarchyItem[] = [];
    root.traverse((object) => items.push({ id: `${model.id}::${object.uuid}`, name: object.name || object.type || "Object", type: object.type, modelId: model.id, modelName: model.name }));
    return items;
  }, [model.id, model.name, root]);

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
  useFrame((state, delta) => {\n    performanceManager.beginFrame(state.clock.elapsedTime * 1000);\n    if (playing && activeAnimationId?.startsWith(`${model.id}::`)) mixer.update(delta);\n    performanceManager.endFrame(state.clock.elapsedTime * 1000);\n  });
  useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(root); URL.revokeObjectURL(model.url); }, [mixer, model.url, root]);

  let selected: THREE.Object3D | null = null;
  if (selectedObjectId?.startsWith(`${model.id}::`)) {
    const objectId = selectedObjectId.slice(model.id.length + 2);
    root.traverse((object) => { if (object.uuid === objectId) selected = object; });
  }

  return <>
    <primitive object={root} onClick={(event: any) => { event.stopPropagation(); onSelect(model.id, event.object as THREE.Object3D); }} />
    {selected && <TransformControls object={selected} mode={mode} />}
  </>;
}

function SceneContents({ models, mode, lighting, selectedObjectId, activeAnimationId, playing, cameraMode, syncCameraFromEditor, onSelect, onHierarchy, onAnimations }: {
  models: SceneModel[]; mode: TransformMode; lighting: boolean; selectedObjectId: string | null; activeAnimationId: string | null; playing: boolean; cameraMode: CameraViewMode; syncCameraFromEditor: number;
  onSelect: (modelId: string, object: THREE.Object3D) => void; onHierarchy: (items: HierarchyItem[]) => void; onAnimations: (items: AnimationItem[]) => void;
}) {
  const { camera } = useThree();\n  const performanceManager = useMemo(() => new PerformanceManager(), []);
  useEffect(() => { camera.position.set(3, 2, 5); }, [camera]);\n  useFrame((state) => { performanceManager.beginFrame(state.clock.elapsedTime * 1000); performanceManager.endFrame(state.clock.elapsedTime * 1000); });
  return <>
    <color attach="background" args={["#0b0d10"]} />
    {lighting && <ambientLight intensity={1.5} />}
    {lighting && <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />}
    <Grid infiniteGrid cellSize={0.5} sectionSize={2} fadeDistance={30} />
    {lighting && <Environment preset="city" />}
    <AnimationCameraRig mode={cameraMode} syncFromEditor={syncCameraFromEditor} />
    {cameraMode === "editor" && <OrbitControls key="editor-camera-controls" makeDefault enableDamping dampingFactor={0.08} />
    }
    {models.length === 0 ? <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#6b7280" /></mesh> :
      <Suspense fallback={null}>{models.map((model) => <LoadedModel key={model.id} model={model} mode={mode} selectedObjectId={selectedObjectId} activeAnimationId={activeAnimationId} playing={playing} onSelect={onSelect} onHierarchy={onHierarchy} onAnimations={onAnimations} />)}</Suspense>}
  </>;
}

function PanelButton({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button className={active ? "panel-button active" : "panel-button"} onClick={onClick}>{children}</button>;
}

export function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [models, setModels] = useState<SceneModel[]>([]);
  const [mode, setMode] = useState<TransformMode>("translate");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("Nothing selected");
  const [lighting, setLighting] = useState(true);
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
  const [animations, setAnimations] = useState<AnimationItem[]>([]);
  const [panel, setPanel] = useState<"outliner" | "lighting" | "animation" | "camera">("outliner");
  const [cameraMode, setCameraMode] = useState<CameraViewMode>("editor");\n  const [performanceProfile, setPerformanceProfile] = useState<"auto" | "battery" | "balanced" | "quality">("auto");
  const [syncCameraFromEditor, setSyncCameraFromEditor] = useState(-1);
  const [activeAnimationId, setActiveAnimationId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const onFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const glbs = Array.from(event.target.files ?? []).filter((file) => /\.glb$/i.test(file.name));
    if (!glbs.length) return;
    setModels((current) => [...current, ...glbs.map((file) => ({ id: crypto.randomUUID(), name: file.name, url: URL.createObjectURL(file) }))]);
    setSelectedObjectId(null); setSelectedName("Nothing selected"); setActiveAnimationId(null); setPlaying(false); setCameraMode("editor"); event.target.value = "";
  };
  const removeAllModels = () => {
    models.forEach((model) => URL.revokeObjectURL(model.url));
    setModels([]); setHierarchy([]); setAnimations([]); setSelectedObjectId(null); setSelectedName("Nothing selected"); setActiveAnimationId(null); setPlaying(false); setCameraMode("editor");
  };
  const selectItem = (item: HierarchyItem) => { setSelectedObjectId(item.id); setSelectedName(item.name); };
  const animationGroups = models.map((model) => ({ model, items: animations.filter((animation) => animation.modelId === model.id) }));

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><strong>SOFTCOD</strong><span>{models.length} model{models.length === 1 ? "" : "s"} in scene</span></div>
      <div className="top-actions">
        <button className="light-button" onClick={() => setLighting((value) => !value)}>{lighting ? "Lights" : "Dark"}</button>
        <button className="import-button" onClick={() => inputRef.current?.click()}>Import</button>
        {models.length > 0 && <button className="clear-button" onClick={removeAllModels}>Clear</button>}
      </div>
      <input ref={inputRef} type="file" accept=".glb,model/gltf-binary" multiple hidden onChange={onFiles} />
    </header>
    <section className="editor-layout">
      <aside className="side-panel left-panel">
        <div className="panel-heading"><strong>Scene</strong><span>{models.length} model{models.length === 1 ? "" : "s"}</span></div>
        <div className="panel-tabs"><PanelButton active={panel === "outliner"} onClick={() => setPanel("outliner")}>Outliner</PanelButton><PanelButton active={panel === "lighting"} onClick={() => setPanel("lighting")}>Light</PanelButton><PanelButton active={panel === "animation"} onClick={() => setPanel("animation")}>Anim</PanelButton><PanelButton active={panel === "camera"} onClick={() => setPanel("camera")}>Camera</PanelButton></div>
        {panel === "outliner" && <div className="outliner">
          {!models.length ? <div className="empty-panel">Import one or more GLBs to build a scene.</div> : models.map((model) => <div className="model-group" key={model.id}>
            <div className="model-header"><span>◇</span><strong>{model.name}</strong></div>
            {hierarchy.filter((item) => item.modelId === model.id && item.type !== "Scene").slice(0, 100).map((item) => <button key={item.id} className={selectedObjectId === item.id ? "tree-item selected" : "tree-item"} onClick={() => selectItem(item)}><span className="tree-icon">{item.type === "Bone" ? "🦴" : item.type === "Mesh" || item.type === "SkinnedMesh" ? "◇" : "○"}</span><span>{item.name}</span></button>)}
          </div>)}
        </div>}
        {panel === "animation" && <div className="animation-panel">
          {!animations.length ? <div className="empty-panel">No animation clips found in the imported models.</div> : <>
            <div className="animation-controls"><button className="play-button" onClick={() => setPlaying((value) => !value)}>{playing ? "Pause" : "Play"}</button><button className="stop-button" onClick={() => { setPlaying(false); setActiveAnimationId(null); }}>Stop</button></div>
            {animationGroups.map(({ model, items }) => items.length > 0 && <div className="animation-group" key={model.id}><div className="group-title">{model.name}</div>{items.map((item) => <button key={item.id} className={activeAnimationId === item.id ? "animation-item active" : "animation-item"} onClick={() => { setActiveAnimationId(item.id); setPlaying(true); }}><span>{item.name}</span><small>{item.duration.toFixed(2)}s</small></button>)}</div>)}
          </>}
        </div>}
        {panel === "lighting" && <div className="settings-panel"><div className="setting-row"><span>Viewport lighting</span><button className={lighting ? "toggle on" : "toggle"} onClick={() => setLighting((value) => !value)}>{lighting ? "ON" : "OFF"}</button></div><div className="empty-panel">Persistent light rigs will use the SNC lighting data model.</div></div>}
        {panel === "camera" && <div className="settings-panel"><div className="camera-mode-buttons"><button className={cameraMode === "editor" ? "camera-mode active" : "camera-mode"} onClick={() => setCameraMode("editor")}>Editor View</button><button className={cameraMode === "shot" ? "camera-mode active" : "camera-mode"} onClick={() => setCameraMode("shot")}>Animation Camera</button></div><button className="sync-camera-button" onClick={() => setSyncCameraFromEditor((value) => value + 1)}>Set Shot From Current View</button><div className="setting-row"><span>Performance</span><select value={performanceProfile} onChange={(event) => setPerformanceProfile(event.target.value as typeof performanceProfile)}><option value="auto">Auto</option><option value="battery">Battery</option><option value="balanced">Balanced</option><option value="quality">Quality</option></select></div><div className="empty-panel">The editor camera stays free for navigation. The animation camera is a separate camera whose transform can be keyed on the animation timeline later.</div></div>}
      </aside>
      <section className="viewport-shell">
        <Canvas camera={{ position: [3, 2, 5], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
          <SceneContents models={models} mode={mode} lighting={lighting} selectedObjectId={selectedObjectId} activeAnimationId={activeAnimationId} playing={playing} cameraMode={cameraMode} syncCameraFromEditor={syncCameraFromEditor}
            onSelect={(modelId, object) => { setSelectedObjectId(`${modelId}::${object.uuid}`); setSelectedName(object.name || object.type || "Object"); }}
            onHierarchy={(items) => setHierarchy((current) => [...current.filter((item) => !items.length || item.modelId !== items[0].modelId), ...items])}
            onAnimations={(items) => setAnimations((current) => [...current.filter((item) => !items.length || item.modelId !== items[0].modelId), ...items])} />
        </Canvas>
        <aside className="tool-panel"><div className="file-name">{models.length ? `${models.length} model${models.length === 1 ? "" : "s"} loaded` : "No models loaded"}</div><div className="selection">{selectedName}</div><div className="tool-group"><button className={mode === "translate" ? "active" : ""} onClick={() => setMode("translate")}>Move</button><button className={mode === "rotate" ? "active" : ""} onClick={() => setMode("rotate")}>Rotate</button><button className={mode === "scale" ? "active" : ""} onClick={() => setMode("scale")}>Scale</button></div><div className="camera-switch"><button className={cameraMode === "editor" ? "active" : ""} onClick={() => setCameraMode("editor")}>Edit Cam</button><button className={cameraMode === "shot" ? "active" : ""} onClick={() => setCameraMode("shot")}>Shot Cam</button></div><div className="hint">Import multiple GLBs · select either character · animate independently</div></aside>
      </section>
      <aside className="side-panel right-panel"><div className="panel-heading"><strong>Inspector</strong><span>{models.length} scene models</span></div><div className="inspector"><div className="inspector-title">{selectedName}</div><div className="inspector-section"><span>Transform</span><div className="transform-grid"><button onClick={() => setMode("translate")}>Move</button><button onClick={() => setMode("rotate")}>Rotate</button><button onClick={() => setMode("scale")}>Scale</button></div></div><div className="empty-panel">Rig, material, morph, outfit, collision and physics properties will appear here as their editors land.</div></div></aside>
    </section>
  </main>;
}
