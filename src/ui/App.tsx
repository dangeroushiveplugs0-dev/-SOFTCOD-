import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF, Grid, Environment } from "@react-three/drei";
import * as THREE from "three";

type TransformMode = "translate" | "rotate" | "scale";

type HierarchyItem = {
  id: string;
  name: string;
  type: string;
};

type AnimationItem = {
  name: string;
  duration: number;
};

function LoadedModel({
  url,
  mode,
  onSelect,
  onHierarchy,
  onAnimations,
  activeAnimation,
  playing,
}: {
  url: string;
  mode: TransformMode;
  onSelect: (o: THREE.Object3D | null) => void;
  onHierarchy: (items: HierarchyItem[]) => void;
  onAnimations: (items: AnimationItem[]) => void;
  activeAnimation: string | null;
  playing: boolean;
}) {
  const { scene, animations: gltfAnimations } = useGLTF(url);
  const [selected, setSelected] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    onAnimations((gltfAnimations as THREE.AnimationClip[]).map((clip) => ({
      name: clip.name || "Unnamed",
      duration: clip.duration,
    })));
  }, [gltfAnimations, onAnimations]);

  useEffect(() => {
    mixer.stopAllAction();
    if (!activeAnimation) return;
    const clip = (gltfAnimations as THREE.AnimationClip[]).find((item) => item.name === activeAnimation);
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.reset().play();
    action.paused = !playing;
  }, [activeAnimation, gltfAnimations, mixer, playing]);

  useFrame((_, delta) => {
    if (playing) mixer.update(delta);
  });

  const root = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((object) => {
      object.userData.sofcodSelectable = true;
      if ((object as THREE.Mesh).isMesh) {
        const mesh = object as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(root), [root]);

  useEffect(() => () => {
    mixer.stopAllAction();
    mixer.uncacheRoot(root);
    URL.revokeObjectURL(url);
  }, [mixer, root, url]);

  const hierarchyItems = useMemo<HierarchyItem[]>(() => {
    const items: HierarchyItem[] = [];
    root.traverse((object) => {
      items.push({
        id: object.uuid,
        name: object.name || object.type || "Object",
        type: object.type,
      });
    });
    return items;
  }, [root]);

  useEffect(() => {
    onHierarchy(hierarchyItems);
  }, [hierarchyItems, onHierarchy]);

  return (
    <>
      <primitive
        object={root}
        onClick={(event: any) => {
          event.stopPropagation();
          const object = event.object as THREE.Object3D;
          setSelected(object);
          onSelect(object);
        }}
      />
      {selected && (
        <TransformControls
          object={selected}
          mode={mode}
          onMouseDown={(event) => event.stopPropagation()}
        />
      )}
    </>
  );
}

function SceneContents({
  url,
  mode,
  lighting,
  onSelect,
  onHierarchy,
  onAnimations,
  activeAnimation,
  playing,
}: {
  url: string | null;
  mode: TransformMode;
  lighting: boolean;
  onSelect: (o: THREE.Object3D | null) => void;
  onHierarchy: (items: HierarchyItem[]) => void;
  onAnimations: (items: AnimationItem[]) => void;
  activeAnimation: string | null;
  playing: boolean;
}) {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(3, 2, 5);
  }, [camera]);

  return (
    <>
      <color attach="background" args={["#0b0d10"]} />
      {lighting && <ambientLight intensity={1.5} />}
      {lighting && <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />}
      <Grid infiniteGrid cellSize={0.5} sectionSize={2} fadeDistance={30} />
      {lighting && <Environment preset="city" />}
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      {url ? (
        <Suspense fallback={null}>
          <LoadedModel
            url={url}
            mode={mode}
            onSelect={onSelect}
            onHierarchy={onHierarchy}
            onAnimations={onAnimations}
            activeAnimation={activeAnimation}
            playing={playing}
          />
        </Suspense>
      ) : (
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#6b7280" />
        </mesh>
      )}
    </>
  );
}

function PanelButton({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={active ? "panel-button active" : "panel-button"} onClick={onClick}>
      {children}
    </button>
  );
}

