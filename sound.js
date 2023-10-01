function createBandPass(freq, w) {
  let ar = 0, ai = 0
  let br = 0, bi = 0
  let cr = 0, ci = 0
  const theta = freq * 2 * Math.PI / sampleRate
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const ex = Math.exp(-freq / sampleRate / w)
  const sum2 = 1 / (1 - ex ** 2) - 4 / (1 - ex ** 3) + 6 / (1 - ex ** 4) - 4 / (1 - ex ** 5) + 1 / (1 - ex ** 6)
  const s = Math.sqrt(1 / sum2)
  return (v) => {
    ;[ar, ai] = [ex * (ar * cos - ai * sin) + v, ex * (ar * sin + ai * cos)]
    ;[br, bi] = [ex * ex * (br * cos - bi * sin) + v, ex * ex * (br * sin + bi * cos)]
    ;[cr, ci] = [ex * ex * ex * (cr * cos - ci * sin) + v, ex * ex * ex * (cr * sin + ci * cos)]
    return (ar - 2 * br + cr) * s
  }
}

function periodicWave(freq, w, sec) {
  const len = Math.round(sec * sampleRate)
  const wave = [...new Array(len)].map(() => 2 * Math.random() - 1)
  let ar = 0, ai = 0
  let br = 0, bi = 0
  let cr = 0, ci = 0
  const theta = freq * 2 * Math.PI / sampleRate
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const ex = Math.exp(-freq / sampleRate / w)
  const update = v => {
    ;[ar, ai] = [ex * (ar * cos - ai * sin) + v, ex * (ar * sin + ai * cos)]
    ;[br, bi] = [ex * ex * (br * cos - bi * sin) + v, ex * ex * (br * sin + bi * cos)]
    ;[cr, ci] = [ex * ex * ex * (cr * cos - ci * sin) + v, ex * ex * ex * (cr * sin + ci * cos)]
  }
  wave.forEach(update)
  const thetaL = freq * 2 * Math.PI / sampleRate * len
  const exL = Math.pow(ex, len)
  const cosL = Math.cos(thetaL)
  const sinL = Math.sin(thetaL)
  const aLr = 1 - cosL * exL, aLi = exL * sinL
  const bLr = 1 - cosL * exL ** 2, bLi = sinL * exL ** 3
  const cLr = 1 - cosL * exL ** 3, cLi = sinL * exL ** 3
  ;[ar, ai] = [(ar * aLr - ai * aLi)  / (aLr ** 2 + aLi ** 2), (ai * aLr + ar * aLi) / (aLr ** 2 + aLi ** 2)]
  ;[br, bi] = [(br * bLr - bi * bLi)  / (bLr ** 2 + bLi ** 2), (bi * bLr + br * bLi) / (bLr ** 2 + bLi ** 2)]
  ;[cr, ci] = [(cr * cLr - ci * cLi)  / (cLr ** 2 + cLi ** 2), (ci * cLr + cr * cLi) / (cLr ** 2 + cLi ** 2)]
  let sum = 0
  let sum2 = 0
  wave.forEach((v, i) => {
    update(v)
    const value = ar - 2 * br + cr
    sum += value
    sum2 += value ** 2
    wave[i] = value
  })
  wave.forEach((v, i) => {
    wave[i] = (wave[i] - sum / len) / Math.sqrt(sum2 / len - (sum / len) ** 2)
  })
  return wave
}

function createPeriodicPlayer(wave) {
  let t = 0
  return v => {
    t = (t + v) % wave.length
    const i = Math.floor(t)
    const x = t - i
    return wave[i] * (1 - x) + wave[(i + 1) % wave.length] * x
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

class FireworksProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args)
    this.bang = 0
    this.crack = 0
    this.port.onmessage = (event) => {
      this.onmessage(event.data)
    }
    this.wmiddle = createLowPass3(0.0005)
    this.wlow = createLowPass3(0.002)
    this.whigh = createLowPass3(0.0002)
    this.vbang1 = createDecayVolume(0.0005, 0.1)
    this.vbang2 = createDecayVolume(0.001, 0.5)
    this.vcrack = createDecayVolume(0.0005, 0.2)
    this.pyuWave = periodicWave(1000, 8, 1)
    this.pyus = []
  }
  onmessage({ bang, crack, pyu }) {
    if (bang) this.bang += bang
    if (crack) this.crack += crack
    if (pyu) {
      this.pyus.push({ wave: createPeriodicPlayer(this.pyuWave), t: 0, dt: createLowPass3(0.25) })
    }
  }
  process(_inputs, outputs, _parameters) {
    const output = outputs[0]
    const len = output[0].length
    for (let i = 0; i < len; i++) {
      const bang1 = this.vbang1(this.bang)
      const bang2 = this.vbang2(this.bang)
      const crack = this.vcrack(this.crack)
      this.bang = this.crack = 0
      const mid = this.wmiddle(Math.random() * 2 - 1)
      const low = this.wlow(Math.random() * 2 - 1)
      const high = this.whigh(Math.random() * 2 - 1)
      let v = (
        0.5 * bang1 * mid +
        0.4 * bang2 * low +
        0.1 * crack * high
      )
      this.pyus = this.pyus.filter(pyu => {
        pyu.t += 0.4 / sampleRate
        v += 0.3 * pyu.t * (1 - pyu.t) ** 3 * pyu.wave((4 - 2 * pyu.t) * (1 + 0.02 * pyu.dt(2 * Math.random() - 1)))
        return pyu.t < 1
      })
      output.forEach(chan => chan[i] = v)
    }
    return true
  }
}

registerProcessor("fireworks-processor", FireworksProcessor)
