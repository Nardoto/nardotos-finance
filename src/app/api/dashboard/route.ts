import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const db = getAdminDb();
    const hoje = new Date();
    const meses = [];

    // Buscar todos os lançamentos de uma vez (muito mais rápido)
    const lancamentosSnapshot = await db.collection('lancamentos').get();
    const lancamentos = lancamentosSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        data: data.data?.toDate ? data.data.toDate() : new Date(data.data) // Converter Timestamp para Date
      };
    });

    // Agrupar lançamentos por mês (TODOS os meses com lançamentos, não apenas últimos 6)
    const lancamentosPorMes = new Map();

    lancamentos.forEach(l => {
      const dataLanc = new Date(l.data);
      const mesAno = `${dataLanc.getFullYear()}-${String(dataLanc.getMonth() + 1).padStart(2, '0')}`;
      if (!lancamentosPorMes.has(mesAno)) {
        lancamentosPorMes.set(mesAno, []);
      }
      lancamentosPorMes.get(mesAno).push(l);
    });

    // Ordenar meses e processar
    const mesesOrdenados = Array.from(lancamentosPorMes.keys()).sort();

    for (const mesAno of mesesOrdenados) {
      const [ano, mes] = mesAno.split('-').map(Number);
      const data = new Date(ano, mes - 1, 1);
      const nomeMes = data.toLocaleDateString('pt-BR', { month: 'short' });

      // Pegar lançamentos do mês do Map
      const lancamentosDoMes = lancamentosPorMes.get(mesAno) || [];

      // Calcular totais
      const totalReceitas = lancamentosDoMes
        .filter(l => l.tipo === 'RECEITA')
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      const totalDespesas = lancamentosDoMes
        .filter(l => l.tipo === 'DESPESA')
        .reduce((acc, l) => acc + (l.valor || 0), 0);

      // Calcular por categoria (despesas)
      const porCategoria: Record<string, number> = {};
      lancamentosDoMes
        .filter(l => l.tipo === 'DESPESA')
        .forEach(l => {
          const cat = l.categoria || 'OUTROS';
          porCategoria[cat] = (porCategoria[cat] || 0) + (l.valor || 0);
        });

      const categoriasOrdenadas = Object.entries(porCategoria)
        .map(([categoria, valor]) => ({ categoria, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 5); // Top 5 categorias

      meses.push({
        mes: nomeMes,
        mesAno,
        receitas: totalReceitas,
        despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
        lancamentos: lancamentosDoMes.length,
        porCategoria: categoriasOrdenadas
      });
    }

    return NextResponse.json({
      meses,
      totalGeral: {
        receitas: meses.reduce((acc, m) => acc + m.receitas, 0),
        despesas: meses.reduce((acc, m) => acc + m.despesas, 0),
        lancamentos: meses.reduce((acc, m) => acc + m.lancamentos, 0)
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 });
  }
}
