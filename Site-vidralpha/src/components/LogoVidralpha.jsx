/**
 * LogoVidralpha — Logo SVG vetorizado com label centralizado
 *
 * Props:
 *   height      — Altura do logo em px (padrão: 42)
 *   label       — Texto abaixo do logo (padrão: "Esquadrias em alumínio")
 *   labelColor  — Cor do texto (padrão: '#000')
 *   showLabel   — Mostrar o label abaixo (padrão: true)
 *   className   — Classe adicional no wrapper
 *   style       — Estilo inline adicional no wrapper
 */

// Proporção original do SVG: viewBox="0 0 188.73 55.55"
const SVG_ASPECT = 188.73 / 55.55 // Logo horizontal

export default function LogoVidralpha({
  height = 42,
  label = 'ESQUADRIAS E VIDROS',
  topLabel = '',
  labelColor = '#000',
  showLabel = true,
  labelSize = '9px',
  labelOffset = '2px',
  className = '',
  style = {},
  variant = 'light'
}) {
  const width = Math.round(height * SVG_ASPECT) // largura exata do SVG renderizado

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: `${width}px`,
        ...style,
      }}
    >
      {topLabel && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: (parseFloat(labelSize) * 0.9) + 'px',
            fontWeight: 800,
            color: labelColor,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '-4px',
            display: 'block',
            textAlign: 'center',
            width: '200%', // permite que transborde um pouco se for largo
          }}
        >
          {topLabel}
        </span>
      )}
      <img
        src={`/logo-vilaca-${variant}.svg`}
        alt="Vilaça Esquadrias e Vidros"
        width={width}
        height={height}
        style={{ display: 'block', width: `${width}px`, height: `${height}px` }}
      />
      {showLabel && (
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: labelSize,
            fontWeight: 900,
            color: labelColor,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginTop: '-3px',
            display: 'block',
            textAlign: 'center',
            width: `${width}px`,
            paddingLeft: labelOffset,
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
