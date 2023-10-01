
const audioContext = new AudioContext()
async function start() {
  await audioContext.audioWorklet.addModule('sound.js')
  const randomNoiseNode = new AudioWorkletNode(
    audioContext,
    'random-noise-processor',
  )
  window.randomNoiseNode = randomNoiseNode
  randomNoiseNode.connect(audioContext.destination)

  document.body.onclick = () => {
    if (audioContext.state !== 'running') audioContext.resume()
    randomNoiseNode.port.postMessage({ bang: 1, crack: 0 })
    let t = 0
    function f() {
      t += 0.01
      const a = t * (1 - t) ** 3
      for (i=0; i < 4; i++) if (Math.random() < a) randomNoiseNode.port.postMessage({ bang: 0, crack: 4 * a * Math.random() })
      if (t < 1) setTimeout(f, 8)
    }
    setTimeout(f, 500)

  }
  
}
start()
