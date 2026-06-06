import * as THREE from "three";
import Force from "./Force.js";

export default class RollingFriction extends Force {
  constructor({ floorFriction = 0, gravity = 9.81, stopThreshold = 0.015 } = {}) {
    super();
    this.floorFriction = floorFriction;
    this.gravity = gravity;
    this.stopThreshold = stopThreshold;
  }

 update(ball, dt = 1 / 60) {

    if (!ball || ball.mass <= 0) return;

    const linearSpeed = ball.velocity.length();
    const angularSpeed = ball.angularVelocity.length();

    // Small angular damping to prevent spin from lingering too long.
    // Uses a per-second decay scaled by dt for frame-rate independence.
    const angularDamping = 0.1;
    const angularDecay = Math.max(0, 1 - angularDamping * dt);
    ball.angularVelocity.multiplyScalar(angularDecay);

    // 1. صمام الأمان النهائي (Hard Stop)
    if (linearSpeed < 0.005 && angularSpeed < 0.05) {
      ball.velocity.set(0, 0, 0);
      ball.angularVelocity.set(0, 0, 0);
      this.force.set(0, 0, 0);
      return;
    }

    // 2. حساب سرعة الانزلاق عند نقطة التلامس
    // Floor contact point is below the center, so Y must be negative.
    const contactOffset = new THREE.Vector3(0, -ball.radius, 0);
    const slipVelocity = ball.velocity.clone().add(
      new THREE.Vector3().crossVectors(ball.angularVelocity, contactOffset)
    );
    const slipSpeed = slipVelocity.length();

    // 3. حالة التدحرج الطبيعي (لا يوجد انزلاق)
    // نطبق مقاومة التدحرج لإيقاف الكرة تدريجياً
    if (slipSpeed < 0.02) { 
      this.force.set(0, 0, 0);
      // Slightly stronger rolling decay so balls stop in a realistic timeframe.
      const rollingDecay = Math.max(0, 1 - (this.floorFriction * 3) * dt);
      ball.velocity.multiplyScalar(rollingDecay);
      ball.angularVelocity.multiplyScalar(rollingDecay);
      // Low-speed sleep: clamp tiny residual motion to prevent endless creeping.
      const linearSleep = this.stopThreshold;
      const angularSleep = this.stopThreshold * 10;
      if (
        ball.velocity.length() < linearSleep &&
        ball.angularVelocity.length() < angularSleep
      ) {
        ball.velocity.set(0, 0, 0);
        ball.angularVelocity.set(0, 0, 0);
      }
      return;
    }

    // 4. حالة الانزلاق (تطبيق الاحتكاك لدمج الدوران مع الحركة)
    const combinedFriction = ball.friction * this.floorFriction;
    let magnitude = combinedFriction * ball.mass * this.gravity;

    // السر الرياضي: الكتلة الفعالة (Effective Mass) للكرة الصلبة
    // تمنع تطبيق قوة مبالغ فيها تؤدي لاهتزاز الكرة
    const effectiveMass = ball.mass / 3.5; 
    const exactStopForce = effectiveMass * (slipSpeed / dt);

    // نأخذ القوة الأقل لضمان عدم تجاوز الصفر
    magnitude = Math.min(magnitude, exactStopForce);

    // تطبيق قوة الاحتكاك الخطي
    this.force.copy(slipVelocity).normalize().multiplyScalar(-magnitude);

    // تطبيق عزم الاحتكاك الدوراني فوراً لضمان التزامن
    const frictionTorque = new THREE.Vector3().crossVectors(contactOffset, this.force);
    if (ball.momentOfInertia > 0) {
      ball.angularVelocity.addScaledVector(frictionTorque, dt / ball.momentOfInertia);
    }

    // Sliding sleep: allow tiny residual motion to settle even if slip is noisy.
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
    /*  console.log(
  "linear:",
  ball.velocity.length(),
  "angular:",
  ball.angularVelocity.length(),
  "slip:",
  slipSpeed
);*/
  }
}
