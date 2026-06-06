import * as THREE from "three";

export default class BallVisual {
  constructor(scene, physicsBall, ballNumber = 0) {
    this.scene = scene;
    this.physicsBall = physicsBall;
    this.ball = physicsBall;
    this.originalRadius = physicsBall.radius;

    // Simple texture selection: cue ball uses whiteball.png,
    // other balls use their matching number texture.
    const textureName = ballNumber === 0
      ? "whiteball.png"
      : `${ballNumber}ball.png`;
    const texturePath = `../world/textures/${textureName}`;
    const texture = new THREE.TextureLoader().load(texturePath);

    const material = new THREE.MeshBasicMaterial({ map: texture });

    const geometry = new THREE.SphereGeometry(physicsBall.radius, 32, 32);

    this.mesh = new THREE.Mesh(geometry, material);

    this.scene.add(this.mesh);
  }

  updateSize(newRadius) {
    const scale = newRadius / this.originalRadius;
    this.mesh.scale.setScalar(scale);
  }

  update(dt = 1 / 60) {
    this.mesh.position.copy(this.ball.position);

    const angularSpeed = this.ball.angularVelocity.length();

    if (angularSpeed > 0) {
      const axis = this.ball.angularVelocity.clone().normalize();

      this.mesh.rotateOnWorldAxis(axis, angularSpeed * dt);
    }
  }
}
