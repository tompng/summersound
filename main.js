
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
    randomNoiseNode.port.postMessage(1)
  }
  
}
start()
