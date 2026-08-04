export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { total, itens, emailCliente } = req.body;
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken) {
        return res.status(500).json({ error: 'Token do Mercado Pago não configurado no servidor' });
    }

    const valorTotal = Number(total);
    if (!valorTotal || valorTotal <= 0) {
        return res.status(400).json({ error: 'Valor total inválido' });
    }

    try {
        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': Date.now().toString()
            },
            body: JSON.stringify({
                transaction_amount: Number(valorTotal.toFixed(2)),
                description: `Pedido Catálogo - ${itens ? itens.length : 1} item(ns)`,
                payment_method_id: 'pix',
                payer: {
                    email: emailCliente && emailCliente.includes('@') ? emailCliente : 'cliente@dominio.com',
                    first_name: 'Cliente',
                    last_name: 'Catalogo'
                }
            })
        });

        const data = await response.json();

        if (response.ok && data.point_of_interaction) {
            const qrCode = data.point_of_interaction.transaction_data.qr_code;
            const qrCodeBase64 = data.point_of_interaction.transaction_data.qr_code_base64;
            return res.status(200).json({ qrCode, qrCodeBase64, status: 'success' });
        } else {
            console.error("Erro MP:", data);
            return res.status(400).json({ error: data.message || 'Erro ao gerar Pix no Mercado Pago', detalhes: data });
        }
    } catch (err) {
        console.error("Erro interno:", err);
        return res.status(500).json({ error: 'Erro interno no servidor de pagamento' });
    }
}