export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // DEBUG: mostra só o início do token, pra confirmar qual está sendo usado
    return res.status(200).json({
        debug: true,
        tokenInicio: accessToken ? accessToken.substring(0, 25) : 'TOKEN NÃO ENCONTRADO',
        tokenExiste: !!accessToken
    });
}