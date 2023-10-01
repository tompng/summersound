function createBandPass(freq, w) {
  let ar = 0, ai = 0
  let br = 0, bi = 0
  let cr = 0, ci = 0
  const cos = Math.cos(freq * 2 * Math.PI / sampleRate)
  const sin = Math.sin(freq * 2 * Math.PI / sampleRate)
  const ex = Math.exp(-freq / sampleRate / w)
  console.log(cos, sin, ex)
  const sum2 = 1 / (1 - ex ** 2) - 4 / (1 - ex ** 3) + 6 / (1 - ex ** 4) - 4 / (1 - ex ** 5) + 1 / (1 - ex ** 6)
  const s = Math.sqrt(1 / sum2)
  return (v) => {
    ;[ar, ai] = [ex * (ar * cos - ai * sin) + v, ex * (ar * sin + ai * cos)]
    ;[br, bi] = [ex * ex * (br * cos - bi * sin) + v, ex * ex * (br * sin + bi * cos)]
    ;[cr, ci] = [ex * ex * ex * (cr * cos - ci * sin) + v, ex * ex * ex * (cr * sin + ci * cos)]
    return (ar - 2 * br + cr) * s
  }
}

function createDecayVolume(startup, sec) {
  let a = 0
  let b = 0
  let c = 0
  let volume = 0
  const exv = Math.exp(-1 / sampleRate / sec)
  const ex = Math.exp(-1 / sampleRate / startup)
  const sum = 1 / (1 - ex) - 2 / (1 - ex ** 2) + 1 / (1 - ex ** 3)
  return (v) => {
    a = ex * a + v
    b = ex * ex * b + v
    c = ex * ex * ex * c + v
    return volume = volume * exv + (a - 2 * b + c) / sum
  }
}

function createLowPass1(sec) {
  let a = 0
  const ex = Math.exp(-1 / sampleRate / sec)
  const sum2 = 1 / (1 - ex ** 2)
  const s = Math.sqrt(1 / sum2)
  return (v) => {
    a = ex * a + v
    return a * s
  }
}

function createLowPass2(sec) {
  let a = 0
  let b = 0
  const ex = Math.exp(-1 / sampleRate / sec)
  const sum2 = 1 / (1 - ex ** 2) - 2 / (1 - ex ** 3) + 1 / (1 - ex ** 4)
  const s = Math.sqrt(1 / sum2)
  return (v) => {
    a = ex * a + v
    b = ex * ex * b + v
    return (a - b) * s
  }
}

function createLowPass3(sec) {
  let a = 0
  let b = 0
  let c = 0
  const ex = Math.exp(-1 / sampleRate / sec)
  const sum2 = 1 / (1 - ex ** 2) - 4 / (1 - ex ** 3) + 6 / (1 - ex ** 4) - 4 / (1 - ex ** 5) + 1 / (1 - ex ** 6)
  const s = Math.sqrt(1 / sum2)
  return (v) => {
    a = ex * a + v
    b = ex * ex * b + v
    c = ex * ex * ex * c + v
    return (a - 2 * b + c) * s
  }
}

class RandomNoiseProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args)
    this.value = 0
    this.port.onmessage = (event) => {
      this.onmessage(event.data)
    }
    this.f1 = createLowPass3(0.0005)
    this.f2 = createLowPass3(0.002)
    this.v1 = createDecayVolume(0.0005, 0.1)
    this.v2 = createDecayVolume(0.001, 0.3)
  }
  onmessage(value = 0) {
    this.value += value
  }
  process(_inputs, outputs, _parameters) {
    const output = outputs[0]
    const len = output[0].length
    for (let i = 0; i < len; i++) {
      const v1 = this.v1(this.value)
      const v2 = this.v2(this.value)
      this.value = 0
      const v = (
        0.5 * v1 * this.f1(Math.random() * 2 - 1) +
        0.4 * v2 * this.f2(Math.random() * 2 - 1)
      )
      // const v = 0.5 * v1 * this.f1(Math.random() * 2 - 1)
      output.forEach(chan => chan[i] = v)
    }
    return true
  }
}

registerProcessor("random-noise-processor", RandomNoiseProcessor)
