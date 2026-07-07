import * as THREE from "three";
import TableManager from "../world/TableManager.js";
import RoomManager from "../world/RoomManager.js";

export default class SceneManager {
  /**
   * @param {import('./AppRun.js').default} app
   * @param {any} assetsLoader
   */
  constructor(app, assetsLoader) {
    this.scene = app.scene;
    this.camera = app.camera;

    if (assetsLoader && !app.soundManager) {
      app.soundManager = assetsLoader;
    }

    this.setLights();
    this.setWorld(app);
  }

  setLights() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(3, 5, 2);

    this.scene.add(ambient, directional);
  }

  setWorld(app) {
    this.room = new RoomManager(app);
    this.table = new TableManager(app);
  }

  update() {
    if (this.room) this.room.update();
    if (this.table) this.table.update();
  }
}