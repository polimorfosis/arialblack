import { useState } from 'react'

const FX = [
  { id: 'drive', label: 'DRIVE', led: '#ff4400', desc: 'OD' },
  { id: 'fuzz',  label: 'FUZZ',  led: '#ff00cc', desc: 'FZ' },
]

export default function FxButtons({ active, onToggle }) {
  return (
    <div className="flex gap-6 items-center justify-center">
      {FX.map(fx => {
        const isOn = active[fx.id]
        return (
          <button
            key={fx.id}
            className="mech-btn rounded-full w-16 h-16 flex flex-col items-center justify-center gap-1 outline-none"
            onPointerDown={(e) => { e.preventDefault(); onToggle(fx.id) }}
            style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
          >
            {/* LED */}
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: isOn ? fx.led : 'rgba(255,255,255,0.1)',
                boxShadow: isOn ? `0 0 8px ${fx.led}, 0 0 16px ${fx.led}` : 'none',
                transition: 'all 100ms ease',
              }}
            />
            <span
              className="text-[10px] tracking-widest uppercase font-bold"
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                color: isOn ? fx.led : 'rgba(255,255,255,0.35)',
                textShadow: isOn ? `0 0 6px ${fx.led}` : 'none',
                transition: 'all 100ms ease',
              }}
            >
              {fx.label}
            </span>
            <span
              className="text-[8px]"
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                color: isOn ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
              }}
            >
              {isOn ? '■ ON' : '□ OFF'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
