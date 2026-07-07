import * as THREE from "three";

export default class Ball {
  constructor() {
    this.density = 1700;
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
    this.radius = 0.064;
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
    const volume = (4 / 3) * Math.PI * Math.pow(this.radius, 3);
    this.mass = this.density * volume;
    this.calculateMomentOfInertia();
    return this.mass;
  }

  calculateMomentOfInertia() {
    this.momentOfInertia = (2 / 5) * this.mass * this.radius * this.radius;
    return this.momentOfInertia;
  }

  applyImpulse(impulseVector) {
    if (!impulseVector || this.mass <= 0) return;
    const deltaVelocity = impulseVector.clone().divideScalar(this.mass);
    this.velocity.add(deltaVelocity);
  }

  update() {
  }

  getKineticEnergy() {
    const linearKE = 0.5 * this.mass * this.velocity.lengthSq();
    const rotationalKE = 0.5 * this.momentOfInertia * this.angularVelocity.lengthSq();
    return linearKE + rotationalKE;
  }
}