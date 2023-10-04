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

function createMovingAverage(sec) {
  const length = Math.round(sec * sampleRate)
  const waves = new Array(length).fill(0)
  let i = 0
  let sum = 0
  const s = 1 / Math.sqrt(length)
  return (v) => {
    sum += v - waves[i]
    waves[i] = v
    i = (i + 1) % length
    return sum * s
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

class WindChimeProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args)
    this.port.onmessage = (event) => {
      this.onmessage(event.data)
    }
    this.cwave = periodicWave(3000, 32, 1)
    this.wwave = periodicWave(2000, 2, 1)
    this.wwaveFunc = createPeriodicPlayer(this.wwave)
    this.wvolFunc = createDecayVolume(0.5, 1)
    this.wvol = 0
    this.chimes = []
  }
  onmessage({ wind, chime }) {
    if (wind) this.wvol += Math.random()
    if (chime) {
      const v = Math.random()
      const f = 1 + 0.01 * Math.random()
      this.chimes.push({ t: 0, player: createPeriodicPlayer(this.cwave), vol: 0.2 * v, speed: f })
      this.chimes.push({ t: 0, player: createPeriodicPlayer(this.cwave), vol: 0.1 * Math.random() * v, speed: 2 * f })
    }
  }
  process(_inputs, outputs, _parameters) {
    const output = outputs[0]
    const len = output[0].length
    for (let i = 0; i < len; i++) {
      const wvol = this.wvolFunc(this.wvol)
      this.wvol = 0
      let v = 0.01 * wvol * this.wwaveFunc(1 + 0.2 * wvol)
      this.chimes = this.chimes.filter(chime => {
        const t = chime.t += 1 / sampleRate
        const u = Math.min(t / 0.002, 1)
        v += (3 * u ** 2 - 2 * u ** 3) * (Math.pow(0.001, t) - 0.001) * chime.vol * chime.player(chime.speed)
        return chime.t < 1
      })
      output.forEach(chan => chan[i] = v)
    }
    return true
  }
}

registerProcessor("windchime-processor", WindChimeProcessor)


class DemoProcessor extends AudioWorkletProcessor {
  constructor(...args) {
    super(...args)
    this.port.onmessage = (event) => {
      this.onmessage(event.data)
    }
    this.cwave = periodicWave(4000, 32, 1)
    this.sounds = []
  }
  wfuncFromType(wtype) {
    let t = 0
    switch(wtype) {
      case 'sin': return (_) => 0.3 * Math.sin(Math.PI * (t += 1000 * 2 * Math.PI / sampleRate))
      case 'rect': return (_) => 0.3 * Math.abs(Math.sin(Math.PI * (t += 1000 * 2 * Math.PI / sampleRate)))
      case 'tri': return (_) => 0.3 * 2 / Math.PI * Math.asin(Math.sin(Math.PI * (t += 1000 * 2 * Math.PI / sampleRate)))
      case 'white': return (_) => 0.15 * (2 * Math.random() - 1)
      case 'moving': { const f = createMovingAverage(0.001); return (v) => 0.4 * f(v) }
      case 'exp': { const f = createLowPass1(0.001); return (v) => 0.4 * f(v) }
      case 'lowpass': return createLowPass3(0.001)
      case 'bandpass1': return createBandPass(1000, 4)
      case 'bandpass2': return createBandPass(1000, 16)
    }
    const player1 = createPeriodicPlayer(this.cwave)
    const player2 = createPeriodicPlayer(this.cwave)
    const chime1 = (_) => 0.5 * player1(1)
    const chime2 = (_) => 0.5 * player2(2)
    const chime12 = (_) => 0.4 * player1(1) + 0.2 * player2(2)
    if (wtype == 'chime1') return chime1
    if (wtype == 'chime2') return chime2
    if (wtype == 'chime12') return chime12
  }
  onmessage({ type, decay, volume }) {
    this.sounds.push({
      wave: this.wfuncFromType(type),
      volume,
      t: 0,
      decay,
      duration: decay ? 2 : 1,
    })
  }
  volFuncConst(t) {
    if (t < 0 || t > 1) return 0
    t = Math.min(t, 1 - t)
    const v = t < 0.005 ? t / 0.005 : 1
    return v * v * (3 - 2 * v)
  }
  volFuncDecay(t) {
    const v = t < 0.005 ? t / 0.005 : 1
    return v * v * (3 - 2 * v) * (Math.exp(-8 * t) - Math.exp(-8))
  }
  process(_inputs, outputs, _parameters) {
    const output = outputs[0]
    const len = output[0].length
    for (let i = 0; i < len; i++) {
      let v = 0
      this.sounds = this.sounds.filter(sound => {
        sound.t += 1 / sampleRate
        const w = sound.wave(2 * Math.random() - 1)
        v += sound.volume * w * (sound.decay ? this.volFuncDecay(sound.t / sound.duration) : this.volFuncConst(sound.t / sound.duration))
        return sound.t < sound.duration
      })
      output.forEach(chan => chan[i] = v)
    }
    return true
  }
}

registerProcessor("demo-processor", DemoProcessor)
