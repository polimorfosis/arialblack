import { useRef, useCallback } from 'react'

// Curva de distorsión (overdrive suave)
function makeDriveCurve(amount = 50) {
  const n = 256
  const curve = new Float32Array(n)
  const deg = Math.PI / 180
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x))
  }
  return curve
}

// Curva de fuzz (clipeo agresivo + asimetría)
function makeFuzzCurve() {
  const n = 256
  const curve = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1
    curve[i] = Math.tanh(x * 12) * 0.85
  }
  return curve
}

// Genera un loop de batería + riff sintético más dinámico
function createBandLoop(ctx) {
  const sr = ctx.sampleRate
  const bpm = 120
  const beat = (60 / bpm) * sr
  const bars = 2
  const totalSamples = Math.floor(beat * 4 * bars)
  const buffer = ctx.createBuffer(2, totalSamples, sr)

  // Power chord E5 con sub-bass
  const notes = [
    { f: 82.41,  amp: 0.5  },  // E2
    { f: 123.47, amp: 0.35 },  // B2
    { f: 164.81, amp: 0.3  },  // E3
    { f: 246.94, amp: 0.2  },  // B3
  ]

  // Patrón rítmico: downstrokes en 1 y 3 con palm mute en 2 y 4
  const strums = [
    { start: 0,        dur: beat * 1.8, amp: 1.0  },
    { start: beat * 2, dur: beat * 0.4, amp: 0.5  },
    { start: beat * 2.5, dur: beat * 0.4, amp: 0.4 },
    { start: beat * 4, dur: beat * 1.8, amp: 1.0  },
    { start: beat * 6, dur: beat * 0.4, amp: 0.5  },
    { start: beat * 6.5, dur: beat * 0.4, amp: 0.4 },
  ]

  for (let ch = 0; ch < 2; ch++) {
    const d = buffer.getChannelData(ch)

    for (const strum of strums) {
      const s0 = Math.floor(strum.start)
      const len = Math.floor(strum.dur)
      const attack = Math.floor(sr * 0.008)
      const release = Math.floor(len * 0.35)

      for (let i = 0; i < len && s0 + i < totalSamples; i++) {
        const t = i / sr
        let sample = 0
        for (const note of notes) {
          const harmonics = [1, 2, 3, 5]
          for (const h of harmonics) {
            sample += Math.sin(2 * Math.PI * note.f * h * t) * (note.amp / h)
          }
        }
        // Envolvente
        let env = 1
        if (i < attack) env = i / attack
        else if (i > len - release) env = (len - i) / release
        // Distorsión leve integrada
        const driven = Math.tanh(sample * 2.5) * strum.amp * env * 0.4
        d[s0 + i] = (d[s0 + i] || 0) + driven
      }
    }

    // Hi-hat sintético (ruido filtrado)
    for (let beat_i = 0; beat_i < 4 * bars; beat_i++) {
      const pos = Math.floor(beat_i * beat)
      const dur = Math.floor(beat * 0.08)
      for (let i = 0; i < dur && pos + i < totalSamples; i++) {
        const env = 1 - i / dur
        const noise = (Math.random() * 2 - 1) * env * 0.12
        if (pos + i < totalSamples) d[pos + i] += noise
      }
    }

    // Kick en tiempos 1 y 3
    for (const kick_beat of [0, 2, 4, 6]) {
      const pos = Math.floor(kick_beat * beat)
      const dur = Math.floor(sr * 0.12)
      for (let i = 0; i < dur && pos + i < totalSamples; i++) {
        const t = i / sr
        const env = Math.exp(-t * 30)
        const freq = 60 * Math.exp(-t * 40)
        const kick = Math.sin(2 * Math.PI * freq * t) * env * 0.6
        if (pos + i < totalSamples) d[pos + i] += kick
      }
    }
  }

  return buffer
}

