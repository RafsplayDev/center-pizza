export default function ClientHome() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        padding: 'var(--sp-6)',
      }}
    >
      <div>
        <span className="eyebrow">Cliente</span>
        <h1 style={{ marginTop: 'var(--sp-2)' }}>CENTER PIZZA</h1>
        <p style={{ color: 'var(--fg-2)', margin: '0 auto' }}>
          Em construção
        </p>
      </div>
    </div>
  )
}
