import * as THREE from "three";

export default function detectBallCollisions({
  balls,
  overlapTolerance,
  maxSpeed,
  clampVelocity,
  onBallCollision,
}) {
  for (let i = 0; i < balls.length; i += 1) {
    for (let j = i + 1; j < balls.length; j += 1) {
      const ballA = balls[i];
      const ballB = balls[j];

      if (ballA.isPocketed || ballB.isPocketed) {
        continue;
      }

      const centerDistance = ballA.position.distanceTo(ballB.position);
      const touchDistance = ballA.radius + ballB.radius;

      if (centerDistance <= touchDistance) {

        const normal = ballB.position.clone().sub(ballA.position);
        // 🛑 تثبيت المحور Y لمنع أي دفع عمودي
        normal.y = 0; 
        
        const normalLength = normal.length();
        if (normalLength === 0) {
          continue;
        }

        normal.divideScalar(normalLength);

        const overlap = touchDistance - centerDistance;
        if (overlap > overlapTolerance) {
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
              
              // 🛑 نضمن بقاء الكرات على سطح الطاولة (Y = 0)
              ballA.position.y = 0;
              ballB.position.y = 0;
            }
          }
        }

        const relativeVelocity = ballB.velocity.clone().sub(ballA.velocity);
        // تصفير الفرق العمودي في السرعة
        relativeVelocity.y = 0; 

        const approachSpeed = relativeVelocity.dot(normal);

        if (approachSpeed < 0) {
          
          if (typeof onBallCollision === "function") {
            onBallCollision(ballA, ballB, Math.abs(approachSpeed));
          }

          const contactOffsetA = normal.clone().multiplyScalar(ballA.radius);
          const contactOffsetB = normal.clone().multiplyScalar(-ballB.radius);
          
          const surfaceVelocityA = ballA.velocity.clone().add(
            new THREE.Vector3().crossVectors(ballA.angularVelocity, contactOffsetA)
          );
          const surfaceVelocityB = ballB.velocity.clone().add(
            new THREE.Vector3().crossVectors(ballB.angularVelocity, contactOffsetB)
          );
          
          const relativeSurfaceVelocity = surfaceVelocityB.sub(surfaceVelocityA);
          relativeSurfaceVelocity.y = 0;

          const normalSurfaceSpeed = relativeSurfaceVelocity.dot(normal);
          const tangentialSurfaceVelocity = relativeSurfaceVelocity
            .clone()
            .addScaledVector(normal, -normalSurfaceSpeed);

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

          let impulseMagnitude =
            (-(1 + combinedRestitution) * approachSpeed) /
            (1 / massA + 1 / massB);

          const combinedMass = massA + massB;
          const maxImpulse = Math.max(combinedMass * maxSpeed, 1e-6);
          if (Math.abs(impulseMagnitude) > maxImpulse) {
            impulseMagnitude = Math.sign(impulseMagnitude) * maxImpulse;
          }

          const impulse = normal.clone().multiplyScalar(impulseMagnitude);
          impulse.y = 0; // 🛑 منع طاقة الاندفاع من تحريك الكرة للأعلى

          ballA.velocity.addScaledVector(impulse, -1 / massA);
          ballB.velocity.addScaledVector(impulse, 1 / massB);
          
          // 🛑 تصفير أي سرعة صعود وهبوط
          ballA.velocity.y = 0;
          ballB.velocity.y = 0;

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
            tangentialImpulse.y = 0;

            ballA.velocity.addScaledVector(tangentialImpulse, -1 / massA);
            ballB.velocity.addScaledVector(tangentialImpulse, 1 / massB);

            const transferScale = 0.2;
            const maxAngularDelta = 0.5;
            if (ballA.momentOfInertia > 0 && ballB.momentOfInertia > 0) {
              const impulseA = tangentialImpulse.clone().multiplyScalar(-1);
              const impulseB = tangentialImpulse;
              const torqueA = new THREE.Vector3().crossVectors(contactOffsetA, impulseA);
              const torqueB = new THREE.Vector3().crossVectors(contactOffsetB, impulseB);
              
              // لجعل الدوران يؤثر فقط على التدحرج الأفقي، نلغي عزم الدوران حول المحاور غير المرغوبة لو لزم الأمر
              const deltaOmegaA = torqueA.multiplyScalar(transferScale / ballA.momentOfInertia);
              const deltaOmegaB = torqueB.multiplyScalar(transferScale / ballB.momentOfInertia);
              
              if (deltaOmegaA.length() > maxAngularDelta) deltaOmegaA.setLength(maxAngularDelta);
              if (deltaOmegaB.length() > maxAngularDelta) deltaOmegaB.setLength(maxAngularDelta);
              
              ballA.angularVelocity.add(deltaOmegaA);
              ballB.angularVelocity.add(deltaOmegaB);

              const maxAngularSpeed = 40;
              const angularDeadzone = 0.005;
              if (ballA.angularVelocity.length() > maxAngularSpeed) ballA.angularVelocity.setLength(maxAngularSpeed);
              if (ballB.angularVelocity.length() > maxAngularSpeed) ballB.angularVelocity.setLength(maxAngularSpeed);
              if (ballA.angularVelocity.length() < angularDeadzone) ballA.angularVelocity.set(0, 0, 0);
              if (ballB.angularVelocity.length() < angularDeadzone) ballB.angularVelocity.set(0, 0, 0);
            }
          }

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
            const tangentialDir = tangentialVelocity.divideScalar(tangentialSpeed);
            const invMassSum = 1 / massA + 1 / massB;
            let frictionImpulseMagnitude = tangentialSpeed / invMassSum;
            const maxFrictionImpulse = combinedRoughness * Math.abs(impulseMagnitude);
            if (frictionImpulseMagnitude > maxFrictionImpulse) {
              frictionImpulseMagnitude = maxFrictionImpulse;
            }
            const frictionImpulse = tangentialDir.multiplyScalar(-frictionImpulseMagnitude);
            frictionImpulse.y = 0;

            ballA.velocity.addScaledVector(frictionImpulse, -1 / massA);
            ballB.velocity.addScaledVector(frictionImpulse, 1 / massB);
          }

          // إعادة تصدير السرعات الممسوحة
          ballA.velocity.y = 0;
          ballB.velocity.y = 0;

          clampVelocity(ballA);
          clampVelocity(ballB);
        }
      }
    }
  }
}
