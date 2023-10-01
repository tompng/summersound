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
    return (b - a) * s
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
    return (a + c - 2 * b) * s
  }
}

class RandomNoiseProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args)
    this.value1 = 0
    this.value2 = 0
    this.port.onmessage = (event) => {
      this.onmessage(event.data)
    }
    this.f1 = createLowPass3(0.0005)
    this.f2 = createLowPass3(0.002)
  }
  onmessage(value = 0) {
    this.value1 += value
    this.value2 += value
  }
  process(_inputs, outputs, _parameters) {
    const output = outputs[0]
    const len = output[0].length
    for (let i = 0; i < len; i++) {
      this.value1 *= 0.9998
      this.value2 *= 0.99995
      const v = (
        0.5 * this.value1 * this.f1(Math.random() * 2 - 1) +
        0.4 * this.value2 * this.f2(Math.random() * 2 - 1)
      )
      output.forEach(chan => chan[i] = v)
    }
    return true
  }
}

registerProcessor("random-noise-processor", RandomNoiseProcessor)
