import * as THREE from "three";
import FirstPersonControls from "./FirstPersonControls.js";

export default class Camera {
  /**
   * @param {import('./AppRun.js').default} app
   */
  constructor(app) {
    this.sizes = app.sizes;
    this.scene = app.scene;
    this.canvas = app.canvas;
    this.eventEmitter = app.eventEmitter;
    this.setInstance();
    this.setSpectatorControls();
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      60,
      this.sizes.width / this.sizes.height,
      1,
      2e7
    );
    this.instance.position.set(0, 2, 5);
    this.scene.add(this.instance);
  }

  setSpectatorControls() {
    this.controls = new FirstPersonControls(
      this.instance,
      this.canvas,
      this.eventEmitter
    );
  }

  resize() {
    this.instance.aspect = this.sizes.width / this.sizes.height;
    this.instance.updateProjectionMatrix();
  }

  update() {
    this.controls.update();
  }
}
