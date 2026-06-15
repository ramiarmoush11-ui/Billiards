import * as THREE from "three";

export default class Door {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.doorPosition = new THREE.Vector3(0, 0, 11); 
    
    this.doorWidth = 1.45;
    this.doorHeight = 3.2;
    
    this.detectionRadius = 3.5; 
    
    this.openSpeed = 0.05;

    this.leftDoorGroup = new THREE.Group();
    this.rightDoorGroup = new THREE.Group();

    this.init();
  }

  init() {
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaaaff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.1,
    });

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.5,
    });

    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.8,
    });

    const leftGlass = new THREE.Mesh(new THREE.BoxGeometry(this.doorWidth, this.doorHeight, 0.04), glassMaterial);
    leftGlass.position.set(-this.doorWidth / 2, this.doorHeight / 2, 0);
    this.leftDoorGroup.add(leftGlass);

    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(this.doorWidth + 0.04, this.doorHeight + 0.04, 0.06), frameMaterial);
    leftFrame.position.set(-this.doorWidth / 2, this.doorHeight / 2, -0.001);
    this.leftDoorGroup.add(leftFrame);

    const leftHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8), brassMaterial);
    leftHandle.position.set(-0.05, this.doorHeight / 2, 0.05);
    this.leftDoorGroup.add(leftHandle);

    const rightGlass = new THREE.Mesh(new THREE.BoxGeometry(this.doorWidth, this.doorHeight, 0.04), glassMaterial);
    rightGlass.position.set(this.doorWidth / 2, this.doorHeight / 2, 0);
    this.rightDoorGroup.add(rightGlass);

    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(this.doorWidth + 0.04, this.doorHeight + 0.04, 0.06), frameMaterial);
    rightFrame.position.set(this.doorWidth / 2, this.doorHeight / 2, -0.001);
    this.rightDoorGroup.add(rightFrame);

    const rightHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8), brassMaterial);
    rightHandle.position.set(0.05, this.doorHeight / 2, 0.05);
    this.rightDoorGroup.add(rightHandle);

    this.leftDoorGroup.position.copy(this.doorPosition);
    this.rightDoorGroup.position.copy(this.doorPosition);

    this.scene.add(this.leftDoorGroup);
    this.scene.add(this.rightDoorGroup);

    this.leftClosedX = this.leftDoorGroup.position.x;
    this.rightClosedX = this.rightDoorGroup.position.x;

    this.leftOpenX = this.leftClosedX - (this.doorWidth - 0.1);
    this.rightOpenX = this.rightClosedX + (this.doorWidth - 0.1);
  }

  update() {
    if (!this.camera) return;

    const camPos = new THREE.Vector3();
    this.camera.getWorldPosition(camPos); 

    const distance = Math.sqrt(
      Math.pow(camPos.x - this.doorPosition.x, 2) +
      Math.pow(camPos.z - this.doorPosition.z, 2)
    );

    if (distance <= this.detectionRadius) {
      this.leftDoorGroup.position.x = THREE.MathUtils.lerp(this.leftDoorGroup.position.x, this.leftOpenX, this.openSpeed);
      this.rightDoorGroup.position.x = THREE.MathUtils.lerp(this.rightDoorGroup.position.x, this.rightOpenX, this.openSpeed);
    } else {
      this.leftDoorGroup.position.x = THREE.MathUtils.lerp(this.leftDoorGroup.position.x, this.leftClosedX, this.openSpeed);
      this.rightDoorGroup.position.x = THREE.MathUtils.lerp(this.rightDoorGroup.position.x, this.rightClosedX, this.openSpeed);
    }
  }
}