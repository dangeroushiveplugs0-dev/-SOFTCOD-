# SOFTCOD UI composition research

SOFTCOD is a 3D editor, so the viewport must remain the dominant surface while tools and inspection panels appear around it.

## Mobile composition

Compact screens use a layered composition:

1. Top bar: project/import actions.
2. Full viewport: model, camera, lights, gizmos.
3. Contextual bottom tool shelf: transform, selection, playback and current tool.
4. Bottom sheets/drawers for hierarchy, properties and advanced settings.
5. Floating contextual controls only when they directly manipulate the selected object.

Do not permanently consume viewport space with every possible panel.

## Medium/large composition

When enough width exists, switch to a multi-pane editor:

- Left: scene hierarchy/outliner.
- Center: viewport.
- Right: inspector/properties.
- Bottom: timeline when animation is active.

Panels should be collapsible so the viewport can reclaim space.

## Touch

Interactive controls should target at least 48dp equivalent touch areas. Use generous spacing and avoid tiny icon-only controls unless their hit target remains large.

Transform gizmos must remain visually compact but have forgiving hit areas. Touch gestures should not accidentally trigger UI controls.

## Responsive behavior

Use available window size rather than device-name assumptions.

Compact:
- bottom sheets
- horizontal tool shelf
- one inspector at a time

Medium:
- collapsible side panel + viewport
- optional inspector

Expanded:
- hierarchy + viewport + inspector
- optional timeline

The same scene state must survive layout changes.

## Composition rules

- Viewport gets priority.
- Selection context determines which tools appear.
- Advanced settings live behind panels, not on the main viewport.
- Keep primary actions reachable by thumb.
- Preserve clear hierarchy: project -> scene -> selection -> property.
- Use 4/8-based spacing rhythm where practical.
- Support mouse, keyboard and stylus in addition to touch.
- Never lock the UI to one aspect ratio.

## SOFTCOD editor shell

Planned shell:

TopBar
  Project / Import / Save / Undo / Redo

Viewport
  Scene + camera + lighting + transform gizmos

ToolShelf
  Select / Move / Rotate / Scale / Sculpt / Rig / Physics / Render

Panels
  Outliner / Inspector / Materials / Rig / Physics / Lighting

Timeline
  Animation / simulation / media tracks

This structure keeps the editor usable on a phone while allowing a desktop-like workspace on larger displays.
