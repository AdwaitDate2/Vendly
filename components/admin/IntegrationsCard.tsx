// Connection status only. Keys and setup live in the code/server configuration (see .env.example).
export default function IntegrationsCard({ stripe, klaviyo }) {
  const rows = [
    ['Stripe', 'Card payments at checkout', stripe.connected],
    ['Klaviyo', 'Emails and marketing', klaviyo.connected],
  ];
  return (
    <section className="admin-card admin-integrations">
      <div className="admin-card__heading"><div><h2>Integrations</h2></div></div>
      {rows.map(([name, purpose, connected]) => (
        <div key={name} className="admin-integration__head admin-integration__row">
          <h3>{name} <small>— {purpose}</small></h3>
          <span className={`admin-status admin-status--${connected ? 'published' : 'draft'}`}>{connected ? 'Connected' : 'Not connected'}</span>
        </div>
      ))}
    </section>
  );
}
