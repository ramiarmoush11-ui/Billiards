import * as THREE from "three";
import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import AssetsLoader from "./AssetsLoader.js";
import SceneManager from "./SceneManager.js";
import TextureLoader from "./TextureLoader.js";
import ModelLoader from "./ModelLoader.js";
import SoundManager from "./SoundManager.js";
import Sizes from "./utils/Size.js";
import Time from "./utils/Time.js";
import EventEmitter from "./utils/EventEmitter.js";

export default class AppRun {
  static instance;

  constructor(canvas) {
    if (AppRun.instance) return AppRun.instance;
    AppRun.instance = this;

    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background= new THREE.Color(0x222222);

    this.sizes = new Sizes();
    this.eventEmitter = new EventEmitter();
    this.time = new Time();
    this.camera = new Camera(this);
    this.renderer = new Renderer(this);

    this.textureLoader = new TextureLoader();
    this.modelLoader = new ModelLoader();
    this.soundManager = new SoundManager();

    this.assetsLoader = new AssetsLoader(this);

    this.sizes.on("resize", () => this.resize());
    this.time.on("tick", () => this.update());
  }

  async start() {
    await this.assetsLoader.loadAll({
      textures: [
        // {
        //   name: "ground",
        //   maps: {
        //     map: "/textures/Ground080_2K-JPG_Color.jpg",
        //   },
        //   repeat: { x: 30, y: 30 },
        // },
      ],
      models: {
        // Add billiards models here
        poolTable : '/models/pooltable.glb',
      },
      sounds: {
        // Add billiards sounds here
      },
    });

    this.sceneManager = new SceneManager(this);
  }

  resize() {
    this.camera.resize();
    this.renderer.resize();
  }

  update() {
    this.camera.update();
    this.sceneManager?.update();
    this.renderer.update();
  }
}