export function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelName, setModelName] = useState("No model loaded");
  const [mode, setMode] = useState<TransformMode>("translate");
  const [selectedName, setSelectedName] = useState("Nothing selected");
  const [lighting, setLighting] = useState(true);
  const [hierarchy, setHierarchy] = useState<HierarchyItem[]>([]);
  const [panel, setPanel] = useState<"outliner" | "inspector" | "lighting" | "animation">("outliner");
  const [animations, setAnimations] = useState<AnimationItem[]>([]);
  const [activeAnimation, setActiveAnimation] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  const importModel = () => inputRef.current?.click();

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.glb$/i.test(file.name)) {
      setModelName("GLB required for this first importer");
      return;
    }
    if (modelUrl) URL.revokeObjectURL(modelUrl);
    setModelUrl(URL.createObjectURL(file));
    setModelName(file.name);
    setSelectedName("Nothing selected");
    setHierarchy([]);
    setAnimations([]);
    setActiveAnimation(null);
    setPlaying(false);
    event.target.value = "";
  };

  const selectItem = (item: HierarchyItem) => {
    setSelectedName(item.name);
    setPanel("inspector");
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <strong>SOFTCOD</strong>
          <span>softbody-collision-drip</span>
        </div>

        <div className="top-actions">
          <button className="light-button" onClick={() => setLighting((value) => !value)}>
            {lighting ? "Lights" : "Dark"}
          </button>
          <button className="import-button" onClick={importModel}>Import</button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".glb,model/gltf-binary"
          hidden
          onChange={onFile}
        />
      </header>

      <section className="editor-layout">
        <aside className="side-panel left-panel">
          <div className="panel-heading">
            <strong>Scene</strong>
            <span>{hierarchy.length}</span>
          </div>
          <div className="panel-tabs">
            <PanelButton active={panel === "outliner"} onClick={() => setPanel("outliner")}>Outliner</PanelButton>
            <PanelButton active={panel === "lighting"} onClick={() => setPanel("lighting")}>Light</PanelButton>
            <PanelButton active={panel === "animation"} onClick={() => setPanel("animation")}>Anim</PanelButton>
          </div>

          {panel === "outliner" && (
            <div className="outliner">
              {hierarchy.length === 0 ? (
                <div className="empty-panel">Import a GLB to inspect its scene.</div>
              ) : (
                hierarchy.map((item) => (
                  <button
                    key={item.id}
                    className={selectedName === item.name ? "tree-item selected" : "tree-item"}
                    onClick={() => selectItem(item)}
                  >
                    <span className="tree-icon">{item.type === "Mesh" ? "◇" : "○"}</span>
                    <span>{item.name}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {panel === "animation" && (
            <div className="animation-panel">
              {animations.length === 0 ? (
                <div className="empty-panel">No animation clips found in this GLB.</div>
              ) : (
                <>
                  <div className="animation-controls">
                    <button className="play-button" onClick={() => setPlaying((value) => !value)}>
                      {playing ? "Pause" : "Play"}
                    </button>
                    <button className="stop-button" onClick={() => { setPlaying(false); setActiveAnimation(null); }}>
                      Stop
                    </button>
                  </div>
                  <div className="animation-list">
                    {animations.map((item) => (
                      <button
                        key={item.name}
                        className={activeAnimation === item.name ? "animation-item active" : "animation-item"}
                        onClick={() => { setActiveAnimation(item.name); setPlaying(true); }}
                      >
                        <span>{item.name}</span>
                        <small>{item.duration.toFixed(2)}s</small>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {panel === "lighting" && (
            <div className="settings-panel">
              <div className="setting-row">
                <span>Viewport lighting</span>
                <button className={lighting ? "toggle on" : "toggle"} onClick={() => setLighting((value) => !value)}>
                  {lighting ? "ON" : "OFF"}
                </button>
              </div>
              <div className="empty-panel">Persistent light rigs will use the SNC lighting data model.</div>
            </div>
          )}
        </aside>

        <section className="viewport-shell">
          <Canvas
            camera={{ position: [3, 2, 5], fov: 45 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true }}
          >
            <SceneContents
              url={modelUrl}
              mode={mode}
              lighting={lighting}
              onSelect={(object) => setSelectedName(object?.name || object?.type || "Object")}
              onHierarchy={setHierarchy}
              onAnimations={setAnimations}
              activeAnimation={activeAnimation}
              playing={playing}
            />
          </Canvas>

          <aside className="tool-panel">
            <div className="file-name">{modelName}</div>
            <div className="selection">{selectedName}</div>
            <div className="tool-group">
              <button className={mode === "translate" ? "active" : ""} onClick={() => setMode("translate")}>Move</button>
              <button className={mode === "rotate" ? "active" : ""} onClick={() => setMode("rotate")}>Rotate</button>
              <button className={mode === "scale" ? "active" : ""} onClick={() => setMode("scale")}>Scale</button>
            </div>
            <div className="hint">Pinch to zoom · one finger to orbit · tap a mesh to select</div>
          </aside>
        </section>

        <aside className="side-panel right-panel">
          <div className="panel-heading">
            <strong>Inspector</strong>
            <span>Object</span>
          </div>
          <div className="inspector">
            <div className="inspector-title">{selectedName}</div>
            <div className="inspector-section">
              <span>Transform</span>
              <div className="transform-grid">
                <button onClick={() => setMode("translate")}>Move</button>
                <button onClick={() => setMode("rotate")}>Rotate</button>
                <button onClick={() => setMode("scale")}>Scale</button>
              </div>
            </div>
            <div className="empty-panel">Rig, material, morph, outfit, collision and physics properties will appear here as their editors land.</div>
          </div>
        </aside>
      </section>
    </main>
  );
}
