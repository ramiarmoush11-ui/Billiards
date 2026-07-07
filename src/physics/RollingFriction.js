import * as THREE from "three";
import Force from "./Force.js";

export default class RollingFriction extends Force {
  constructor({
    floorFriction = 0,
    gravity = 9.81,
    stopThreshold = 0.015,
  } = {}) {
    super();
    this.floorFriction = floorFriction;
    this.gravity = gravity;
    this.stopThreshold = stopThreshold;
  }

  update(ball, dt = 1 / 60) {
    if (!ball || ball.mass <= 0) return;

    const linearSpeed = ball.velocity.length(); //by Pythagoras
    const angularSpeed = ball.angularVelocity.length();

    const angularDamping = 0.1;
    const angularDecay = Math.max(0, 1 - angularDamping * dt);
    ball.angularVelocity.multiplyScalar(angularDecay);

    if (linearSpeed < 0.005 && angularSpeed < 0.05) {
      ball.velocity.set(0, 0, 0);
      ball.angularVelocity.set(0, 0, 0);
      this.force.set(0, 0, 0);
      return;
    }

    const contactOffset = new THREE.Vector3(0, -ball.radius, 0);
    const slipVelocity = ball.velocity
      .clone()
      .add(
        new THREE.Vector3().crossVectors(ball.angularVelocity, contactOffset),
      ); //Vslip​=V+ω×r //crossVectors : V=ω×r
    const slipSpeed = slipVelocity.length();

    if (slipSpeed < 0.02) {
      this.force.set(0, 0, 0);
      //in pure rolling there is no Sliding Friction Force

      //rather than applying a rolling frcition force, we can just decay v,w
      const rollingDecay = Math.max(0, 1 - this.floorFriction * 3 * dt);
      ball.velocity.multiplyScalar(rollingDecay);
      ball.angularVelocity.multiplyScalar(rollingDecay);

      const linearSleep = this.stopThreshold;
      const angularSleep = this.stopThreshold * 10;
      //// Angular movment usually  longer than linear movment.
      if (
        ball.velocity.length() < linearSleep &&
        ball.angularVelocity.length() < angularSleep
      ) {
        ball.velocity.set(0, 0, 0);
        ball.angularVelocity.set(0, 0, 0);
      }
      return;
    }

    //حالة الانزلاق
    const combinedFriction = ball.friction * this.floorFriction;
    let magnitude = combinedFriction * ball.mass * this.gravity; // sliding friction magnitude (F = μmg).
    //قوة الاحتكاك الطبيعية
    const effectiveMass = ball.mass / 3.5;

    //F=m*(Δv/Δt) :v is vslipd bec sliding frcition is applied to make vslid <0.02
    const exactStopForce = effectiveMass * (slipSpeed / dt);
    //قوة الاحتكاك اللازمة لإيقاف الانزلاق

    // نأخذ القوة الأقل لضمان عدم تجاوز الصفر (يمنع  negative اي غير اتجاه )
    magnitude = Math.min(magnitude, exactStopForce);

    // Create the friction force vector from its magnitude and direction.
    this.force.copy(slipVelocity).normalize().multiplyScalar(-magnitude);
    //update the velocity in physics.js by (force above -> a -> v)
    //τ=r×F
    const frictionTorque = new THREE.Vector3().crossVectors(
      contactOffset,
      this.force,
    );
    if (ball.momentOfInertia > 0) {
      ball.angularVelocity.addScaledVector(
        frictionTorque,
        dt / ball.momentOfInertia,
      );
    }
    //angularVelocity = angularVelocity + (τ / I) * dt

    const linearSleep = this.stopThreshold;
    const angularSleep = this.stopThreshold * 3;
    if (
      ball.velocity.length() < linearSleep &&
      ball.angularVelocity.length() < angularSleep
    ) {
      ball.velocity.set(0, 0, 0);
      ball.angularVelocity.set(0, 0, 0);
      this.force.set(0, 0, 0);
    }
  }
}
