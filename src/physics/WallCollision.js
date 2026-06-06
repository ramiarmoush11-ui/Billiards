import * as THREE from "three";

export default function handleWallCollisions(
  ball,
  bounds,
  restitution,
  wallFriction
) {
  if (!bounds) return;

  // Side spin influence on bounce (tunable, subtle).
  const spinBounceFactor = 0.015;
  const maxSpinKick = 0.2;
  // Side spin absorption on wall contact (tunable, subtle).
  const spinDampingFactor = 0.05;

  const { minX, maxX, minZ, maxZ } = bounds;
  // Clamp to keep values in a stable range (prevents accidental energy gain).
  const clampedRestitution = THREE.MathUtils.clamp(restitution, 0, 1);
  const clampedWallFriction = THREE.MathUtils.clamp(wallFriction, 0, 1);

  // Collision normal: for axis-aligned walls, the normal points along X or Z.
  // Reflection: flip the velocity component along the normal; keep the tangent.
  if (ball.position.x + ball.radius > maxX) {
    ball.position.x = maxX - ball.radius;
    // Restitution flips the normal axis (bounce) and reduces its energy.
    ball.velocity.x *= -clampedRestitution;
    // Wall friction reduces the tangential axis after impact (slight energy loss).
    ball.velocity.z *= 1 - clampedWallFriction;
    const spinKick = THREE.MathUtils.clamp(
      ball.angularVelocity.y * spinBounceFactor,
      -maxSpinKick,
      maxSpinKick
    );
    ball.velocity.z += spinKick;
    const spin = ball.angularVelocity.y;
    const damped = spin * (1 - spinDampingFactor);
    ball.angularVelocity.y = spin === 0 ? 0 : (Math.sign(damped) === Math.sign(spin) ? damped : 0);
  } else if (ball.position.x - ball.radius < minX) {
    ball.position.x = minX + ball.radius;
    // Restitution flips the normal axis (bounce) and reduces its energy.
    ball.velocity.x *= -clampedRestitution;
    // Wall friction reduces the tangential axis after impact (slight energy loss).
    ball.velocity.z *= 1 - clampedWallFriction;
    const spinKick = THREE.MathUtils.clamp(
      ball.angularVelocity.y * spinBounceFactor,
      -maxSpinKick,
      maxSpinKick
    );
    ball.velocity.z += spinKick;
    const spin = ball.angularVelocity.y;
    const damped = spin * (1 - spinDampingFactor);
    ball.angularVelocity.y = spin === 0 ? 0 : (Math.sign(damped) === Math.sign(spin) ? damped : 0);
  }

  if (ball.position.z + ball.radius > maxZ) {
    ball.position.z = maxZ - ball.radius;
    // Restitution flips the normal axis (bounce) and reduces its energy.
    ball.velocity.z *= -clampedRestitution;
    // Wall friction reduces the tangential axis after impact (slight energy loss).
    ball.velocity.x *= 1 - clampedWallFriction;
    const spinKick = THREE.MathUtils.clamp(
      ball.angularVelocity.y * spinBounceFactor,
      -maxSpinKick,
      maxSpinKick
    );
    ball.velocity.x += spinKick;
    const spin = ball.angularVelocity.y;
    const damped = spin * (1 - spinDampingFactor);
    ball.angularVelocity.y = spin === 0 ? 0 : (Math.sign(damped) === Math.sign(spin) ? damped : 0);
  } else if (ball.position.z - ball.radius < minZ) {
    ball.position.z = minZ + ball.radius;
    // Restitution flips the normal axis (bounce) and reduces its energy.
    ball.velocity.z *= -clampedRestitution;
    // Wall friction reduces the tangential axis after impact (slight energy loss).
    ball.velocity.x *= 1 - clampedWallFriction;
    const spinKick = THREE.MathUtils.clamp(
      ball.angularVelocity.y * spinBounceFactor,
      -maxSpinKick,
      maxSpinKick
    );
    ball.velocity.x += spinKick;
    const spin = ball.angularVelocity.y;
    const damped = spin * (1 - spinDampingFactor);
    ball.angularVelocity.y = spin === 0 ? 0 : (Math.sign(damped) === Math.sign(spin) ? damped : 0);
  }
}
