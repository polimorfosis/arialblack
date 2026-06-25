import { useState } from 'react'

const BUTTONS = [
  { id: 0, label: 'DRIVE',  led: '#ff2200', burstType: 0 },
  { id: 1, label: 'FUZZ',   led: '#ff8800', burstType: 1 },
  { id: 2, label: 'GATE',   led: '#ffff00', burstType: 2 },
]

export default function MechButtons({ onBurst }) {
  const [active, setActive] = useState({})

  const handlePress = (btn) => {
    setActive(a => ({ ...a, [btn.id]: true }))
    onBurst(btn.burstType)
    setTimeout(() => setActive(a => ({ ...a, [btn.id]: false })), 180)
  }

  return (
    <div className="flex gap-3 items-center justify-center">
      {BUTTONS.map(btn => (
        <button
          key={btn.id}
          className="mech-btn rounded-full w-14 h-14 flex flex-col items-center justify-center gap-0.5 outline-none"
          onPointerDown={(e) => { e.preventDefault(); handlePress(btn) }}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {/* LED indicator */}
          <div
            className="mech-btn-led w-2 h-2 rounded-full"
            style={{
              background: active[btn.id] ? btn.led : 'rgba(255,255,255,0.15)',
              color: btn.led,
              boxShadow: active[btn.id] ? `0 0 8px ${btn.led}, 0 0 16px ${btn.led}` : 'none',
              transition: 'all 80ms ease',
            }}
          />
          <span
            className="text-[9px] tracking-widest uppercase"
            style={{
              color: active[btn.id] ? btn.led : 'rgba(255,255,255,0.3)',
              fontFamily: "'Share Tech Mono', monospace",
              transition: 'color 80ms ease',
            }}
          >
            {btn.label}
          </span>
        </button>
      ))}
    </div>
  )
}
