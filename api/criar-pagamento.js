export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const accessToken = process.env.MP_TOKEN;

    if (!accessToken) {
        return res.status(500).json({ error: 'Token do Mercado Pago não configurado no servidor' });
    }

    const { itens } = req.body;

    if (!itens || itens.length === 0) {
        return res.status(400).json({ error: 'Sacola vazia' });
    }

    // Monta a lista de itens no formato que o Mercado Pago espera
    const items = itens.map(item => ({
        title: `${item.nome} (${item.marca}) - Tam: ${item.tamanho}`,
        quantity: 1,
        unit_price: Number(item.preco),
        currency_id: 'BRL'
    }));

    // Pega a URL do site automaticamente (funciona em qualquer domínio Vercel)
    const origem = req.headers.origin || `https://${req.headers.host}`;

    try {
        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: items,
                back_urls: {
                    success: `${origem}/?status=aprovado`,
                    failure: `${origem}/?status=falhou`,
                    pending: `${origem}/?status=pendente`
                },
                auto_return: 'approved'
            })
        });

        const data = await response.json();

        if (response.ok && (data.init_point || data.sandbox_init_point)) {
            // Se for token de teste, o Mercado Pago retorna sandbox_init_point
            const linkPagamento = data.sandbox_init_point || data.init_point;
            return res.status(200).json({ linkPagamento });
        } else {
            console.error('Erro ao criar preferência:', data);
            return res.status(400).json({ error: data.message || 'Erro ao criar pagamento', detalhes: data });
        }
    } catch (err) {
        console.error('Erro interno:', err);
        return res.status(500).json({ error: 'Erro interno no servidor de pagamento' });
    }
}