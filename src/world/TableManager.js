import * as THREE from "three";
import BallVisual from "./BallVisual.js";

export default class TableManager {
  /**
   * @param {import('./../core/AppRun.js').default} app
   */
  constructor(app) {
    this.assetsLoader = app.assetsLoader;
    this.scene = app.scene;
    this.camera = app.camera;
    this.tableWidth = 4;
    this.tableLength = 8;
    this.cushionThickness = 0.2;
    this.cushionHeight = 0.2;
    this.ballRadius = 0.0285;
    this.bounds = {
      minX: -this.tableWidth / 2,
      maxX: this.tableWidth / 2,
      minZ: -this.tableLength / 2,
      maxZ: this.tableLength / 2,
    };
    this.ballData = [];
    this.ballVisuals = [];

    // ART_SANDBOX_ONLY
    this.init();
  }

  async init() {
    this.scene.background = new THREE.Color(0x222222);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 5, 5);
    this.scene.add(ambientLight, sunLight);

    const floorGeometry = new THREE.PlaneGeometry(
      this.tableWidth,
      this.tableLength
    );
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f6f2f,
      roughness: 0.9,
      metalness: 0,
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -this.ballRadius;
    this.scene.add(this.floor);

    const cushionMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f4f1f,
      roughness: 0.8,
      metalness: 0,
    });
    const longCushionGeometry = new THREE.BoxGeometry(
      this.cushionThickness,
      this.cushionHeight,
      this.tableLength
    );
    const shortCushionGeometry = new THREE.BoxGeometry(
      this.tableWidth,
      this.cushionHeight,
      this.cushionThickness
    );
    const halfWidth = this.tableWidth / 2;
    const halfLength = this.tableLength / 2;
    const cushionY = -this.ballRadius + this.cushionHeight / 2;
    const xOffset = halfWidth + this.cushionThickness / 2;
    const zOffset = halfLength + this.cushionThickness / 2;

    this.cushions = [
      new THREE.Mesh(longCushionGeometry, cushionMaterial),
      new THREE.Mesh(longCushionGeometry, cushionMaterial),
      new THREE.Mesh(shortCushionGeometry, cushionMaterial),
      new THREE.Mesh(shortCushionGeometry, cushionMaterial),
    ];
    this.cushions[0].position.set(xOffset, cushionY, 0);
    this.cushions[1].position.set(-xOffset, cushionY, 0);
    this.cushions[2].position.set(0, cushionY, zOffset);
    this.cushions[3].position.set(0, cushionY, -zOffset);
    this.scene.add(...this.cushions);

    this.ballData = this.createBallRackLayout();
    this.ballVisuals = this.ballData.map(
      (ball) => new BallVisual(this.scene, ball)
    );

    this.camera.instance.position.set(0, 2, 5);
    this.camera.instance.lookAt(0, 0, 0);
  }

  update() {
    // ART_SANDBOX_ONLY
    for (const ballVisual of this.ballVisuals) {
      ballVisual.update();
    }
  }

  createBallData(position, color) {
    return {
      position,
      radius: this.ballRadius,
      color,
    };
  }

  createBallRackLayout() {
    // ART_SANDBOX_ONLY
    const layout = [];
    const ballSpacing = this.ballRadius * 2.05;
    const rowSpacing = Math.sqrt(3) * this.ballRadius * 1.05;
    const rackOriginZ = -this.tableLength * 0.2;
    const rackColors = [
      0xf2d648,
      0x1e88e5,
      0xe53935,
      0x6d4c41,
      0x8e24aa,
      0x43a047,
      0xf57c00,
      0x3949ab,
      0x00897b,
      0xd81b60,
      0xffb300,
      0x546e7a,
      0x7cb342,
      0x00acc1,
      0xc62828,
    ];

    let colorIndex = 0;
    for (let row = 0; row < 5; row += 1) {
      const ballsInRow = row + 1;
      const z = rackOriginZ + row * rowSpacing;
      for (let i = 0; i < ballsInRow; i += 1) {
        const x = (i - row / 2) * ballSpacing;
        const color = rackColors[colorIndex % rackColors.length];
        layout.push(this.createBallData(new THREE.Vector3(x, 0, z), color));
        colorIndex += 1;
      }
    }

    const cueBallZ = this.tableLength * 0.25;
    layout.push(this.createBallData(new THREE.Vector3(0, 0, cueBallZ), 0xffffff));

    return layout;
  }
}