# SOFTCOD Lighting

Lighting is a first-class scene system, not a renderer-only convenience.

## Planned light types

- Ambient
- Hemisphere
- Directional / sun
- Point
- Spot
- Future area/rectangular lights

Each light has a stable scene ID and editable properties for color, intensity, position, rotation, range, decay, cone angle, penumbra, and shadow settings where supported.

## Editor requirements

The lighting editor should eventually provide:

- Light objects in the scene hierarchy.
- Selectable light gizmos.
- Move and rotate controls.
- Visible light direction/range/cone helpers.
- Color and intensity controls.
- Shadow enable/quality controls.
- Per-light visibility.
- Solo/isolate light.
- Preview/render lighting modes.
- Mobile touch-friendly controls.

## Render architecture

SOFTCOD scene lighting is renderer-independent at the scene-description level. Three.js is the first renderer implementation.

Lighting descriptions belong in SNC scene data so a project retains its lighting setup when reopened.

Baked lighting should be treated separately from editable light descriptions. A user changing a light must not silently destroy an existing animation or physics cache.

## Future

Area lights, image-based lighting, environment maps, physically based exposure, tone mapping, and light baking can be added without changing the core scene representation.
