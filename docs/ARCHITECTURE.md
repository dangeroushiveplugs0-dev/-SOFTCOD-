# SOFTCOD Architecture

SOFTCOD owns the scene representation. External rendering, import, optimization, media, and physics libraries are replaceable implementation details.

## Core pipeline

**Import -> Normalize -> Rig/Animate -> Simulate -> Bake -> Render -> Package**

The same scene can therefore produce both:

- an editable `.snc` asset;
- a finished MP4/WebM/MKV render with audio.

## Physics adapter

UI code must never depend directly on a physics vendor. The adapter layer provides:

- world creation;
- rigid bodies;
- colliders;
- soft bodies;
- cloth;
- constraints;
- character/ragdoll interfaces;
- stepping;
- state readback;
- baking;
- cache serialization.

Candidate backends include Rapier, Jolt, and Bullet, with specialized deformable solvers considered separately. Rapier currently provides rigid bodies, joints, soft bodies, cloth/deformable solids, snapshots, JavaScript/WASM support, and Apache-2.0 licensing. Jolt provides rigid-body and soft-body simulation, Android and WebAssembly targets, and MIT licensing. Bullet provides rigid-body, soft-body, cloth, rope, and deformable-volume simulation under the zlib license. 

## Multi-solver strategy

SOFTCOD should not force every simulation type through one engine.

A scene may use:

- one backend for rigid-body/collision work;
- another backend for cloth or specialized soft-body work;
- a future hair/strand solver;
- custom deterministic or offline baking solvers.

The adapter layer converts all results back into SOFTCOD's scene representation.

## Simulation lifecycle

**Setup -> Preview -> Tune -> Bake -> SimulationCache -> Render -> SNC**

Preview mode should prioritize responsiveness. Bake mode may use more substeps, higher solver iterations, higher-quality collision meshes, and longer offline computation.

## Rendering and media

The initial renderer is Three.js through React Three Fiber/Drei.

Media export is a separate pipeline from simulation:

**Scene/Animation/Cache -> Render Frames -> Video Encoder/Muxer -> Media Track -> SNC and/or MP4**

On web/mobile, SOFTCOD should prefer platform-native media APIs where available. WebCodecs exposes audio/video codec interfaces, while FFmpeg.wasm is a possible WASM fallback for conversion and muxing. Encoding must run outside the interactive simulation/render loop whenever possible.

## Timeline

SOFTCOD should have one shared timeline for:

- skeletal animation;
- morph/shape-key animation;
- outfit animation;
- physics preview;
- baked simulation cache;
- audio;
- rendered video;
- camera animation.

This allows a simulation and its final render to remain synchronized instead of inventing several unrelated clocks, a favorite human tradition.

## Planned structure

src/core
src/scene
src/animation
src/rigging
src/physics/adapters
src/physics/collision
src/physics/softbody
src/physics/cloth
src/physics/hair
src/importers
src/exporters/snc
src/media
src/media/codecs
src/media/muxers
src/rendering
src/gizmos
src/ui
src/workers
src/utilities

## Mobile/browser performance

- WASM physics where suitable.
- Native Android/iOS backends where they materially improve performance.
- Meshoptimizer for geometry optimization.
- Draco for compressed glTF assets.
- KTX2/Basis for GPU-friendly textures.
- Coarse simulation meshes with high-detail render meshes driven by skinning/deformation.
- Worker-thread simulation and media encoding.
- Baked caches for expensive simulations.
- Streaming resource loading instead of loading an entire SNC into memory.
- Explicit memory budgets for mobile devices.

## Format interoperability

Importers normalize external assets into SOFTCOD's scene model:

GLB/glTF -> native scene
FBX -> native scene
OBJ -> native scene
DAE -> native scene
SNC -> native scene + native physics/animation/media data

Exporters can produce:

SNC -> full editable SOFTCOD asset
SNC -> GLB/glTF for general 3D interchange
SNC -> MP4/WebM/MKV for finished video
SNC -> image sequences where lossless/offline workflows require them
