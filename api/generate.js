export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 
  const { type, seller, buyer, service, price, details } = req.body;
 
  if (!type || !seller) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }
 
  const typeLabels = {
    contrato_servicios: 'contrato de prestación de servicios freelance',
    propuesta_proyecto: 'propuesta comercial de proyecto',
    nda: 'acuerdo de confidencialidad (NDA)',
    factura_proforma: 'factura proforma o presupuesto detallado',
    mantenimiento: 'contrato de mantenimiento y soporte mensual',
    aviso_legal: 'aviso legal y términos de servicio para web'
  };
 
  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
 
  const prompt = `Genera un ${typeLabels[type] || type} profesional y completo.
 
Datos:
- Proveedor: ${seller}
- Cliente: ${buyer || 'El Cliente'}
- Servicio: ${service || 'servicios profesionales'}
- Precio: €${price || 'acordado entre las partes'}
- Detalles: ${details || 'Condiciones estándar'}
- Fecha: ${today}
- Jurisdicción: España (legislación española, RGPD donde aplique)
 
Instrucciones:
- Documento completo y profesional, listo para firmar
- Incluye todas las cláusulas relevantes para el tipo de documento
- Derecho español aplicable (BGB español, Ley de Contratos del Sector Público si aplica)
- Sin placeholders genéricos — usa datos reales proporcionados
- Formato limpio con secciones numeradas
- Máximo 600 palabras
 
Solo el documento, sin introducción ni comentarios.`;
 
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });
 
    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'Error al generar documento' });
    }
 
    const data = await response.json();
    const text = data.content?.map(i => i.text || '').join('\n') || '';
 
    return res.status(200).json({ text });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
