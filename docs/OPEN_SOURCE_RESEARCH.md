# SOFTCOD Open-Source Research

Research snapshot: October 2026.

The goal is not to collect libraries merely because they exist. Each candidate is evaluated against SOFTCOD's actual requirements: mobile/browser support, rigging/animation integration, deformable simulation, baking, licensing, and ability to coexist behind an adapter.

## Physics

### Rapier
Repository: dimforge/rapier

Strong candidate for the first web/mobile backend. Rapier provides 2D/3D rigid-body physics, joints, contact queries, snapshots, optional determinism, JavaScript/WASM bindings, and soft-body simulation. Its soft-body system covers ropes, cloth, and deformable solids and can interact with rigid bodies. Apache-2.0. 

**SOFTCOD role:** primary WASM-friendly general physics backend.

### Jolt Physics
Repository: jrouwe/JoltPhysics

Strong native/mobile candidate. Jolt supports Android and WebAssembly and provides rigid-body physics, constraints, character/ragdoll features, and soft bodies including cloth-like deformables. MIT licensed.

**SOFTCOD role:** high-performance native backend and possible WASM backend.

### Bullet
Repository: bulletphysics/bullet3

Long-established C++ engine with rigid bodies, collision detection, soft bodies, cloth, ropes, and deformable volumes. The core source is zlib licensed.

**SOFTCOD role:** compatibility/reference backend and possible native fallback. It should not automatically become the default just because it has been around since humans were still naming things 'next generation'.

### PositionBasedDynamics
Repository: InteractiveComputerGraphics/PositionBasedDynamics

MIT-licensed library for physically based simulation of rigid bodies, deformable solids, and fluids.

**SOFTCOD role:** specialist/reference solver for future cloth, deformable, and research-quality baking features.

## Collision and geometry

SOFTCOD should separate collision representation from render geometry.

Recommended layers:

- primitive colliders for fast character/body collision;
- simplified convex hulls for rigid collision;
- coarse cloth/soft-body meshes for simulation;
- high-detail meshes for rendering;
- optional continuous collision detection;
- broad-phase spatial acceleration;
- ray/sweep/overlap queries for gizmos and selection.

## Animation and rigging

Three.js provides the initial rendering-side foundation for SkinnedMesh, Skeleton, AnimationMixer, loaders, cameras, raycasting, and materials.

React Three Fiber/Drei can provide integration components such as orbit and transform controls while SOFTCOD keeps its actual rigging state independent of UI widgets.

Open-source animation-editor projects such as Roboticela/Animator and custom GLB animation editors are useful references for:

- bone hierarchy editing;
- transform gizmos;
- keyframe timelines;
- animation clips;
- playback;
- GLB animation import/export.

These should be treated as architectural references rather than copied wholesale.

## Asset processing

### meshoptimizer
Useful for vertex/index optimization, simplification, compression, and glTF processing. Particularly valuable for mobile memory and bandwidth.

### Draco
Useful for compressed glTF geometry. SOFTCOD should decode it at import time and optionally retain compressed resources.

### Basis Universal / KTX2
Useful for GPU texture compression/transcoding and reducing mobile texture memory.

### glTF pipeline tooling
Useful for GLB/glTF processing, texture embedding/extraction, and Draco workflows.

### Assimp
Broad native importer reference for FBX, OBJ, DAE, glTF and many other formats. It is useful for future native import/conversion coverage, but SOFTCOD should not make its internal scene model identical to Assimp's data structures.

## Baking and caches

SOFTCOD should treat baked simulation as a first-class artifact.

A bake record should include:

- source scene hash;
- solver adapter and version;
- simulation settings;
- frame range;
- sample rate;
- cache format version;
- compressed numerical data;
- optional checksum.

The editable setup and baked result should coexist. Changing a physics parameter invalidates the relevant bake rather than destroying the entire project.

## Video/audio

### WebCodecs
W3C WebCodecs provides flexible interfaces for audio/video encoding and decoding. It is attractive for browser-native pipelines because it can use codecs already implemented by the platform.

### FFmpeg / FFmpeg.wasm
FFmpeg is the broad compatibility fallback for transcoding, muxing, demuxing, audio, and video. FFmpeg.wasm provides a WebAssembly/JavaScript route for browser-side media work, though codec availability, bundle size, performance, and licensing vary by build.

**SOFTCOD media strategy:**

Native codec/WebCodecs first -> FFmpeg/WASM fallback -> optional native FFmpeg pipeline on desktop/native builds.

Do not encode video on the main UI thread.

## Container and interchange research

SNC should remain SOFTCOD's own format rather than trying to replace every established interchange standard.

Use:

- glTF/GLB for general 3D interchange;
- MP4/WebM/MKV for finished video;
- common image/audio formats for external resources;
- SNC for the complete editable asset and its physics/animation/cache state.

SNC may embed these standard payloads as resource chunks. It should not reinterpret an MP4 into an entirely new video codec merely to prove a point.

## Licensing policy

Every third-party dependency must have its license recorded before shipping.

Current promising candidates:

| Library | Main use | License | Initial status |
|---|---|---|---|
| Rapier | rigid + soft-body physics | Apache-2.0 | strong candidate |
| Jolt | native rigid + soft-body physics | MIT | strong candidate |
| Bullet | rigid + soft-body/cloth | zlib | fallback/reference |
| PositionBasedDynamics | deformable specialist | MIT | research/specialist |
| Three.js | renderer/loaders | MIT | renderer |
| React Three Fiber | React renderer bridge | MIT | UI/render bridge |
| meshoptimizer | geometry optimization | MIT | performance |
| Draco | geometry compression | Apache-2.0 | performance |
| Basis Universal | texture compression | Apache-2.0 | performance |
| FFmpeg | media processing | LGPL/GPL depending on configuration and linked components | carefully selected builds |

License data must be rechecked against the exact versions actually bundled into SOFTCOD. A library name alone is not a license bill of materials.

## Recommended first stack

1. Three.js + React Three Fiber/Drei for the initial viewer/editor.
2. Rapier for the first browser/WASM physics implementation.
3. Jolt as the native/mobile high-performance backend.
4. Bullet as compatibility/reference and optional fallback.
5. PositionBasedDynamics as a specialist deformable solver candidate.
6. meshoptimizer + Draco + KTX2/Basis for mobile asset performance.
7. WebCodecs for native browser media encoding when supported.
8. FFmpeg/WASM fallback for broader media conversion.
9. SNC as the editable, solver-independent project container.
10. MP4/WebM/MKV as finished-media exports.

The architecture deliberately leaves room for additional specialized solvers later instead of welding SOFTCOD to the first physics library that happens to compile.
