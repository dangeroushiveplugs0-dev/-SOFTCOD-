import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls, useGLTF, Grid, Environment } from "@react-three/drei";
import * as THREE from "three";

type TransformMode = "translate" | "rotate" | "scale";

function LoadedModel({ url, mode, onSelect }: { url: string; mode: TransformMode; onSelect: (o: THREE.Object3D | null) => void }) {
  const { scene } = useGLTF(url);
  const [selected, setSelected] = useState<THREE.Object3D | null>(null);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

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

function SceneContents({ url, mode, onSelect }: { url: string | null; mode: TransformMode; onSelect: (o: THREE.Object3D | null) => void }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(3, 2, 5);
  }, [camera]);

  return (
    <>
      <color attach="background" args={["#0b0d10"]} />
      <ambientLight intensity={1.5} />
      <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
      <Grid infiniteGrid cellSize={0.5} sectionSize={2} fadeDistance={30} />
      <Environment preset="city" />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      {url ? (
        <Suspense fallback={null}>
          <LoadedModel url={url} mode={mode} onSelect={onSelect} />
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

export function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelName, setModelName] = useState("No model loaded");
  const [mode, setMode] = useState<TransformMode>("translate");
  const [selectedName, setSelectedName] = useState("Nothing selected");

  const importModel = () => inputRef.current?.click();

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(glb|gltf)$/i.test(file.name)) {
      setModelName("GLB/glTF required for this first importer");
      return;
    }
    if (modelUrl) URL.revokeObjectURL(modelUrl);
    setModelUrl(URL.createObjectURL(file));
    setModelName(file.name);
    setSelectedName("Nothing selected");
    event.target.value = "";
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div><strong>SOFTCOD</strong><span>softbody-collision-drip</span></div>
        <button className="import-button" onClick={importModel}>Import</button>
        <input ref={inputRef} type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" hidden onChange={onFile} />
      </header>

      <section className="viewport-shell">
        <Canvas camera={{ position: [3, 2, 5], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
          <SceneContents url={modelUrl} mode={mode} onSelect={(object) => setSelectedName(object?.name || object?.type || "Object")} />
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
    </main>
  );
}
