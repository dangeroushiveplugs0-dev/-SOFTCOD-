# SNC Native Asset Format

Draft: SNC v0.1 architecture.

SNC means SOFTCOD Native Container. Extension: .snc.

SNC is the full-fidelity native asset format for SOFTCOD. It is not a renamed GLB. It preserves SOFTCOD-specific data, especially physics setup and baked simulation results.

## Container

A binary container with a small fixed header followed by a directory/chunk system.

Header: magic, format version, feature flags, directory information.
Manifest: asset metadata, coordinate system, units, application/version, feature requirements.
Scene: nodes, meshes, materials, textures/resources, skeletons, skinning, morphs.
Outfits: clothing meshes, attachments, material references, cloth configuration, collision relationships.
Physics: rigid bodies, colliders, soft bodies, cloth, constraints, solver-independent parameters.
Animation: keyframes, clips, baked transforms, simulation cache descriptors.
Cache: large binary simulation data.

## Solver independence

SNC stores SOFTCOD's physics description, not raw internal memory/state from Rapier, Jolt, Bullet, or another engine.

## Versioning

Every SNC file has a major version, minor version, feature flags, and required-feature declarations. Unsupported optional features should be reported instead of invalidating the whole asset.

## Simulation cache

Large numerical data is stored as binary arrays, not huge JSON structures. Examples include vertex positions, velocities, bone transforms, baked cloth frames, and soft-body deformation frames.

## Resources

SNC supports the design of embedded resources for portable assets and external references for projects that intentionally keep textures/files separate.
