# SOFTCOD IK and secondary motion

SOFTCOD supports per-model and per-chain IK modes. Different models in the same scene may use different IK behavior.

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

## Per-model independence

IK configuration belongs to the individual model rig, not to the global scene.

For example:

- Character A can use Human IK.
- Character B can use Stylized IK.
- A prop can have no IK at all.
- One character can also mix modes across chains when appropriate.

Each model retains its own IK rig, targets, poles, rest lengths, and secondary-motion state.

## Impact and ripple layer

The IK solver exposes the solved pose and stretch amount to the secondary-motion system.

That layer can drive local displacement, inertial lag, spring-back, contact or impact ripple, soft-body regions, cloth or outfit response, and baked simulation.

## Evaluation order

1. Evaluate authored animation.
2. Evaluate each model's IK targets and pole vectors.
3. Solve each model's IK chains using that model's selected mode.
4. Apply temporary stretch constraints.
5. Evaluate secondary motion and soft-body response.
6. Apply final skinning transforms.
7. Render.

Interactive preview may throttle secondary-motion updates for performance. Final animation baking/export must evaluate every authored frame without interactive throttling.

## Rig UI

The Rig panel should expose the selected model's IK chains, mode, target, pole, weight, stretch limit, stiffness, damping, inertia, return speed, and impact/ripple strength.

Human mode keeps advanced stretch controls hidden or locked. Stylized mode exposes the stretch controls.
