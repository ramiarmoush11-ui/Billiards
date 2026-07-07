import * as THREE from 'three'

export default class SoundManager {
  /**
   * @param {import('./AppRun.js').default} app
   */
  constructor(app) {
    // 1. ربط الـ listener بـ listener التطبيق الأساسي المربوط بالكاميرا
    this.listener = app.audioListener 
    this.loader = new THREE.AudioLoader()
    this.sounds = {}
  }

  async load(name, path, loop = false, volume = 1) {
    const sound = new THREE.Audio(this.listener)

    try {
      const buffer = await this._loadBuffer(path)
      sound.setBuffer(buffer)
      sound.setLoop(loop)
      sound.setVolume(volume)
      this.sounds[name] = sound
      console.log(`🟢 [SoundManager] Loaded: ${name}`)
      return sound
    } catch (error) {
      console.error(`🔴 [SoundManager] Failed to load: ${name}`, error)
      return null
    }
  }

  _loadBuffer(path) {
    return new Promise((resolve, reject) => {
      this.loader.load(path, resolve, undefined, reject)
    })
  }

  // 2. دالة التشغيل الذكية والمعدلة لحل مشكلة صوت المشي والاصطدام معاً
  play(name) {
    const sound = this.sounds[name]
    if (!sound) return

    // 💡 إذا كان الصوت هو صوت المشي (Walking)
    if (name === "walking") {
      if (!sound.isPlaying) {
        sound.setLoop(true); // نضمن أنه يتكرر تلقائياً طالما نمشي
        sound.play()
      }
    } 
    // 💥 لباقي الأصوات مثل اصطدام الكرات والطاولات (تداخل سريع)
    else {
      if (sound.isPlaying) {
        sound.stop() // إيقاف وإعادة التشغيل فوراً للاصطدامات المتتالية
      }
      sound.play()
    }
  }

  stop(name) {
    const sound = this.sounds[name]
    if (sound && sound.isPlaying) {
      sound.stop()
    }
  }

  get(name) {
    return this.sounds[name] || null
  }
}