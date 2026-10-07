# SOFTCOD Architecture

SOFTCOD owns the scene representation. External rendering, import, optimization, and physics libraries are replaceable implementation details.

## Physics adapter

UI code must never depend directly on a physics vendor. The adapter layer provides world creation, rigid bodies, colliders, soft bodies, constraints, stepping, state readback, and baking.

## Simulation

Setup -> Preview -> Tune -> Bake -> SimulationCache -> SNC

## Planned structure

src/core
src/scene
src/animation
src/rigging
src/physics/adapters
src/physics/collision
src/physics/softbody
src/physics/cloth
src/importers
src/exporters/snc
src/rendering
src/gizmos
src/ui
src/workers
src/utilities
