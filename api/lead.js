// Recibe el formulario de la landing y crea/actualiza el contacto en GoHighLevel (API v2, sin costo extra).
// Variables de entorno en Vercel:
//   GHL_TOKEN        -> token de la Integración Privada de GHL
//   GHL_LOCATION_ID  -> ID de la subcuenta (Location ID)
//   GHL_WEBHOOK_URL  -> (opcional) webhook entrante, si algún día lo activás
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  if (b.empresa) return res.status(200).json({ ok: true }); // trampa anti-bots
  const name = String(b.name || '').trim().slice(0, 80);
  const phone = '+' + String(b.phone || '').replace(/\D/g, '').slice(0, 15);
  if (!name || phone.length < 9) return res.status(400).json({ ok: false, error: 'datos inválidos' });
  const [firstName, ...rest] = name.split(/\s+/);
  const lastName = rest.join(' ');
  const source = 'Landing sebastrade.com (' + (b.utm_source || 'tiktok') + ')';
  try {
    const { GHL_TOKEN, GHL_LOCATION_ID, GHL_WEBHOOK_URL } = process.env;
    if (GHL_TOKEN && GHL_LOCATION_ID) {
      const r = await fetch('https://services.leadconnectorhq.com/contacts/upsert', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + GHL_TOKEN, Version: '2021-07-28', 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ locationId: GHL_LOCATION_ID, firstName, lastName, name, phone, source, tags: ['landing-tiktok'] })
      });
      if (!r.ok) console.error('GHL', r.status, await r.text());
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }
    if (GHL_WEBHOOK_URL) {
      const r = await fetch(GHL_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, full_name: name, phone, source, tags: ['landing-tiktok'] }) });
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }
    console.error('Faltan variables GHL_TOKEN / GHL_LOCATION_ID');
    return res.status(500).json({ ok: false });
  } catch (e) {
    console.error(e); return res.status(502).json({ ok: false });
  }
}
