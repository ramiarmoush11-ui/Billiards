import * as THREE from "three";

export default function detectBallCollisions({
  balls,
  overlapTolerance,
  maxSpeed,
  clampVelocity,
}) {
  // Distance means how far apart the two ball centers are.
  // With many balls, small errors can stack up, so we keep checks simple and stable.
  for (let i = 0; i < balls.length; i += 1) {
    for (let j = i + 1; j < balls.length; j += 1) {
      const ballA = balls[i];
      const ballB = balls[j];

      if (ballA.isPocketed || ballB.isPocketed) {
        continue;
      }

      const centerDistance = ballA.position.distanceTo(ballB.position);
      // Two balls touch when the center distance is less than or equal to their radii sum.
      const touchDistance = ballA.radius + ballB.radius;

      // If the centers are closer than the combined radii, the balls overlap/touch.
      if (centerDistance <= touchDistance) {
        console.log("Ball collision detected");

        // A vector is just a direction with a length.
        // This vector points from Ball A to Ball B.
        const normal = ballB.position.clone().sub(ballA.position);
        const normalLength = normal.length();
        if (normalLength === 0) {
          // If both centers are exactly the same, we cannot build a direction.
          continue;
        }

        // Normalization makes the vector length 1 so it only represents direction.
        // The collision normal tells us which way the collision is pointing.
        normal.divideScalar(normalLength);

        /* console.log(
          "Collision normal:",
          normal.x.toFixed(3),
          normal.y.toFixed(3),
          normal.z.toFixed(3),
        ); */

        // Overlap means the balls are slightly inside each other.
        // This can happen because movement is updated in small steps each frame.
        const overlap = touchDistance - centerDistance;
        if (overlap > overlapTolerance) {
          // We separate them along the collision normal to stop the sinking.
          // Heavier balls resist movement more, so they get less correction.
          const massA = ballA.getTotalMass();
          const massB = ballB.getTotalMass();
          if (massA > 0 && massB > 0) {
            const invMassA = 1 / massA;
            const invMassB = 1 / massB;
            const radiusSum = ballA.radius + ballB.radius;
            const radiusRatioA = radiusSum > 0 ? ballA.radius / radiusSum : 0.5;
            const radiusRatioB = radiusSum > 0 ? ballB.radius / radiusSum : 0.5;
            const weightA = invMassA * radiusRatioA;
            const weightB = invMassB * radiusRatioB;
            const weightTotal = weightA + weightB;

            if (weightTotal > 0) {
              const correctionA = overlap * (weightA / weightTotal);
              const correctionB = overlap * (weightB / weightTotal);

              ballA.position.addScaledVector(normal, -correctionA);
              ballB.position.addScaledVector(normal, correctionB);
            }
          }
          console.log("Ball overlap corrected");
        }

        // Relative velocity means: how fast Ball B is moving compared to Ball A.
        const relativeVelocity = ballB.velocity.clone().sub(ballA.velocity);

        // The dot product tells us if two directions point the same way.
        // If the dot is negative, the balls are moving toward each other.
        const approachSpeed = relativeVelocity.dot(normal);

        if (approachSpeed < 0) {
          console.log("Balls approaching");

          // Tangential relative velocity at the contact point (includes spin).
          const contactOffsetA = normal.clone().multiplyScalar(ballA.radius);
          const contactOffsetB = normal.clone().multiplyScalar(-ballB.radius);
          const surfaceVelocityA = ballA.velocity
            .clone()
            .add(
              new THREE.Vector3().crossVectors(
                ballA.angularVelocity,
                contactOffsetA,
              ),
            );
          const surfaceVelocityB = ballB.velocity
            .clone()
            .add(
              new THREE.Vector3().crossVectors(
                ballB.angularVelocity,
                contactOffsetB,
              ),
            );
          const relativeSurfaceVelocity =
            surfaceVelocityB.sub(surfaceVelocityA);
          const normalSurfaceSpeed = relativeSurfaceVelocity.dot(normal);
          const tangentialSurfaceVelocity = relativeSurfaceVelocity
            .clone()
            .addScaledVector(normal, -normalSurfaceSpeed);
          console.log(
            "Tangential contact speed:",
            tangentialSurfaceVelocity.length().toFixed(4),
          );

          // Impulse is a quick push that changes velocity instantly.
          // Restitution controls how bouncy the collision is (1 = perfect bounce).
          // Heavier balls resist velocity change more than lighter balls.
          const combinedRestitution = THREE.MathUtils.clamp(
            ballA.restitution * ballB.restitution,
            0,
            1,
          );

          const massA = ballA.getTotalMass();
          const massB = ballB.getTotalMass();
          if (massA <= 0 || massB <= 0) {
            continue;
          }

          // Simple impulse magnitude along the collision normal.
          let impulseMagnitude =
            (-(1 + combinedRestitution) * approachSpeed) /
            (1 / massA + 1 / massB);

          // Limit the impulse using a safety clamp that scales with total mass.
          const combinedMass = massA + massB;
          const maxImpulse = Math.max(combinedMass * maxSpeed, 1e-6);
          if (Math.abs(impulseMagnitude) > maxImpulse) {
            impulseMagnitude = Math.sign(impulseMagnitude) * maxImpulse;
            console.log("Ball impulse clamped");
          }

          // Both balls are affected: one gains speed, the other loses speed.
          const impulse = normal.clone().multiplyScalar(impulseMagnitude);
          ballA.velocity.addScaledVector(impulse, -1 / massA);
          ballB.velocity.addScaledVector(impulse, 1 / massB);

          // Small tangential impulse based on contact-point motion (spin aware).
          const tangentialSurfaceSpeed = tangentialSurfaceVelocity.length();
          if (tangentialSurfaceSpeed > 1e-6) {
            const tangentialSurfaceDir = tangentialSurfaceVelocity
              .clone()
              .divideScalar(tangentialSurfaceSpeed);
            const invMassSum = 1 / massA + 1 / massB;
            let tangentialImpulseMagnitude =
              (tangentialSurfaceSpeed / invMassSum) * 0.1;
            const maxTangentialImpulse = 0.25 * Math.abs(impulseMagnitude);
            if (tangentialImpulseMagnitude > maxTangentialImpulse) {
              tangentialImpulseMagnitude = maxTangentialImpulse;
            }
            const tangentialImpulse = tangentialSurfaceDir.multiplyScalar(
              -tangentialImpulseMagnitude,
            );
            ballA.velocity.addScaledVector(tangentialImpulse, -1 / massA);
            ballB.velocity.addScaledVector(tangentialImpulse, 1 / massB);

            // Small angular transfer from tangential impulse (subtle spin exchange).
            const transferScale = 0.2;
            const maxAngularDelta = 0.5;
            if (ballA.momentOfInertia > 0 && ballB.momentOfInertia > 0) {
              const impulseA = tangentialImpulse.clone().multiplyScalar(-1);
              const impulseB = tangentialImpulse;
              const torqueA = new THREE.Vector3().crossVectors(
                contactOffsetA,
                impulseA,
              );
              const torqueB = new THREE.Vector3().crossVectors(
                contactOffsetB,
                impulseB,
              );
              const deltaOmegaA = torqueA.multiplyScalar(
                transferScale / ballA.momentOfInertia,
              );
              const deltaOmegaB = torqueB.multiplyScalar(
                transferScale / ballB.momentOfInertia,
              );
              if (deltaOmegaA.length() > maxAngularDelta) {
                deltaOmegaA.setLength(maxAngularDelta);
              }
              if (deltaOmegaB.length() > maxAngularDelta) {
                deltaOmegaB.setLength(maxAngularDelta);
              }
              ballA.angularVelocity.add(deltaOmegaA);
              ballB.angularVelocity.add(deltaOmegaB);

              /* console.log(
                "A spin:",
                ballA.angularVelocity.length().toFixed(3),
                "B spin:",
                ballB.angularVelocity.length().toFixed(3),
              );*/
              // Final safety caps to prevent angular blowups and micro-spinning.
              const maxAngularSpeed = 40;
              const angularDeadzone = 0.005;
              if (ballA.angularVelocity.length() > maxAngularSpeed) {
                ballA.angularVelocity.setLength(maxAngularSpeed);
              }
              if (ballB.angularVelocity.length() > maxAngularSpeed) {
                ballB.angularVelocity.setLength(maxAngularSpeed);
              }
              if (ballA.angularVelocity.length() < angularDeadzone) {
                ballA.angularVelocity.set(0, 0, 0);
              }
              if (ballB.angularVelocity.length() < angularDeadzone) {
                ballB.angularVelocity.set(0, 0, 0);
              }
            }
          }

          // Tangential friction damps sliding along the contact surface.
          const combinedRoughness = THREE.MathUtils.clamp(
            ballA.friction * ballB.friction,
            0,
            1,
          );
          const tangentialVelocity = relativeVelocity
            .clone()
            .addScaledVector(normal, -approachSpeed);
          const tangentialSpeed = tangentialVelocity.length();
          if (tangentialSpeed > 1e-6 && combinedRoughness > 0) {
            const tangentialDir =
              tangentialVelocity.divideScalar(tangentialSpeed);
            const invMassSum = 1 / massA + 1 / massB;
            let frictionImpulseMagnitude = tangentialSpeed / invMassSum;
            const maxFrictionImpulse =
              combinedRoughness * Math.abs(impulseMagnitude);
            if (frictionImpulseMagnitude > maxFrictionImpulse) {
              frictionImpulseMagnitude = maxFrictionImpulse;
            }
            const frictionImpulse = tangentialDir.multiplyScalar(
              -frictionImpulseMagnitude,
            );
            ballA.velocity.addScaledVector(frictionImpulse, -1 / massA);
            ballB.velocity.addScaledVector(frictionImpulse, 1 / massB);
          }

          clampVelocity(ballA);
          clampVelocity(ballB);

          console.log("Ball impulse applied");
        } else {
          console.log("Balls separating");
        }
      }
    }
  }
}
