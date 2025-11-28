import { GoogleGenerativeAI } from '@google/generative-ai';
import { LancamentoProcessado } from './types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

const CATEGORIAS_CONHECIDAS = {
  DESPESAS_FIXAS: [
    'ALUGUEL', 'AGUA', 'ENERGIA', 'GASOLINA', 'LICENCAS', 'PLANO DE SAUDE',
    'EDUCACAO', 'INTERNET', 'CELULAR', 'SEGURO', 'PSICOLOGO', 'ELZA',
    'RESERVA DE EMERGENCIA', 'ACADEMIA', 'CONTABILIDADE', 'INSS', 'IMPOSTO',
    'DIZIMO', 'FIES'
  ],
  DESPESAS_VARIAVEIS: [
    'ALIMENTACAO', 'FARMACIA', 'TRANSPORTE', 'CARTAO', 'NATURA', 'DENTISTA',
    'PEDIATRA', 'LAZER', 'CUIDADOS PESSOAIS', 'PRESENTES', 'PSIQUIATRA',
    'MERCADO', 'RESTAURANTE', 'DELIVERY', 'UBER', 'TAXI'
  ],
  RECEITAS: [
    'SALARIO', 'SERENG', 'PARTICULAR', 'KIWIFI', 'CHANNELS', 'CLINICA',
    'FREELANCE', 'BONUS', 'REEMBOLSO'
  ]
};

export async function processarTexto(texto: string, categoriasExistentes: string[]): Promise<LancamentoProcessado[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Você é um assistente financeiro. Analise o texto abaixo e extraia os lançamentos financeiros.

TEXTO DO USUÁRIO:
"${texto}"

CATEGORIAS EXISTENTES NO SISTEMA:
${[...CATEGORIAS_CONHECIDAS.DESPESAS_FIXAS, ...CATEGORIAS_CONHECIDAS.DESPESAS_VARIAVEIS, ...CATEGORIAS_CONHECIDAS.RECEITAS, ...categoriasExistentes].join(', ')}

REGRAS:
1. Se mencionar "gastei", "paguei", "comprei", "débito" → tipo = "DESPESA"
2. Se mencionar "recebi", "ganhei", "crédito", "salário" → tipo = "RECEITA"
3. Use uma categoria existente se possível, ou crie uma nova se necessário
4. O valor deve ser um número (ex: 45.90)
5. Se não houver data específica, use a data de hoje: ${new Date().toISOString().split('T')[0]}
6. Status padrão é "OK" (já pago/recebido), use "PENDENTE" se o usuário indicar que ainda vai pagar

Responda APENAS com um JSON válido no formato:
{
  "lancamentos": [
    {
      "tipo": "DESPESA" ou "RECEITA",
      "valor": 45.90,
      "categoria": "ALIMENTACAO",
      "descricao": "Almoço no restaurante",
      "data": "2025-01-15",
      "status": "OK"
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extrair JSON da resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Não foi possível extrair JSON da resposta');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return parsed.lancamentos.map((l: { tipo: string; valor: number; categoria: string; descricao: string; data: string; status: string }) => ({
      tipo: l.tipo as 'RECEITA' | 'DESPESA',
      valor: Number(l.valor),
      categoria: l.categoria.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      descricao: l.descricao,
      data: new Date(l.data),
      status: (l.status || 'OK') as 'OK' | 'PENDENTE'
    }));
  } catch (error) {
    console.error('Erro ao processar com Gemini:', error);
    throw error;
  }
}

export async function processarImagem(imagemBase64: string, categoriasExistentes: string[]): Promise<LancamentoProcessado[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `Você é um assistente financeiro. Analise esta imagem de extrato bancário e extraia TODOS os lançamentos visíveis.

CATEGORIAS EXISTENTES NO SISTEMA:
${[...CATEGORIAS_CONHECIDAS.DESPESAS_FIXAS, ...CATEGORIAS_CONHECIDAS.DESPESAS_VARIAVEIS, ...CATEGORIAS_CONHECIDAS.RECEITAS, ...categoriasExistentes].join(', ')}

REGRAS:
1. PIX enviado, débito, pagamento → tipo = "DESPESA"
2. PIX recebido, crédito, depósito → tipo = "RECEITA"
3. Tente identificar a categoria baseada na descrição
4. Extraia a data exata se visível
5. Status padrão é "OK"

Responda APENAS com um JSON válido no formato:
{
  "lancamentos": [
    {
      "tipo": "DESPESA" ou "RECEITA",
      "valor": 45.90,
      "categoria": "ALIMENTACAO",
      "descricao": "PIX para Restaurante XYZ",
      "data": "2025-01-15",
      "status": "OK"
    }
  ]
}`;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imagemBase64.replace(/^data:image\/\w+;base64,/, '')
        }
      }
    ]);

    const response = result.response.text();

    // Extrair JSON da resposta
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Não foi possível extrair JSON da resposta');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return parsed.lancamentos.map((l: { tipo: string; valor: number; categoria: string; descricao: string; data: string; status: string }) => ({
      tipo: l.tipo as 'RECEITA' | 'DESPESA',
      valor: Number(l.valor),
      categoria: l.categoria.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
      descricao: l.descricao,
      data: new Date(l.data),
      status: (l.status || 'OK') as 'OK' | 'PENDENTE'
    }));
  } catch (error) {
    console.error('Erro ao processar imagem com Gemini:', error);
    throw error;
  }
}
