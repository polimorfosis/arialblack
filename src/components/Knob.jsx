import { useRef, useCallback } from 'react'

export default function Knob({ value, onChange, label, color = '#ff4400' }) {
  const startRef = useRef(null)
  const knobRef = useRef(null)

  const clamp = (v) => Math.max(0, Math.min(1, v))

  const onPointerMove = useCallback((e) => {
    if (!startRef.current) return
    const delta = (startRef.current.y - e.clientY) / 140
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
  const r = 38
  const cx = 50
  const cy = 50
  const mx = cx + r * Math.sin(angle)
  const my = cy - r * Math.cos(angle)

  return (
    <div className="flex flex-col items-center gap-1 select-none" style={{ userSelect: 'none' }}>
      <div
        ref={knobRef}
        className="relative w-16 h-16 rounded-full knob-body cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: 'none', WebkitUserSelect: 'none' }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
          <line x1="50" y1="50" x2={mx} y2={my} stroke={color} strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="50" r="5" fill="#222" stroke="#333" strokeWidth="1.5" />
        </svg>
        <div
          className="absolute inset-2 rounded-full"
          style={{
            background: 'radial-gradient(circle at 35% 30%, #555, #1a1a1a 70%)',
            transform: `rotate(${rotation}deg)`,
            border: '1px solid #3a3a3a',
            pointerEvents: 'none',
          }}
        >
          <div
            className="knob-marker absolute w-1.5 h-4 rounded-full"
            style={{ background: color, top: '6%', left: '50%', transform: 'translateX(-50%)' }}
          />
        </div>
      </div>

      <div className="text-center">
        <div className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(0,255,65,0.55)', fontFamily: "'Share Tech Mono', monospace" }}>
          {label}
        </div>
        <div className="text-[13px] lcd-text" style={{ fontFamily: "'VT323', monospace" }}>
          {Math.round(value * 100).toString().padStart(3, '0')}
        </div>
      </div>
    </div>
  )
}
