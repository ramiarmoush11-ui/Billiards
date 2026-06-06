import * as THREE from "three";

export default class TableVisual {
  constructor(
    scene,
    { tableWidth, tableLength, cushionThickness, cushionHeight, ballRadius },
  ) {
    this.scene = scene;
    this.tableWidth = tableWidth;
    this.tableLength = tableLength;
    this.cushionThickness = cushionThickness;
    this.cushionHeight = cushionHeight;
    this.ballRadius = ballRadius;

    this.scene.background = new THREE.Color(0x222222);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 5, 5);
    this.scene.add(ambientLight, sunLight);

    const floorGeometry = new THREE.PlaneGeometry(
      this.tableWidth,
      this.tableLength,
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
      this.tableLength,
    );
    const shortCushionGeometry = new THREE.BoxGeometry(
      this.tableWidth,
      this.cushionHeight,
      this.cushionThickness,
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
    const pocketGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 32);

    const pocketMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
    });

   

    this.pockets = [
      new THREE.Mesh(pocketGeometry, pocketMaterial),
      new THREE.Mesh(pocketGeometry, pocketMaterial),
      new THREE.Mesh(pocketGeometry, pocketMaterial),
      new THREE.Mesh(pocketGeometry, pocketMaterial),
      new THREE.Mesh(pocketGeometry, pocketMaterial),
      new THREE.Mesh(pocketGeometry, pocketMaterial),
    ];
    for (const pocket of this.pockets) {
      pocket.position.y = -this.ballRadius - 0.01;
    }
    this.pockets[0].position.set(
      -halfWidth,
      -this.ballRadius - 0.01,
      -halfLength,
    );
    this.pockets[1].position.set(
      halfWidth,
      -this.ballRadius - 0.01,
      -halfLength,
    );
    this.pockets[2].position.set(
      -halfWidth,
      -this.ballRadius - 0.01,
      halfLength,
    );
    this.pockets[3].position.set(
      halfWidth,
      -this.ballRadius - 0.01,
      halfLength,
    );

    this.pockets[4].position.set(0, -this.ballRadius - 0.01, -halfLength);
    this.pockets[5].position.set(0, -this.ballRadius - 0.01, halfLength);

    this.scene.add(...this.pockets);
  }

  update(ballRadius) {
    if (typeof ballRadius === "number") {
      this.ballRadius = ballRadius;
    }

    if (this.floor) {
      this.floor.position.y = -this.ballRadius;
    }
    if (this.cushions) {
      const cushionY = -this.ballRadius + this.cushionHeight / 2;
      for (const cushion of this.cushions) {
        cushion.position.y = cushionY;
      }
    }
  }
}
