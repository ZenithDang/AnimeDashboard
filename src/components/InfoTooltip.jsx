const tooltipStyle = {
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#1e1f35',
  border: '0.5px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  padding: '5px 8px',
  fontSize: '11px',
  lineHeight: '1.4',
  color: '#e2e8f0',
  whiteSpace: 'normal',
  width: '200px',
  pointerEvents: 'none',
  zIndex: 50,
  boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
};

const arrowStyle = {
  position: 'absolute',
  top: '100%',
  left: '50%',
  transform: 'translateX(-50%)',
  border: '4px solid transparent',
  borderTopColor: 'rgba(255,255,255,0.12)',
  width: 0,
  height: 0,
};

export default function InfoTooltip({ text }) {
  const id = 'tooltip-' + text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);

  return (
    <span
      style={{ position: 'relative', display: 'inline-block', verticalAlign: 'middle' }}
      className="group"
    >
      <span
        aria-describedby={id}
        tabIndex={0}
        style={{
          fontSize: '10px',
          color: 'var(--text-muted)',
          cursor: 'default',
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        ⓘ
      </span>

      {/* Tooltip card — shown on group hover via Tailwind */}
      <span
        id={id}
        role="tooltip"
        className="hidden group-hover:block group-focus-within:block"
        style={tooltipStyle}
      >
        {text}
        <span style={arrowStyle} />
      </span>
    </span>
  );
}
