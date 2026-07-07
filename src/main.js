import AppRun from './core/AppRun.js'

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.querySelector('canvas.webgl')
  const app = new AppRun(canvas)
  await app.start()

  // ART_SANDBOX_ONLY
})