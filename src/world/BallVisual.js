import * as THREE from "three";

export default class BallVisual {
  constructor(scene, ballData) {
    this.scene = scene;
    this.ballData = ballData;
    this.originalRadius = ballData.radius;

    const geometry = new THREE.SphereGeometry(ballData.radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: ballData.color ?? 0xff0000,
    });
    this.mesh = new THREE.Mesh(geometry, material);

    this.scene.add(this.mesh);
  }

  updateSize(newRadius) {
    const scale = newRadius / this.originalRadius;
    this.mesh.scale.setScalar(scale);
  }

  update() {
    this.mesh.position.copy(this.ballData.position);
  }
}
