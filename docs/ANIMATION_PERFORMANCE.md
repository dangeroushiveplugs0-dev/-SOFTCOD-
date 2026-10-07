# SOFTCOD animation and performance rules

## Two camera spaces

SOFTCOD keeps two cameras separate:

- **Editor Camera**: freely controlled by the user for modeling, rigging, physics and scene inspection.
- **Animation Camera**: the shot camera used to preview and eventually render the animation.

Changing the editor camera must never change the animation camera. The current editor view can be copied to the animation camera with **Set Shot From Current View**.

The animation camera is represented by keyframes containing position, rotation, field of view, frame and FPS data. The timeline will evaluate those keys independently of character animation tracks.

## Animation integrity

Performance optimization is allowed to reduce editor workload, but it must not alter the authored animation.

There are two update policies:

### Interactive viewport
Adaptive quality may:
- reduce update frequency for inactive/offscreen systems;
- lower LOD for distant models;
- pause sleeping physics;
- reduce expensive preview effects.

The active animation, selected object and animation camera remain full priority.

### Final playback/export
Final playback and rendering use deterministic updates:
- every required animation mixer advances for every frame;
- animation camera keys are evaluated for every output frame;
- physics uses the selected solver and fixed simulation settings;
- no interactive LOD shortcut may change the authored result;
- export uses the timeline as the source of truth.

This means performance systems are an editor optimization layer, not an animation-editing layer. A phone struggling to display six characters should not quietly rewrite frame 87 because humanity apparently decided real-time rendering was mandatory.

## Multi-model animation

Each model keeps its own skeleton and animation mixer. A shared scene timeline synchronizes the mixers.

Interaction data such as constraints, grabs, parent relationships and physics contacts will live at scene level rather than being baked into one character's skeleton.

## Camera preview workflow

1. Navigate freely with **Edit Cam**.
2. Use **Set Shot From Current View** to place the animation camera.
3. Switch to **Shot Cam** to inspect the actual animation framing.
4. Key the animation camera on the timeline.
5. Final rendering always uses **Shot Cam**, never the user's editor camera.
