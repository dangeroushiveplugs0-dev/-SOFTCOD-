# SNC Native Asset Format

Draft: SNC v0.2 architecture.

SNC means SOFTCOD Native Container. Extension: `.snc`.

SNC is the full-fidelity native asset/project format for SOFTCOD. It is not a renamed GLB. It preserves SOFTCOD-specific data, especially rigging, outfits, physics setup, baked simulation results, and optional rendered media.

## Container

SNC uses a binary container with a small fixed header followed by a directory/chunk system.

Core chunks:

- **Header:** magic, format version, feature flags, directory information.
- **Manifest:** asset metadata, coordinate system, units, application/version, feature requirements.
- **Scene:** nodes, meshes, materials, textures/resources, skeletons, skinning, morphs/shape keys.
- **Outfits:** clothing meshes, attachments, material references, cloth configuration, collision relationships.
- **Rigging:** bones, constraints, controllers, retargeting metadata, skinning profiles.
- **Physics:** rigid bodies, colliders, soft bodies, cloth, constraints, solver-independent parameters.
- **Animation:** keyframes, clips, baked transforms, simulation cache descriptors.
- **Cache:** large binary simulation data such as vertex positions, velocities, bone transforms, cloth frames, and soft-body deformation frames.
- **Media:** optional rendered video/audio and presentation metadata.
- **Resources:** embedded or external textures, audio, video, meshes, and other project resources.
- **Preview:** optional thumbnails and lightweight preview data.

## Video and audio

SNC can contain a finished rendered presentation in addition to the editable 3D asset.

A media track may contain:

- rendered video frames or an encoded video payload;
- one or more audio tracks;
- frame rate and duration;
- resolution and pixel format metadata;
- audio sample rate, channel layout, and duration;
- synchronization/timebase information;
- optional subtitles/captions;
- a link to the animation/simulation range that produced the render.

### MP4 compatibility

SOFTCOD should support exporting the media track to standard **MP4 with sound** where the selected codecs and platform support permit it.

For browser/mobile builds, the preferred media pipeline is:

1. Use native browser/mobile codecs when available, such as WebCodecs/MediaRecorder.
2. Fall back to a WASM media pipeline such as FFmpeg.wasm when practical.
3. Keep encoding optional and off the simulation/render thread.

WebCodecs provides flexible audio/video encoding and decoding interfaces, while FFmpeg.wasm can provide browser-side media conversion. Exact codec availability depends on the platform and build. 

SNC itself should **not pretend to be an MP4 file**. An `.snc` file will normally not open in Android's generic video player because the SNC header and directory precede its media chunks. SOFTCOD can open the SNC and play the embedded media internally, then export the media as MP4/WebM/MKV as supported.

This preserves the important distinction:

**SNC = editable 3D asset + physics + animation + optional finished media**

**MP4 = portable finished video delivery**

## Media chunk design

The media directory entry should identify:

- media kind: video/audio/subtitle;
- codec/container;
- MIME type;
- byte range or child chunk ID;
- duration;
- timebase;
- stream ID;
- optional checksum;
- whether the stream is embedded or external.

For large videos, the actual encoded media should live in dedicated chunks rather than being loaded into the entire project manifest.

SNC should allow multiple media outputs, for example:

- viewport preview;
- final render;
- animation preview;
- simulation comparison;
- alternate camera render;
- audio-only render.

## Solver independence

SNC stores SOFTCOD's physics description, not raw internal memory/state from Rapier, Jolt, Bullet, or another engine.

A baked cache may additionally record:

- solver family and version;
- adapter version;
- timestep/substeps;
- deterministic/bake settings;
- scene hash;
- physics setup hash;
- cache format version.

These values describe provenance and reproducibility. They must not make the SNC asset dependent on one solver for basic loading.

## Versioning

Every SNC file has a major version, minor version, feature flags, and required-feature declarations. Unsupported optional features should be reported instead of invalidating the whole asset.

## Simulation cache

Large numerical data is stored as binary arrays, not huge JSON structures. Examples include vertex positions, velocities, bone transforms, baked cloth frames, soft-body deformation frames, and particle state.

Cache data should support compression and sparse/keyframe strategies so mobile devices do not need to store every possible intermediate representation.

## Resources

SNC supports embedded resources for portable assets and external references for projects that intentionally keep textures/files separate.

Resource entries should include stable IDs so materials, meshes, animation clips, physics objects, outfits, and media streams can reference the same resource without relying on fragile filenames.

## Recommended file behavior

When the user opens an SNC:

1. Load the manifest and scene structure.
2. Show the 3D asset immediately using lightweight preview resources.
3. Load high-resolution textures and simulation caches on demand.
4. Make animation, physics, and media tracks available from the same timeline.
5. Allow the user to edit the asset without destroying the existing baked result.
6. Allow re-baking and replacement of individual cache/media outputs.

## Lighting chunk data

The SNC scene stores editable lighting descriptors in the scene/lighting data, including stable IDs, light type, color, intensity, transforms, attenuation/range, spot parameters, and shadow settings. Lighting remains separate from baked render output so lights can be edited without rewriting rendered media. The renderer may map these descriptors to Three.js light types; for example, directional lights use a target for their direction and point/spot/directional lights can use shadow maps. Three.js documents these behaviors and the associated shadow tradeoffs. citeturn0search2turn0search4turn0search5
