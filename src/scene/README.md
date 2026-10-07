# Scene layer

This layer owns the editable scene representation exposed by imported assets.

Current modules:

- `inspectGLTF.ts`: extracts mesh, material, skeleton/bone, morph-target, and animation metadata from a GLB/glTF load result.
- `sceneHierarchy.ts`: converts the Three.js object graph into a reusable flat hierarchy for an eventual mobile scene tree.

Three.js Object3D traversal visits an object and its descendants, while GLTFLoader exposes the loaded scene, multiple scenes, cameras, and animation clips. This makes the scene graph a useful first inspection layer before SOFTCOD converts assets into its native editable representation. citeturn0search0turn0search1
