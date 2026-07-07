import * as THREE from "three";

export default class Ball {
  constructor() {
    // Density is how much mass is packed into each cubic meter.
    this.density = 1700; // kg/m^3 (phenolic resin)
    // Mass is the total amount of matter in the ball (kg).
    this.mass = 0;
    this.friction = 0.2;
    this.restitution = 0.9;
    this.momentOfInertia = 0;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.angularAcceleration = new THREE.Vector3(0, 0, 0);
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.angular = new THREE.Vector3(0, 0, 0);
    this.radius = 0.064; // 28.5mm radius  !!!!!!! I am mohamad I changed the radius to 0.064 for it to fit with the table
    this.forces = [];
  }

  get radius() {
    return this._radius;
  }

  set radius(value) {
    this._radius = value;
    this.calculateMass();
  }

  getTotalMass() {
    return this.mass;
  }

  calculateMass() {
    // Volume of a sphere: (4/3) * pi * r^3
    const volume = (4 / 3) * Math.PI * Math.pow(this.radius, 3);
    // Mass grows with volume, so a larger radius makes the ball much heavier.
    this.mass = this.density * volume;
    this.calculateMomentOfInertia();
    return this.mass;
  }

  calculateMomentOfInertia() {
    // Solid sphere moment of inertia: (2/5) * m * r^2
    this.momentOfInertia = (2 / 5) * this.mass * this.radius * this.radius;
    return this.momentOfInertia;
  }

  applyImpulse(impulseVector) {
    if (!impulseVector || this.mass <= 0) return;
    // Impulse changes velocity; heavier balls change speed less for the same impulse.
    const deltaVelocity = impulseVector.clone().divideScalar(this.mass);
    this.velocity.add(deltaVelocity);
  }

  update() {
    // Driven by the Physics.js integrator.
  }
}

