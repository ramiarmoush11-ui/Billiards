import * as THREE from "three";
import TableManager from "../world/TableManager.js";
import RoomManager from "../world/RoomManager.js"; // 1. استيراد الكلاس الجديد

export default class SceneManager {
  /**
   * @param {import('./AppRun.js').default} app
   */
  constructor(app) {
    this.scene = app.scene;
    this.camera = app.camera;
    this.setLights();
    this.setWorld(app);
  }

  setLights() {
    // يمكنك دمج إضاءة الغرفة مع الإضاءة العامة هنا
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const directional = new THREE.DirectionalLight(0xffffff, 0.6);
    directional.position.set(3, 5, 2);

    this.scene.add(ambient, directional);
  }

  setWorld(app) {
    // 2. إعداد الغرفة (البيئة)
    this.room = new RoomManager(app);
    
    // 3. إعداد الطاولة (التي كانت موجودة مسبقاً)
    this.table = new TableManager(app);
  }

  update() {
    // 4. تحديث الاثنين معاً في كل إطار
    if (this.room) this.room.update();
    if (this.table) this.table.update();
  }
}