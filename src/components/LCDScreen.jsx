import { useEffect, useState, useRef } from 'react'

const GLITCH_CHARS = '░▒▓█▄▀■□▪▫◆◇○●◘◙♦♣♠♥↑↓←→↕↔¶§¥¢£⌂☺☻♪♫☼►◄↨↑↓'
const NOISE_LINES = [
  '> INIT SIG_PROC v0.3.1...',
  '> CARRIER FREQ: ----  Hz',
  '> SNR: -42 dB  [CRÍTICO]',
  '> BUSCANDO SEÑAL...',
  '> ERR: SRC_NOT_FOUND',
  '> REINTENTANDO... [  ]',
]

function randomChar() {
  return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
}

function glitchString(str, amount = 0.3) {
  return str.split('').map(c =>
    Math.random() < amount ? randomChar() : c
  ).join('')
}

// Estado: 'noise' | 'lock' | 'reboot' | 'revealed'
export default function LCDScreen({ phase, signalStrength }) {
  const [lines, setLines] = useState(NOISE_LINES)
  const [cursor, setCursor] = useState(true)
  const [snrValue, setSnrValue] = useState(-42)
  const intervalRef = useRef(null)

  // Cursor blink
  useEffect(() => {
    const id = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(id)
  }, [])

  // Glitch loop en fase 'noise'
  useEffect(() => {
    if (phase !== 'noise' && phase !== 'lock') {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => {
      const glitchAmt = phase === 'lock' ? 0.05 : 0.22
      setLines(NOISE_LINES.map(l => glitchString(l, glitchAmt)))
      const newSnr = Math.round(-42 + signalStrength * 42)
      setSnrValue(newSnr)
    }, phase === 'lock' ? 180 : 80)
    return () => clearInterval(intervalRef.current)
  }, [phase, signalStrength])

  const snrColor =
    snrValue > -5 ? '#00ff41' :
    snrValue > -20 ? '#aaff00' :
    snrValue > -35 ? '#ffaa00' : '#ff4400'

  if (phase === 'reboot') {
    return (
      <div className="lcd-screen rounded-lg p-4 w-full h-full flex items-center justify-center reboot-anim">
        <div className="lcd-text text-2xl text-center tracking-widest" style={{ fontFamily: "'VT323', monospace" }}>
          [  REBOOTING  ]<br />
          <span className="text-lg">▓▓▓▓▓▓▓▓▓▓</span><br />
          <span className="text-base lcd-dim">SIG_LOCK CONFIRMED</span>
        </div>
      </div>
    )
  }

  if (phase === 'revealed') {
    return (
      <div className="lcd-screen rounded-lg p-4 w-full h-full flex flex-col items-center justify-center gap-2">
        {/* Nombre de la banda */}
        <div
          className="lcd-text text-4xl tracking-widest text-center reveal-anim"
          style={{ fontFamily: "'VT323', monospace", animationDelay: '0.05s', opacity: 0 }}
        >
          ARIAL BLACK
        </div>
        <div
          className="lcd-dim text-sm tracking-widest text-center reveal-anim"
          style={{ fontFamily: "'Share Tech Mono', monospace", animationDelay: '0.3s', opacity: 0 }}
        >
          ── PRIMER SHOW ──
        </div>
        <div
          className="lcd-text text-2xl tracking-wide text-center reveal-anim"
          style={{ fontFamily: "'VT323', monospace", animationDelay: '0.55s', opacity: 0 }}
        >
          15 · AGO · 2025
        </div>
        <div
          className="lcd-text text-xl text-center reveal-anim"
          style={{ fontFamily: "'VT323', monospace", animationDelay: '0.8s', opacity: 0 }}
        >
          NICETO CLUB<br />
          <span className="text-base lcd-dim">Bs. As. · 21:00 hs</span>
        </div>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="reveal-anim mt-2 px-5 py-2 rounded border text-sm tracking-widest uppercase font-bold"
          style={{
            borderColor: '#00ff41',
            color: '#00ff41',
            background: 'rgba(0,255,65,0.08)',
            fontFamily: "'Share Tech Mono', monospace",
            boxShadow: '0 0 10px rgba(0,255,65,0.2)',
            animationDelay: '1.1s',
            opacity: 0,
            WebkitTapHighlightColor: 'transparent',
            textDecoration: 'none',
          }}
        >
          ▶ @ARIALBLACK
        </a>
      </div>
    )
  }

  // Fase noise / lock
  return (
    <div className="lcd-screen rounded-lg p-3 w-full h-full flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-1">
        <span className="lcd-text text-sm" style={{ fontFamily: "'VT323', monospace" }}>
          SIG_PROC
        </span>
        <span className="text-xs" style={{ color: snrColor, fontFamily: "'Share Tech Mono', monospace", textShadow: `0 0 4px ${snrColor}` }}>
          SNR {snrValue >= 0 ? '+' : ''}{snrValue} dB
        </span>
      </div>

      {/* Líneas de texto con glitch */}
      <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
        {lines.map((line, i) => (
          <div
            key={i}
            className="text-[11px] truncate"
            style={{
              fontFamily: "'VT323', monospace",
              color: i === lines.length - 1 ? '#00ff41' : 'rgba(0,255,65,0.55)',
              textShadow: i === lines.length - 1 ? '0 0 6px rgba(0,255,65,0.8)' : 'none',
              fontSize: '13px',
            }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Signal bar */}
      <div className="mt-2">
        <div className="flex justify-between text-[10px] mb-0.5 lcd-dim" style={{ fontFamily: "'Share Tech Mono', monospace" }}>
          <span>NIVEL DE SEÑAL</span>
          <span>{Math.round(signalStrength * 100)}%</span>
        </div>
        <div className="h-2 rounded-sm overflow-hidden" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,255,65,0.2)' }}>
          <div
            className="h-full rounded-sm transition-all duration-100"
            style={{
              width: `${signalStrength * 100}%`,
              background: signalStrength > 0.8
                ? 'linear-gradient(90deg, #00ff41, #00ff99)'
                : signalStrength > 0.4
                  ? 'linear-gradient(90deg, #aaff00, #00ff41)'
                  : 'linear-gradient(90deg, #ff4400, #ffaa00)',
              boxShadow: `0 0 6px rgba(0,255,65,${signalStrength})`,
            }}
          />
        </div>
      </div>

      {/* Cursor */}
      <div className="mt-1 lcd-text text-sm" style={{ fontFamily: "'VT323', monospace" }}>
        {cursor ? '█' : ' '}
      </div>
    </div>
  )
}
