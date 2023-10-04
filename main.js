
const audioContext = new AudioContext()
async function startFireworks() {
  document.body.innerHTML = 'click'
  const emojiAnimate = createEmoji(0)
  await audioContext.audioWorklet.addModule('sound.js')
  const node = new AudioWorkletNode(audioContext, 'fireworks-processor')
  node.connect(audioContext.destination)

  document.body.onclick = () => {
    emojiAnimate()
    if (audioContext.state !== 'running') audioContext.resume()
    node.port.postMessage({ pyu: true })
    setTimeout(doBang, 2500)
    setTimeout(emojiAnimate, 2500)
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
  const emojiAnimate = createEmoji(1)
  await audioContext.audioWorklet.addModule('sound.js')
  const node = new AudioWorkletNode(audioContext, 'windchime-processor')
  node.connect(audioContext.destination)

  document.body.onclick = () => {
    if (audioContext.state !== 'running') audioContext.resume()
    emojiAnimate()
    if (Math.random() < 0.25) {
      node.port.postMessage({ wind: true })
    }
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

async function startDemo() {
  await audioContext.audioWorklet.addModule('sound.js')
  const node = new AudioWorkletNode(audioContext, 'demo-processor')
  node.connect(audioContext.destination)

  startDemo.play = (type, decay, volume) => {
    if (audioContext.state !== 'running') audioContext.resume()
    node.port.postMessage(type, decay, volume)
  }
}

function createEmoji(typeNum) {
  const div = document.createElement('div')
  div.style.fontSize = '240px'
  div.style.textAlign = 'center'
  div.style.cursor = 'pointer'
  div.textContent = ['🎆', '🎐'][typeNum]
  document.body.appendChild(div)
  let value = 0
  setInterval(() => {
    value *= 0.95
    if (typeNum == 0) {
      div.style.transform = `scale(${(1 + 0.5 * value).toFixed(3)})`
    } else {
      div.style.transform = `translate(0,-100px) rotate(${(Math.sin(performance.now()/100)*value*20).toFixed(3)}deg) translate(0,100px)`
    }
  }, 32)
  return () => {
    value = Math.min(value + 1, 2)
  }
}