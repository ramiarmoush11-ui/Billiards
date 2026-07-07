import TextureLoader from "./TextureLoader.js";
import ModelLoader from "./ModelLoader.js";
import SoundManager from "./SoundManager.js";

export default class AssetsLoader {
  /**
   * @param {import('./AppRun.js').default} app
   * @param {import('./../world/ui/LoadingScreen.js').default|null} loadingScreen
   */
  constructor(app, loadingScreen = null) {
    this.app = app;
    this.loadingScreen = loadingScreen;

    this.textureLoader = new TextureLoader();
    this.modelLoader = new ModelLoader();
    
    this.soundManager = new SoundManager(app);

    this.total = 0;
    this.loaded = 0;
  }

  /**
   * تحميل جميع الملفات من الـ manifest
   * @param {Object} manifest
   */
  async loadAll(manifest = {}) {
    const promises = [];

    const {
      textures = [],
      models = {},
      sounds = {},
    } = manifest;

    // Textures
    for (const tex of textures) {
      this.total++;

      const promise = this.textureLoader
        .load(
          tex.name,
          tex.maps,
          tex.repeat ? { repeat: tex.repeat } : {}
        )
        .then(() => this._onProgress())
        .catch((err) => {
          console.error(`Failed loading texture: ${tex.name}`, err);
          this._onProgress();
        });

      promises.push(promise);
    }

    // Models
    for (const [name, path] of Object.entries(models)) {
      this.total++;

      const promise = this.modelLoader
        .load(name, path)
        .then(() => this._onProgress())
        .catch((err) => {
          console.error(`Failed loading model: ${name}`, err);
          this._onProgress();
        });

      promises.push(promise);
    }

    // Sounds
    for (const [name, config] of Object.entries(sounds)) {
      this.total++;

      const {
        path,
        loop = false,
        volume = 1,
      } =
        typeof config === "string"
          ? { path: config }
          : config;

      const promise = this.soundManager
        .load(name, path, loop, volume)
        .then(() => this._onProgress())
        .catch((err) => {
          console.error(`Failed loading sound: ${name}`, err);
          this._onProgress();
        });

      promises.push(promise);
    }

    await Promise.all(promises);
  }

  _onProgress() {
    this.loaded++;

    const ratio =
      this.total === 0
        ? 1
        : this.loaded / this.total;

    if (this.loadingScreen) {
      this.loadingScreen.setProgress(ratio);
    }
  }

  getTextures() {
    return this.textureLoader.textures;
  }

  getModels() {
    return this.modelLoader.models;
  }

  getSounds() {
    return this.soundManager.sounds;
  }

  
  playSound(name, options = {}) {
    if (!this.soundManager) {
      console.warn("SoundManager is not initialized");
      return;
    }

    const sound = this.soundManager.get(name);
    if (sound && options.volume !== undefined) {
      sound.setVolume(options.volume);
    }

    this.soundManager.play(name);
  }
}