import * as THREE from "three";
const { Vector3 } = THREE;

import Ball from "./Ball.js";
import detectBallCollisions from "./BallCollision.js";
import handleWallCollisions from "./WallCollision.js";

let instance = null;
export default class Physics {
  constructor() {
    if (instance) {
      return instance;
    }
    instance = this;

    this.deltaTime = 1 / 60;
    this.time = 0;
    this.restitution = 0.8;
    this.wallFriction = 0;
    this.maxSpeed = 30;
    this.overlapTolerance = 1e-4;
    this.collisionPasses = 3;
    this.boundClampVelocity = this.clampVelocity.bind(this);
    this.bounds = null;
    // Standard rack: 1 cue ball + 15 balls in a triangle.
    this.balls = [];
    const cueBall = new Ball();
    cueBall.number = 0;
    cueBall.position.set(0, 0, -1.5);
    this.balls.push(cueBall);

    const radius = cueBall.radius;
    const spacing = radius * 2 * 1.02; // tiny gap to avoid overlap at spawn
    const rowDepth = spacing * Math.sqrt(3) * 0.5;
    const rackStartZ = 1.5;
    // Build a 5-row triangle (1 + 2 + 3 + 4 + 5 = 15).
    const rackBallNumberOrder =[         //!!!!!!!!!!!! I changed this and the loop to make the ball order work
      1,
      3,2,
      4,8,11,
      6,7,9,10,
      5,12,13,14,15
    ];

    let indexx=0;

    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col <= row; col += 1) {
        const ball = new Ball();
        ball.number = rackBallNumberOrder[indexx];
        indexx++;
        const xOffset = (col - row / 2) * spacing;
        const zOffset = rackStartZ + row * rowDepth;
        ball.position.set(xOffset, 0, zOffset);
        this.balls.push(ball);
      }
    }

    // Keep the first two balls for existing references/UI logic.
    this.ball = this.balls[0];
    this.ball2 = this.balls[1];
  }

  getTotalForce(ball) {
    const totalForce = new Vector3(0, 0, 0);
    if (!ball || !ball.forces) return totalForce;

    for (const force of ball.forces) {
      force.update(ball, this.deltaTime);
      totalForce.add(force.force);
    }

    return totalForce;
  }

  acceleration(ball) {
    const mass = ball.getTotalMass();
    if (mass <= 0) {
      ball.acceleration.set(0, 0, 0);
      return;
    }

    // Acceleration is force divided by mass (a = F / m).
    ball.acceleration.copy(this.getTotalForce(ball)).divideScalar(mass);

    this.sanitizeVector(ball.acceleration);
  }

  velocity(ball) {
    ball.velocity.addScaledVector(ball.acceleration, this.deltaTime);
    this.sanitizeVector(ball.velocity);
  }

  position(ball) {
    ball.position.addScaledVector(ball.velocity, this.deltaTime);
    this.sanitizeVector(ball.position, 1e-3);
  }

  clampVelocity(ball) {
    // Multiple collisions can add tiny errors that grow over time.
    // Clamping keeps speeds in a safe range and improves stability.
    const speed = ball.velocity.length();
    if (speed > this.maxSpeed) {
      ball.velocity.setLength(this.maxSpeed);
      console.log("Velocity clamped");
    }
  }

  update(dt = 1 / 60) {
    // 1. Update the physics engine Delta Time based on Frame Rate
    this.deltaTime = dt;
    this.time_update();

    for (const ball of this.balls) {
      if (ball.isPocketed) {
        continue;
      }
      this.acceleration(ball);
      this.velocity(ball);
      this.clampVelocity(ball);
      this.position(ball);
      handleWallCollisions(
        ball,
        this.bounds,
        this.restitution,
        this.wallFriction,
      );
      ball.update();
    }

    // One collision pass is not always enough for chain collisions.
    // Multiple small passes reduce overlap and improve stability.
    for (let pass = 0; pass < this.collisionPasses; pass += 1) {
      detectBallCollisions({
        balls: this.balls,
        overlapTolerance: this.overlapTolerance,
        maxSpeed: this.maxSpeed,
        clampVelocity: this.boundClampVelocity,
      });
    }
  }

  time_update() {
    this.time = this.time + this.deltaTime;
  }

  sanitizeVector(vector, threshold = 1e-3) {
    vector.set(
      Math.abs(vector.x) < threshold ? 0 : vector.x,
      Math.abs(vector.y) < threshold ? 0 : vector.y,
      Math.abs(vector.z) < threshold ? 0 : vector.z,
    );
  }
}
