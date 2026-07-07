import * as THREE from 'three'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js'

export default class TextureLoader {
  constructor() {
    this.loader = new THREE.TextureLoader()
    this.exrLoader = new EXRLoader()
    this.textures = {}
  }

  async load(materialName, maps, options = {}) {
    this.textures[materialName] = {}
    const promises = []

    for (const type in maps) {
      const path = maps[type]

      const promise = new Promise((resolve, reject) => {
        const isEXR = path.endsWith('.exr')
        const usedLoader = isEXR ? this.exrLoader : this.loader

        usedLoader.load(
          path,
          (texture) => {
            console.log(`🟢 [TextureLoader] ${materialName} - ${type} loaded ✅`)

            if (!isEXR) {
              texture.wrapS = THREE.RepeatWrapping
              texture.wrapT = THREE.RepeatWrapping
              texture.generateMipmaps = false
              texture.minFilter = THREE.NearestFilter
              texture.magFilter = THREE.NearestFilter
              if (options.repeat) {
                texture.repeat.set(options.repeat.x, options.repeat.y)
              }
            }

            this.textures[materialName][type] = texture
            resolve()
          },
          undefined,
          (err) => {
            console.error(`🔴 Failed to load texture: ${path}`, err)
            reject(err)
          }
        )
      })

      promises.push(promise)
    }

    (err) => {
      console.warn(`⚠️ [TextureLoader] Missing texture: ${path}. Skipping...`);
      resolve();
    }
  }

  get(name) {
    return this.textures[name]
  }
}
