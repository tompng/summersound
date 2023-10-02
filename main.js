
const audioContext = new AudioContext()
async function startFireworks() {
  document.body.innerHTML = 'click'
  await audioContext.audioWorklet.addModule('sound.js')
  const node = new AudioWorkletNode(audioContext, 'fireworks-processor')
  node.connect(audioContext.destination)

  document.body.onclick = () => {
    if (audioContext.state !== 'running') audioContext.resume()
    node.port.postMessage({ pyu: true })
    setTimeout(doBang, 2500)
    setTimeout(doPachi, 3250)
  }
  function doBang() {
    node.port.postMessage({ bang: 1 })
  }
  function doPachi() {
    let t = 0
    function f() {
      t += 0.01
      const a = t * (1 - t) ** 3
      for (i=0; i < 4; i++) if (Math.random() < a) node.port.postMessage({ bang: 0, crack: 4 * a * Math.random() })
      if (t < 1) setTimeout(f, 8)
    }
    f()
  }
}

async function startWindChime() {
  document.body.innerHTML = 'click'
  await audioContext.audioWorklet.addModule('sound.js')
  const node = new AudioWorkletNode(audioContext, 'windchime-processor')
  node.connect(audioContext.destination)

  document.body.onclick = () => {
    if (audioContext.state !== 'running') audioContext.resume()
    if (Math.random() < 0.2) {
      node.port.postMessage({ wind: true })
    } else {
      node.port.postMessage({ chime: true })
      let n = 0
      let last = 0
      const f = () => {
        if (last + 10 < n && Math.random() < 0.02){
          node.port.postMessage({ chime: true })
          last = n
        }
        n++
        if (n < 100) setTimeout(f, 10)
      }
      setTimeout(f, 10)
    }
  }
}

startWindChime()
