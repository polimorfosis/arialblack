import { useState, useEffect, useRef, useCallback } from 'react'
import Knob from './components/Knob'
import FxButtons from './components/FxButtons'
import LCDScreen from './components/LCDScreen'
import { useAudioEngine } from './hooks/useAudioEngine'

const TARGET_FREQ = 0.70
const TARGET_GAIN = 0.30
const MARGIN = 0.06
const LOCK_DURATION = 1500

function isInRange(val, target) {
  return Math.abs(val - target) <= MARGIN
}

function calcSignal(freq, gain) {
  const dFreq = Math.abs(freq - TARGET_FREQ)
  const dGain = Math.abs(gain - TARGET_GAIN)
  const maxDist = Math.SQRT2 / 2
  const dist = Math.sqrt(dFreq * dFreq + dGain * dGain)
  return Math.max(0, 1 - dist / maxDist)
}

export default function App() {
  const [phase, setPhase]               = useState('idle')
  const [freq, setFreq]                 = useState(0.15)
  const [gain, setGain]                 = useState(0.85)
  const [signalStrength, setSignal]     = useState(0)
  const [fxActive, setFxActive]         = useState({ drive: false, fuzz: false })

  const lockTimerRef = useRef(null)
  const { init, setSignalMix, setFxState } = useAudioEngine()

  const startAudio = useCallback(async () => {
    if (phase !== 'idle') return
    await init()
    setPhase('noise')
  }, [phase, init])

  useEffect(() => {
    if (phase !== 'noise' && phase !== 'lock') return

    const strength = calcSignal(freq, gain)
    setSignal(strength)
    setSignalMix(strength)

    const locked = isInRange(freq, TARGET_FREQ) && isInRange(gain, TARGET_GAIN)

    if (locked && phase === 'noise') {
      setPhase('lock')
      lockTimerRef.current = setTimeout(() => {
        setPhase('reboot')
        setTimeout(() => setPhase('revealed'), 1400)
      }, LOCK_DURATION)
    }

    if (!locked && phase === 'lock') {
      clearTimeout(lockTimerRef.current)
      setPhase('noise')
    }
  }, [freq, gain, phase, setSignalMix])

  useEffect(() => () => clearTimeout(lockTimerRef.current), [])

  const handleFxToggle = useCallback((id) => {
    if (phase === 'idle') return
    setFxActive(prev => {
      const next = { ...prev, [id]: !prev[id] }
      setFxState(next)
      return next
    })
  }, [phase, setFxState])

  const isInteractive = phase === 'noise' || phase === 'lock'
  const isLocked      = phase === 'lock'
  const isRevealed    = phase === 'revealed' || phase === 'reboot'

  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ width: '100dvw', height: '100dvh', background: '#0b0b0b', fontFamily: "'Share Tech Mono', monospace" }}
    >
      {/* Glow ambiental */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700"
        style={{
          width: '320px', height: '320px',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: isRevealed
            ? 'radial-gradient(circle, rgba(0,255,65,0.14) 0%, transparent 70%)'
            : isLocked
              ? 'radial-gradient(circle, rgba(0,255,65,0.08) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255,68,0,0.05) 0%, transparent 70%)',
        }}
      />

      {/* Cuerpo del pedal */}
      <div className="relative flex flex-col gap-3 w-full max-w-xs px-4" style={{ userSelect: 'none', marginTop: '-40px' }}>

        {/* Header */}
        <div className="flex justify-between items-center px-1">
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', letterSpacing: '0.3em', fontFamily: "'Share Tech Mono', monospace" }}>
            ARIAL//FX
          </div>
          <div style={{
            fontSize: '10px', letterSpacing: '0.2em', fontFamily: "'Share Tech Mono', monospace",
            color: isLocked ? '#00ff41' : phase === 'noise' ? '#ff8800' : phase === 'idle' ? 'rgba(255,255,255,0.2)' : '#00ff41',
            textShadow: isLocked ? '0 0 6px rgba(0,255,65,0.8)' : 'none',
          }}>
            {isLocked ? '◉ LOCKED' : phase === 'noise' ? '◎ SCANNING' : phase === 'idle' ? '◌ STANDBY' : '◉ SIGNAL OK'}
          </div>
        </div>

        {/* Pantalla LCD */}
        <div
          className="relative"
          style={{ height: '170px' }}
          onClick={startAudio}
        >
          {phase === 'idle' ? (
            <div
              className="lcd-screen rounded-lg w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer"
              style={{ touchAction: 'manipulation' }}
            >
              <div className="lcd-text text-3xl tracking-widest glitch-text" style={{ fontFamily: "'VT323', monospace" }}>
                SIGNAL//LOST
              </div>
              <div className="lcd-dim text-xs tracking-widest text-center px-4" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
                TAP PARA INICIALIZAR<br />
                <span className="blink-cursor">█</span>
              </div>
            </div>
          ) : (
            <LCDScreen phase={phase} signalStrength={signalStrength} />
          )}

          {phase === 'noise' && (
            <>
              <div className="absolute inset-0 rounded-lg pointer-events-none glitch-layer-1"
                style={{ background: 'linear-gradient(transparent 30%, rgba(0,255,65,0.03) 50%, transparent 70%)', mixBlendMode: 'screen' }} />
              <div className="absolute inset-0 rounded-lg pointer-events-none glitch-layer-2"
                style={{ background: 'linear-gradient(transparent 10%, rgba(255,0,0,0.02) 40%, transparent 80%)', mixBlendMode: 'screen' }} />
              <div className="absolute left-0 right-0 pointer-events-none"
                style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.4), transparent)', animation: 'scanline-sweep 2.5s linear infinite' }} />
            </>
          )}
        </div>

        {/* Separador CONTROL */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '8px', letterSpacing: '0.3em' }}>CONTROL</div>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
        </div>

        {/* Knobs */}
        <div className="flex justify-around items-start px-4">
          <Knob
            value={freq}
            onChange={isInteractive ? setFreq : () => {}}
            label="FREQ"
            color={isLocked ? '#00ff41' : '#ff4400'}
          />

          {/* Display SIG% */}
          <div className="flex flex-col items-center gap-1 pt-1">
            <div
              className="w-12 h-12 rounded border flex items-center justify-center"
              style={{
                border: `1px solid ${isLocked ? 'rgba(0,255,65,0.4)' : 'rgba(255,68,0,0.25)'}`,
                background: 'rgba(0,0,0,0.6)',
                boxShadow: isLocked ? '0 0 10px rgba(0,255,65,0.2)' : 'none',
              }}
            >
              <div style={{
                fontFamily: "'VT323', monospace", fontSize: '22px', lineHeight: 1,
                color: isLocked ? '#00ff41' : '#ff4400',
                textShadow: `0 0 6px ${isLocked ? 'rgba(0,255,65,0.8)' : 'rgba(255,68,0,0.8)'}`,
              }}>
                {Math.round(signalStrength * 100)}
              </div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '8px', letterSpacing: '0.15em', fontFamily: "'Share Tech Mono', monospace" }}>SIG%</div>
          </div>

          <Knob
            value={gain}
            onChange={isInteractive ? setGain : () => {}}
            label="GAIN"
            color={isLocked ? '#00ff41' : '#ff8800'}
          />
        </div>

        {/* Separador FX */}
        <div className="flex items-center gap-2 px-1">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
          <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '8px', letterSpacing: '0.3em' }}>FX</div>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
        </div>

        {/* Botones FX */}
        <FxButtons active={fxActive} onToggle={handleFxToggle} />

        {/* Footer */}
        <div className="flex justify-center mt-1">
          <div style={{
            color: 'rgba(255,255,255,0.1)', fontSize: '8px', letterSpacing: '0.4em',
            fontFamily: "'Share Tech Mono', monospace",
            borderTop: '1px solid rgba(255,255,255,0.05)',
            padding: '4px 16px',
          }}>
            ARIALBLACK · FX-001 · HANDWIRED
          </div>
        </div>
      </div>

      {/* Instrucciones flotantes */}
      {phase === 'noise' && (
        <div className="absolute bottom-6 text-center px-4"
          style={{ color: 'rgba(0,255,65,0.4)', fontSize: '10px', letterSpacing: '0.2em', fontFamily: "'Share Tech Mono', monospace" }}>
          AJUSTÁ FREQ → 70% · GAIN → 30%
        </div>
      )}

      {phase === 'lock' && (
        <div className="absolute bottom-6 text-center px-4"
          style={{
            color: '#00ff41', fontSize: '10px', letterSpacing: '0.2em',
            fontFamily: "'Share Tech Mono', monospace",
            textShadow: '0 0 8px rgba(0,255,65,0.8)',
            animation: 'glitch-text 0.5s infinite',
          }}>
          ◉ SEÑAL DETECTADA — MANTENÉ...
        </div>
      )}
    </div>
  )
}
