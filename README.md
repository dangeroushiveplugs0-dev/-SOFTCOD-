# SOFTCOD

**SOFTCOD** = **softbody-collision-drip**

A mobile-first 3D rigging, animation, outfit, collision, and soft-body simulation workstation.

## Core direction

SOFTCOD owns the scene representation. Rendering, importing, optimization, and physics libraries are modular implementation details.

- GLB/glTF first, with modular FBX/OBJ/DAE importers.
- Skeletal rigging, skinning, morphs, shape keys, outfits, and animation.
- Rigid-body, collider, cloth, and soft-body simulation.
- Baked simulation/cache data.
- Full-fidelity native `.snc` assets.
- Multiple physics engines behind one SOFTCOD physics adapter API.

## Physics strategy

Initial candidates are **Rapier** and **Jolt Physics**. Bullet/Ammo and specialized solvers remain possible future adapters.

The important part is that SNC does not store a vendor's private physics state. It stores SOFTCOD's solver-independent physics description and baked results.

## Native SNC format

`.snc` is not a renamed GLB. It is planned as a versioned binary container capable of preserving meshes, materials, textures, skeletons, skinning, morphs, outfits, colliders, rigid bodies, soft bodies, cloth, constraints, animation, and baked simulation caches.

See `docs/ARCHITECTURE.md` and `docs/SNC_FORMAT.md`.

## Status

Early foundation stage. The repository now contains the architecture and initial web shell. Feature implementation comes next.
