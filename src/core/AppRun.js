import * as THREE from "three";
import Camera from "./Camera.js";
import Renderer from "./Renderer.js";
import AssetsLoader from "./AssetsLoader.js";
import SceneManager from "./SceneManager.js";
import TextureLoader from "./TextureLoader.js";
import ModelLoader from "./ModelLoader.js";
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
    this.scene.background = new THREE.Color(0x222222);

    this.sizes = new Sizes();
    this.eventEmitter = new EventEmitter();
    this.time = new Time();

    this.camera = new Camera(this);

    // Restore audio listener (was removed during merge)
    this.audioListener = new THREE.AudioListener();
    this.camera.instance.add(this.audioListener);

    this.renderer = new Renderer(this);

    this.textureLoader = new TextureLoader();
    this.modelLoader = new ModelLoader();

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
        poolTable: "/models/pooltable.glb",
      },

      sounds: {
        ballHit: {
          path: "/audio/ball-hit.mp3",
          volume: 0.8,
        },
        doorOpen: {
          path: "/audio/door.mp3",
          volume: 0.7,
        },
        ballPocket: {
          path: "/audio/ball-pocket.mp3",
          volume: 0.8,
        },
        cueBallFoul: {
          path: "/audio/cue-ball-foul.mp3",
          volume: 0.8,
        },
        doorClose: {
          path: "/audio/door.mp3",
          volume: 0.65,
        },
        walking: {
          path: "/audio/walking.mp3",
          volume: 0.2,
          loop: true,
        },
      },
    });
    

    // 👈 تم التعديل هنا فقط: تمرير ملف الأصوات (this.assetsLoader) لتشغيل صوت المشي والأبواب بنجاح!
    this.sceneManager = new SceneManager(this, this.assetsLoader);
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