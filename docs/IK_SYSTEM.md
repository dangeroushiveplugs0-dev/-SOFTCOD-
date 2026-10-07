# SOFTCOD IK and secondary motion

SOFTCOD uses one IK system with two authored deformation modes.

## Human IK

Human IK is intended for anatomically constrained character rigs.

- Bone lengths are preserved during IK.
- The solver may reach only as far as the authored chain permits.
- Stretch ratio is locked to 1.0.
- Secondary motion is handled separately from bone length, so normal IK does not make the character's skeleton visibly rubbery.
- Soft-body regions can still react to acceleration, contact, and impact through secondary motion or the physics system.

## Stylized IK

Stylized IK intentionally permits limited bone-chain stretch.

- Default maximum stretch ratio is 1.15.
- Stretch is temporary deformation, not a new rest pose.
- Secondary motion applies inertia and a return force so the chain moves back toward authored proportions.
- A stretched chain does not permanently redefine the authored rig.

## Impact and ripple layer

The IK solver exposes the solved pose and stretch amount to the secondary-motion system.

That layer can drive local displacement, inertial lag, spring-back, contact or impact ripple, soft-body regions, cloth or outfit response, and baked simulation.

## Evaluation order

1. Evaluate authored animation.
2. Evaluate IK targets and pole vectors.
3. Solve Human or Stylized IK.
4. Apply temporary stretch constraints.
5. Evaluate secondary motion and soft-body response.
6. Apply final skinning transforms.
7. Render.

Interactive preview may throttle secondary-motion updates for performance. Final animation baking/export must evaluate every authored frame without interactive throttling.

## Rig UI

The Rig panel should expose IK chain, mode, target, pole, weight, stretch limit, stiffness, damping, inertia, return speed, and impact/ripple strength.

Human mode keeps advanced stretch controls hidden or locked. Stylized mode exposes the stretch controls.