export function useAudioEngine() {
  const ctxRef        = useRef(null)
  const noiseGainRef  = useRef(null)
  const bandGainRef   = useRef(null)
  const driveNodeRef  = useRef(null)   // WaveShaper drive
  const fuzzNodeRef   = useRef(null)   // WaveShaper fuzz
  const driveGainRef  = useRef(null)
  const fuzzGainRef   = useRef(null)
  const bandDryRef    = useRef(null)   // nodo seco sin fx
  const startedRef    = useRef(false)

  function createNoiseBuffer(ctx) {
    const size = ctx.sampleRate * 3
    const buf = ctx.createBuffer(1, size, ctx.sampleRate)
    const d = buf.getChannelData(0)
    let b0 = 0, b1 = 0, b2 = 0
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.96900 * b2 + w * 0.1538520
      d[i] = (b0 + b1 + b2 + w * 0.5362) * 0.11
    }
    return buf
  }

  const init = useCallback(async () => {
    if (startedRef.current) return
    startedRef.current = true

    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    ctxRef.current = ctx
    if (ctx.state === 'suspended') await ctx.resume()

    // ---- Noise chain ----
    const noiseBuf = createNoiseBuffer(ctx)
    const noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = noiseBuf
    noiseSrc.loop = true

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 1200
    noiseFilter.Q.value = 0.6

    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.85
    noiseGainRef.current = noiseGain

    noiseSrc.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    noiseSrc.start()

    // ---- Band audio chain ----
    const bandBuf = createBandLoop(ctx)
    const bandSrc = ctx.createBufferSource()
    bandSrc.buffer = bandBuf
    bandSrc.loop = true

    const bandGain = ctx.createGain()
    bandGain.gain.value = 0
    bandGainRef.current = bandGain

    // ---- Drive FX ----
    const driveShaper = ctx.createWaveShaper()
    driveShaper.curve = makeDriveCurve(60)
    driveShaper.oversample = '4x'
    driveNodeRef.current = driveShaper

    const driveGain = ctx.createGain()
    driveGain.gain.value = 0   // 0 = bypass, 1 = activo
    driveGainRef.current = driveGain

    // ---- Fuzz FX ----
    const fuzzShaper = ctx.createWaveShaper()
    fuzzShaper.curve = makeFuzzCurve()
    fuzzShaper.oversample = '4x'
    fuzzNodeRef.current = fuzzShaper

    const fuzzFilter = ctx.createBiquadFilter()
    fuzzFilter.type = 'lowpass'
    fuzzFilter.frequency.value = 3500

    const fuzzGain = ctx.createGain()
    fuzzGain.gain.value = 0
    fuzzGainRef.current = fuzzGain

    // ---- Dry signal ----
    const dryGain = ctx.createGain()
    dryGain.gain.value = 1
    bandDryRef.current = dryGain

    // Routing:
    // bandSrc → bandGain → dryGain → destination (señal limpia)
    //                    → driveShaper → driveGain → destination
    //                    → fuzzShaper → fuzzFilter → fuzzGain → destination
    bandSrc.connect(bandGain)
    bandGain.connect(dryGain)
    dryGain.connect(ctx.destination)

    bandGain.connect(driveShaper)
    driveShaper.connect(driveGain)
    driveGain.connect(ctx.destination)

    bandGain.connect(fuzzShaper)
    fuzzShaper.connect(fuzzFilter)
    fuzzFilter.connect(fuzzGain)
    fuzzGain.connect(ctx.destination)

    bandSrc.start()
  }, [])

  const setSignalMix = useCallback((normalizedSignal) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const t = ctx.currentTime
    const ramp = 0.1
    const noiseVol = Math.max(0, 1 - normalizedSignal)
    const bandVol  = normalizedSignal * 0.8

    noiseGainRef.current?.gain.linearRampToValueAtTime(noiseVol * 0.85, t + ramp)
    bandGainRef.current?.gain.linearRampToValueAtTime(bandVol, t + ramp)
  }, [])

  // fxState: { drive: bool, fuzz: bool }
  const setFxState = useCallback((fxState) => {
    const ctx = ctxRef.current
    if (!ctx) return
    const t = ctx.currentTime
    const ramp = 0.05

    const driveAmt = fxState.drive ? 0.7 : 0
    const fuzzAmt  = fxState.fuzz  ? 0.6 : 0
    // Bajar dry cuando hay fx para evitar clipping
    const dryAmt   = fxState.drive || fxState.fuzz ? 0.3 : 1

    driveGainRef.current?.gain.linearRampToValueAtTime(driveAmt, t + ramp)
    fuzzGainRef.current?.gain.linearRampToValueAtTime(fuzzAmt, t + ramp)
    bandDryRef.current?.gain.linearRampToValueAtTime(dryAmt, t + ramp)
  }, [])

  return { init, setSignalMix, setFxState }
}
