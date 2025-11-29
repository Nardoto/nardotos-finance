import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const hoje = new Date();
    const meses = [];

    // Buscar todos os lançamentos de uma vez (muito mais rápido)
    const lancamentosSnapshot = await db.collection('lancamentos').get();
    const lancamentos = lancamentosSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }));

    // Processar dados dos últimos 6 meses localmente (sem mais requisições)
    for (let i = 5; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const nomeMes = data.toLocaleDateString('pt-BR', { month: 'short' });

      // Filtrar lançamentos do mês
      const lancamentosDoMes = lancamentos.filter(l => {
        const dataLanc = new Date(l.data);
        const mesLanc = `${dataLanc.getFullYear()}-${String(dataLanc.getMonth() + 1).padStart(2, '0')}`;
        return mesLanc === mesAno;
      });

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
