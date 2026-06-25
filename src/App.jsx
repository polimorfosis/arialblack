import { useState, useEffect, useRef, useCallback } from 'react'
import Knob from './components/Knob'
import FxButtons from './components/FxButtons'
import LCDScreen from './components/LCDScreen'
import { useAudioEngine } from './hooks/useAudioEngine'

const TARGET_FREQ = 0.70
const TARGET_GAIN = 0.30
const MARGIN = 0.14
const LOCK_DURATION = 1500

function isInRange(val, target) {
  return Math.abs(val - target) <= MARGIN
}

function calcSignal(freq, gain) {
  const dFreq = Math.abs(freq - TARGET_FREQ)
  const dGain = Math.abs(gain - TARGET_GAIN)
  const dist = Math.sqrt(dFreq * dFreq + dGain * dGain)
  return Math.max(0, 1 - dist / (Math.SQRT2 / 2))
}

function Screw({ style }) {
  return <div className="screw" style={style} />
}

export default function App() {
  const [phase, setPhase]           = useState('idle')
  const [freq, setFreq]             = useState(0.15)
  const [gain, setGain]             = useState(0.85)
  const [signalStrength, setSignal] = useState(0)
  const [fxActive, setFxActive]     = useState({ drive: false, fuzz: false })

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

  const knobLedState = isLocked ? 'locked' : phase === 'noise' ? 'active' : 'idle'

  return (
    <div style={{
      width: '100dvw',
      height: '100dvh',
      background: 'radial-gradient(ellipse at center, #2a2a2a 0%, #111 60%, #0a0a0a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Share Tech Mono', monospace",
    }}>

      {/* ========== CUERPO DEL PEDAL ========== */}
      <div
        className="pedal-body"
        style={{
          width: '300px',
          position: 'relative',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {/* Tornillos en las 4 esquinas */}
        <Screw style={{ top: '10px', left: '10px' }} />
        <Screw style={{ top: '10px', right: '10px' }} />
        <Screw style={{ bottom: '10px', left: '10px' }} />
        <Screw style={{ bottom: '10px', right: '10px' }} />

        {/* ---- PANEL SUPERIOR NEGRO (LCD + marca) ---- */}
        <div className="pedal-top-panel" style={{ padding: '10px 12px 12px', borderRadius: '8px' }}>

          {/* Marca superior */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            {/* Jacks laterales decorativos */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div className="jack" />
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '8px', letterSpacing: '0.2em' }}>IN</span>
            </div>

            {/* Nombre del modelo */}
            <div style={{ textAlign: 'center' }}>
              <div className="pedal-model-name" style={{ fontSize: '20px' }}>
                ARIAL//FX
              </div>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '7px',
                color: 'rgba(245,200,66,0.45)',
                letterSpacing: '0.3em',
              }}>
                SIGNAL PROCESSOR
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '8px', letterSpacing: '0.2em' }}>OUT</span>
              <div className="jack" />
            </div>
          </div>

          {/* LED de power + status */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                className={isLocked || isRevealed ? 'power-led-ok' : 'power-led-on'}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isLocked || isRevealed ? '#00ff41' : '#ff3300',
                  flexShrink: 0,
                }}
              />
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '8px',
                letterSpacing: '0.2em',
                color: isLocked ? '#00ff41' : phase === 'noise' ? '#ff8800' : 'rgba(255,255,255,0.25)',
                textShadow: isLocked ? '0 0 6px rgba(0,255,65,0.8)' : 'none',
              }}>
                {isLocked ? 'LOCKED' : phase === 'noise' ? 'SCANNING' : phase === 'idle' ? 'STANDBY' : 'SIGNAL OK'}
              </span>
            </div>
          </div>

          {/* LCD */}
          <div
            className="lcd-screen"
            style={{ borderRadius: '6px', height: '148px', position: 'relative', overflow: 'hidden', cursor: phase === 'idle' ? 'pointer' : 'default' }}
            onClick={startAudio}
          >
            {phase === 'idle' ? (
              <div style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '10px',
              }}>
                <div className="lcd-text glitch-text" style={{ fontFamily: "'VT323', monospace", fontSize: '32px', letterSpacing: '0.2em' }}>
                  SIGNAL//LOST
                </div>
                <div className="lcd-dim" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', letterSpacing: '0.25em', textAlign: 'center' }}>
                  TAP PARA INICIALIZAR<br />
                  <span className="blink-cursor">█</span>
                </div>
              </div>
            ) : (
              <LCDScreen phase={phase} signalStrength={signalStrength} />
            )}

            {/* Glitch layers */}
            {phase === 'noise' && (
              <>
                <div className="glitch-layer-1" style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'linear-gradient(transparent 30%, rgba(0,255,65,0.03) 50%, transparent 70%)',
                  mixBlendMode: 'screen',
                }} />
                <div className="glitch-layer-2" style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'linear-gradient(transparent 10%, rgba(255,0,0,0.02) 40%, transparent 80%)',
                  mixBlendMode: 'screen',
                }} />
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: '2px', pointerEvents: 'none',
                  background: 'linear-gradient(90deg, transparent, rgba(0,255,65,0.4), transparent)',
                  animation: 'scanline-sweep 2.5s linear infinite',
                }} />
              </>
            )}
          </div>
        </div>

        {/* ---- PANEL DE KNOBS (amarillo) ---- */}
        <div className="pedal-knob-panel" style={{ padding: '8px 16px 4px' }}>

          {/* Línea separadora serigráfica */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.3), transparent)' }} />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '7px', letterSpacing: '0.35em', color: 'rgba(0,0,0,0.4)' }}>
              CONTROL
            </span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.3), transparent)' }} />
          </div>

          {/* Knobs */}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start' }}>
            <Knob
              value={freq}
              onChange={isInteractive ? setFreq : () => {}}
              label="FREQ"
              color={isLocked ? '#00ff41' : '#ff4400'}
              ledState={knobLedState}
            />

            {/* Display SIG% central */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', paddingTop: '16px' }}>
              <div style={{
                width: '44px', height: '44px',
                background: 'rgba(0,0,0,0.6)',
                border: `1.5px solid ${isLocked ? 'rgba(0,255,65,0.5)' : 'rgba(0,0,0,0.4)'}`,
                borderRadius: '6px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isLocked ? '0 0 10px rgba(0,255,65,0.2)' : 'inset 0 1px 3px rgba(0,0,0,0.5)',
              }}>
                <span style={{
                  fontFamily: "'VT323', monospace",
                  fontSize: '24px',
                  lineHeight: 1,
                  color: isLocked ? '#00ff41' : '#ff4400',
                  textShadow: `0 0 8px ${isLocked ? 'rgba(0,255,65,0.9)' : 'rgba(255,68,0,0.7)'}`,
                }}>
                  {Math.round(signalStrength * 100)}
                </span>
              </div>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '7px',
                letterSpacing: '0.2em',
                color: 'rgba(0,0,0,0.45)',
              }}>
                SIG%
              </span>
            </div>

            <Knob
              value={gain}
              onChange={isInteractive ? setGain : () => {}}
              label="GAIN"
              color={isLocked ? '#00ff41' : '#ff8800'}
              ledState={knobLedState}
            />
          </div>
        </div>

        {/* ---- PANEL FX (negro inferior) ---- */}
        <div style={{
          background: 'linear-gradient(180deg, #181818, #111)',
          borderRadius: '8px',
          padding: '10px 12px 12px',
          border: '1px solid #0a0a0a',
        }}>
          {/* Separador FX */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '7px', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.2)' }}>
              EFFECTS
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <FxButtons active={fxActive} onToggle={handleFxToggle} />

          {/* Footer grabado */}
          <div style={{
            marginTop: '10px',
            textAlign: 'center',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '7px',
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.1)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '8px',
          }}>
            ARIALBLACK · FX-001 · HANDWIRED
          </div>
        </div>
      </div>

      {phase === 'lock' && (
        <div style={{
          position: 'fixed', bottom: '16px', left: 0, right: 0,
          textAlign: 'center',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.2em',
          color: '#00ff41',
          textShadow: '0 0 8px rgba(0,255,65,0.8)',
          animation: 'glitch-text 0.5s infinite',
        }}>
          ◉ SEÑAL DETECTADA — MANTENÉ...
        </div>
      )}
    </div>
  )
}
