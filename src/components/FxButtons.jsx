const FX = [
  { id: 'drive', label: 'DRIVE', led: '#ff4400' },
  { id: 'fuzz',  label: 'FUZZ',  led: '#ff00cc' },
]

export default function FxButtons({ active, onToggle }) {
  return (
    <div className="flex gap-5 items-center justify-center">
      {FX.map(fx => {
        const isOn = active[fx.id]
        return (
          <div key={fx.id} className="flex flex-col items-center gap-1.5">
            {/* LED de estado */}
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isOn ? fx.led : '#222',
              border: `1px solid ${isOn ? fx.led : '#444'}`,
              boxShadow: isOn ? `0 0 8px 2px ${fx.led}` : 'none',
              transition: 'all 100ms ease',
            }} />

            {/* Botón estilo footswitch compacto */}
            <button
              className="fx-btn rounded-full outline-none flex flex-col items-center justify-center gap-0.5"
              onPointerDown={(e) => { e.preventDefault(); onToggle(fx.id) }}
              style={{
                width: '52px',
                height: '52px',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
              }}
            >
              {/* Mini ícono de efecto */}
              <div style={{
                fontSize: '14px',
                lineHeight: 1,
                filter: isOn ? `drop-shadow(0 0 4px ${fx.led})` : 'none',
              }}>
                {fx.id === 'drive' ? '⚡' : '〰'}
              </div>
              <span style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                letterSpacing: '0.15em',
                color: isOn ? fx.led : 'rgba(255,255,255,0.3)',
                textShadow: isOn ? `0 0 6px ${fx.led}` : 'none',
                transition: 'all 100ms ease',
                textTransform: 'uppercase',
              }}>
                {fx.label}
              </span>
            </button>

            {/* Estado ON/OFF */}
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '8px',
              color: isOn ? fx.led : 'rgba(255,255,255,0.2)',
              letterSpacing: '0.1em',
            }}>
              {isOn ? '■ ON' : '□ OFF'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
