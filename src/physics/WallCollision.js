import * as THREE from "three";

export default function handleWallCollisions(
  ball,
  bounds,
  restitution,
  wallFriction,
) {
  if (!bounds) return;

  //side spin -> bounce
  const spinBounceFactor = 0.015;
  // limit spin kick to keep the simulation stable.
  const maxSpinKick = 0.2;

  const spinDampingFactor = 0.05;

  const { minX, maxX, minZ, maxZ } = bounds;

  const clampedRestitution = THREE.MathUtils.clamp(restitution, 0, 1);
  const clampedWallFriction = THREE.MathUtils.clamp(wallFriction, 0, 1);


  if (ball.position.x + ball.radius > maxX) {
    //تصحيح التداخل للتلامس تماما بالبداية 
    ball.position.x = maxX - ball.radius;

    ball.velocity.x *= -clampedRestitution;
    // reverse the normal velocity and apply restitution.

    //الاحتكاك القليل عالمركبة المماسية 
    ball.velocity.z *= 1 - clampedWallFriction;

    const spinKick = THREE.MathUtils.clamp(
      ball.angularVelocity.y * spinBounceFactor,
      -maxSpinKick,
      maxSpinKick,
    );
    //apply spinKick on tangent (hit x applay on z)
    ball.velocity.z += spinKick;
    const spin = ball.angularVelocity.y;
    const damped = spin * (1 - spinDampingFactor);
    ball.angularVelocity.y =
      spin === 0 ? 0 : Math.sign(damped) === Math.sign(spin) ? damped : 0;
      // Prevent spin from convert to the reversed direction due to damping ,
      // so if it going to reverse,set 0
  } else if (ball.position.x - ball.radius < minX) {
    ball.position.x = minX + ball.radius;
    
    ball.velocity.x *= -clampedRestitution;
  
    ball.velocity.z *= 1 - clampedWallFriction;
    const spinKick = THREE.MathUtils.clamp(
      ball.angularVelocity.y * spinBounceFactor,
      -maxSpinKick,
      maxSpinKick,
    );
    ball.velocity.z += spinKick;
    const spin = ball.angularVelocity.y;
    const damped = spin * (1 - spinDampingFactor);
    ball.angularVelocity.y =
      spin === 0 ? 0 : Math.sign(damped) === Math.sign(spin) ? damped : 0;
  }

  if (ball.position.z + ball.radius > maxZ) {
    ball.position.z = maxZ - ball.radius;
 
    ball.velocity.z *= -clampedRestitution;

    ball.velocity.x *= 1 - clampedWallFriction;
    const spinKick = THREE.MathUtils.clamp(
      ball.angularVelocity.y * spinBounceFactor,
      -maxSpinKick,
      maxSpinKick,
    );
    ball.velocity.x += spinKick;
    const spin = ball.angularVelocity.y;
    const damped = spin * (1 - spinDampingFactor);
    ball.angularVelocity.y =
      spin === 0 ? 0 : Math.sign(damped) === Math.sign(spin) ? damped : 0;
  } else if (ball.position.z - ball.radius < minZ) {
    ball.position.z = minZ + ball.radius;
    ball.velocity.z *= -clampedRestitution;
    ball.velocity.x *= 1 - clampedWallFriction;
    const spinKick = THREE.MathUtils.clamp(
      ball.angularVelocity.y * spinBounceFactor,
      -maxSpinKick,
      maxSpinKick,
    );
    ball.velocity.x += spinKick;
    const spin = ball.angularVelocity.y;
    const damped = spin * (1 - spinDampingFactor);
    ball.angularVelocity.y =
      spin === 0 ? 0 : Math.sign(damped) === Math.sign(spin) ? damped : 0;
  }
}
