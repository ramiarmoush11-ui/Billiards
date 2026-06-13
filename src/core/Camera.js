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
    this.setViewShortcuts();
  }

  setInstance() {
    this.instance = new THREE.PerspectiveCamera(
      60,
      this.sizes.width / this.sizes.height,
      1,         //change this to set how close things will render next to the camera
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

  //I am implementing the camera positions system

  setTarget(targetObject){  //what will the camera look at (tableGroup)
    this.targetObject=targetObject
  }

  getTargetPosition(){
    const targetPosition= new THREE.Vector3();

    if(this.targetObject){
      this.targetObject.getWorldPosition(targetPosition);
    }

    return targetPosition;
  }

  setView(offset , up = new THREE.Vector3(0,1,0)){
    const targetPosition=this.getTargetPosition()

    this.instance.position.copy(targetPosition).add(offset)
    this.instance.up.copy(up) //setting the up for orientation
    
    this.instance.lookAt(targetPosition)
    
  }

  setTopView(){
    this.setView(new THREE.Vector3(0,3 ,0),new THREE.Vector3(1,0,0))
  }

    setLeftView() {
    this.setView(
      new THREE.Vector3(-3, 1, 0)
    );
  }

  setRightView() {
    this.setView(
      new THREE.Vector3(3, 1, 0)
    );
  }

  setFrontView() {
    this.setView(
      new THREE.Vector3(0, 0.5, 5)
    );
  }

  setBackView() {
    this.setView(
      new THREE.Vector3(0, 0.5, -5)
    );
  }

  setAngledView() {
    this.setView(
      new THREE.Vector3(3.2, 3, 3.2)
    );
  }


  setViewShortcuts(){
    window.addEventListener("keydown", (event) => {
      if (event.key==="1")
        this.setTopView();

      if(event.key==="2")
        this.setLeftView()

      if(event.key==="3")
        this.setRightView()

      if(event.key==="4")
        this.setFrontView()

      if(event.key==="5")
        this.setBackView()

      if(event.key==="6")
        this.setAngledView()
    })
  }
}
