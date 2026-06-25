import { useRef, useCallback } from 'react'

// ledState: 'idle' | 'active' | 'locked'
export default function Knob({ value, onChange, label, color = '#ff4400', ledState = 'idle' }) {
  const startRef = useRef(null)
  const knobRef  = useRef(null)

  const clamp = (v) => Math.max(0, Math.min(1, v))

  const onPointerMove = useCallback((e) => {
    if (!startRef.current) return
    const delta = (startRef.current.y - e.clientY) / 130
    onChange(clamp(startRef.current.value + delta))
  }, [onChange])

  const onPointerUp = useCallback((e) => {
    if (!startRef.current) return
    startRef.current = null
    knobRef.current?.releasePointerCapture(e.pointerId)
  }, [])

  const onPointerDown = useCallback((e) => {
    e.preventDefault()
    startRef.current = { y: e.clientY, value }
    knobRef.current?.setPointerCapture(e.pointerId)
  }, [value])

  const rotation = -135 + value * 270
  const angle = (rotation * Math.PI) / 180
  const r = 36
  const mx = 50 + r * Math.sin(angle)
  const my = 50 - r * Math.cos(angle)

  const ledClass =
    ledState === 'locked' ? 'knob-led-locked' :
    ledState === 'active' ? 'knob-led-active' :
    'knob-led-idle'

  const ledColor =
    ledState === 'locked' ? '#00ff41' :
    ledState === 'active' ? '#ffaa00' :
    '#ff3300'

  return (
    <div className="flex flex-col items-center gap-2 select-none" style={{ userSelect: 'none' }}>
      {/* LED de invitación */}
      <div
        className={`rounded-full ${ledClass}`}
        style={{
          width: '7px',
          height: '7px',
          background: ledColor,
          color: ledColor,
          flexShrink: 0,
        }}
      />

      {/* Cuerpo del knob */}
      <div
        ref={knobRef}
        className="relative rounded-full knob-body cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ width: '62px', height: '62px', touchAction: 'none', WebkitUserSelect: 'none' }}
      >
        {/* SVG track + línea marcador */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          {/* Track aro exterior */}
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5"
            strokeDasharray="207 276" strokeDashoffset="-34" strokeLinecap="round" />
          {/* Track progreso */}
          <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="2.5" opacity="0.5"
            strokeDasharray={`${value * 207} 276`} strokeDashoffset="-34" strokeLinecap="round" />
          {/* Línea marcador */}
          <line x1="50" y1="50" x2={mx} y2={my} stroke={color} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="50" cy="50" r="6" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1.5" />
        </svg>

        {/* Interior del knob con rotación */}
        <div
          className="absolute rounded-full"
          style={{
            inset: '8px',
            background: 'radial-gradient(circle at 38% 30%, #484848, #181818 70%)',
            transform: `rotate(${rotation}deg)`,
            border: '1px solid #2a2a2a',
            pointerEvents: 'none',
          }}
        >
          {/* Línea blanca de posición (estilo BOSS) */}
          <div style={{
            position: 'absolute',
            top: '5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '3px',
            height: '35%',
            borderRadius: '2px',
            background: `linear-gradient(to bottom, ${color}, rgba(255,255,255,0.3))`,
            boxShadow: `0 0 4px ${color}`,
          }} />
        </div>
      </div>

      {/* Label estilo serigrafía */}
      <div className="text-center" style={{ marginTop: '-2px' }}>
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.2em',
          color: 'rgba(245,200,66,0.7)',
          textTransform: 'uppercase',
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: "'VT323', monospace",
          fontSize: '14px',
          color: ledState === 'locked' ? '#00ff41' : 'rgba(255,255,255,0.5)',
          textShadow: ledState === 'locked' ? '0 0 6px rgba(0,255,65,0.8)' : 'none',
          lineHeight: 1,
        }}>
          {Math.round(value * 100).toString().padStart(3, '0')}
        </div>
      </div>
    </div>
  )
}
