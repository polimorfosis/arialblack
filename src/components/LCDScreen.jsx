import { useEffect, useState, useRef } from 'react'

const GLITCH_CHARS = '░▒▓█▄▀■□▪▫◆◇○●◘◙♦♣♠♥↑↓←→↕↔¶§¥¢£⌂☺☻♪♫☼►◄↨↑↓'
const NOISE_LINES = [
  '> INIT SIG_PROC v0.3.1...',
  '> CARRIER FREQ: ----  Hz',
  '> SNR: -42 dB  [CRÍTICO]',
  '> BUSCANDO SEÑAL...',
  '> ERR: SRC_NOT_FOUND',
]

function randomChar() {
  return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
}
function glitchString(str, amount = 0.3) {
  return str.split('').map(c => Math.random() < amount ? randomChar() : c).join('')
}

export default function LCDScreen({ phase, signalStrength }) {
  const [lines, setLines]     = useState(NOISE_LINES)
  const [cursor, setCursor]   = useState(true)
  const [snrValue, setSnrValue] = useState(-42)
  const [targetBlink, setTargetBlink] = useState(true)
  const intervalRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(id)
  }, [])

  // Parpadeo de la línea de objetivo (llama la atención)
  useEffect(() => {
    if (phase !== 'noise') return
    const id = setInterval(() => setTargetBlink(b => !b), 900)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'noise' && phase !== 'lock') {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      const glitchAmt = phase === 'lock' ? 0.04 : 0.2
      setLines(NOISE_LINES.map(l => glitchString(l, glitchAmt)))
      setSnrValue(Math.round(-42 + signalStrength * 42))
    }, phase === 'lock' ? 200 : 90)
    return () => clearInterval(intervalRef.current)
  }, [phase, signalStrength])

  const snrColor =
    snrValue > -5  ? '#00ff41' :
    snrValue > -20 ? '#aaff00' :
    snrValue > -35 ? '#ffaa00' : '#ff4400'

  /* ---- REBOOT ---- */
  if (phase === 'reboot') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        className="reboot-anim">
        <div className="lcd-text" style={{ fontFamily: "'VT323', monospace", fontSize: '22px', textAlign: 'center', lineHeight: 1.4 }}>
          [  REBOOTING  ]<br />
          <span style={{ fontSize: '18px' }}>▓▓▓▓▓▓▓▓▓▓</span><br />
          <span className="lcd-dim" style={{ fontSize: '16px' }}>SIG_LOCK CONFIRMED</span>
        </div>
      </div>
    )
  }

  /* ---- REVEALED ---- */
  if (phase === 'revealed') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}>
        <div className="lcd-text reveal-anim" style={{ fontFamily: "'VT323', monospace", fontSize: '38px', letterSpacing: '0.15em', textAlign: 'center', opacity: 0, animationDelay: '0.05s' }}>
          ARIAL BLACK
        </div>
        <div className="lcd-dim reveal-anim" style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', letterSpacing: '0.25em', textAlign: 'center', opacity: 0, animationDelay: '0.3s' }}>
          ── PRIMER SHOW ──
        </div>
        <div className="lcd-text reveal-anim" style={{ fontFamily: "'VT323', monospace", fontSize: '26px', letterSpacing: '0.1em', textAlign: 'center', opacity: 0, animationDelay: '0.55s' }}>
          15 · AGO · 2025
        </div>
        <div className="lcd-text reveal-anim" style={{ fontFamily: "'VT323', monospace", fontSize: '20px', textAlign: 'center', opacity: 0, animationDelay: '0.8s' }}>
          NICETO CLUB<br />
          <span className="lcd-dim" style={{ fontSize: '16px' }}>Bs. As. · 21:00 hs</span>
        </div>
        <a
          href="https://instagram.com/arialblack"
          target="_blank"
          rel="noopener noreferrer"
          className="reveal-anim"
          style={{
            marginTop: '4px',
            padding: '5px 16px',
            borderRadius: '4px',
            border: '1px solid #00ff41',
            color: '#00ff41',
            background: 'rgba(0,255,65,0.08)',
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            boxShadow: '0 0 10px rgba(0,255,65,0.2)',
            opacity: 0,
            animationDelay: '1.1s',
            textDecoration: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          ▶ @ARIALBLACK
        </a>
      </div>
    )
  }

  /* ---- NOISE / LOCK ---- */
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '10px 10px 8px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span className="lcd-text" style={{ fontFamily: "'VT323', monospace", fontSize: '16px' }}>SIG_PROC</span>
        <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: '10px', color: snrColor, textShadow: `0 0 4px ${snrColor}` }}>
          SNR {snrValue >= 0 ? '+' : ''}{snrValue} dB
        </span>
      </div>

      {/* Líneas glitch */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', overflow: 'hidden' }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            fontFamily: "'VT323', monospace",
            fontSize: '13px',
            color: i === lines.length - 1 ? '#00ff41' : 'rgba(0,255,65,0.5)',
            textShadow: i === lines.length - 1 ? '0 0 6px rgba(0,255,65,0.8)' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}>
            {line}
          </div>
        ))}
      </div>

      {/* ▼ OBJETIVO — línea fija prominente ▼ */}
      <div style={{
        margin: '6px 0 4px',
        padding: '5px 8px',
        border: `1px solid ${phase === 'lock' ? '#00ff41' : targetBlink ? 'rgba(0,255,65,0.7)' : 'rgba(0,255,65,0.2)'}`,
        borderRadius: '3px',
        background: phase === 'lock' ? 'rgba(0,255,65,0.1)' : 'rgba(0,0,0,0.3)',
        transition: 'border-color 0.3s, background 0.3s',
      }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '9px',
          color: 'rgba(0,255,65,0.5)',
          letterSpacing: '0.15em',
          marginBottom: '2px',
        }}>
          OBJETIVO:
        </div>
        <div style={{
          fontFamily: "'VT323', monospace",
          fontSize: '18px',
          color: phase === 'lock' ? '#00ff41' : targetBlink ? '#00ff41' : 'rgba(0,255,65,0.5)',
          textShadow: phase === 'lock' ? '0 0 8px rgba(0,255,65,1)' : targetBlink ? '0 0 6px rgba(0,255,65,0.8)' : 'none',
          letterSpacing: '0.05em',
          lineHeight: 1,
          transition: 'color 0.3s',
        }}>
          FREQ: 70% · GAIN: 30%
        </div>
      </div>

      {/* Barra de señal */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Share Tech Mono', monospace", fontSize: '9px', marginBottom: '3px', color: '#007a20' }}>
          <span>NIVEL DE SEÑAL</span>
          <span>{Math.round(signalStrength * 100)}%</span>
        </div>
        <div style={{ height: '6px', borderRadius: '2px', overflow: 'hidden', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,65,0.15)' }}>
          <div style={{
            height: '100%',
            width: `${signalStrength * 100}%`,
            background: signalStrength > 0.8
              ? 'linear-gradient(90deg, #00ff41, #00ff99)'
              : signalStrength > 0.4
                ? 'linear-gradient(90deg, #aaff00, #00ff41)'
                : 'linear-gradient(90deg, #ff4400, #ffaa00)',
            boxShadow: `0 0 6px rgba(0,255,65,${signalStrength})`,
            transition: 'width 0.1s linear',
          }} />
        </div>
      </div>

      {/* Cursor */}
      <div className="lcd-text" style={{ fontFamily: "'VT323', monospace", fontSize: '14px', marginTop: '2px', height: '14px' }}>
        {cursor ? '█' : ' '}
      </div>
    </div>
  )
}
