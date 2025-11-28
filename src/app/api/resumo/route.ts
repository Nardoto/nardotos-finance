import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mes = searchParams.get('mes'); // formato: 2025-01

    const lancamentosRef = collection(db, 'lancamentos');
    let lancamentosQuery;

    if (mes) {
      const [ano, mesNum] = mes.split('-').map(Number);
      const inicio = new Date(ano, mesNum - 1, 1);
      const fim = new Date(ano, mesNum, 0, 23, 59, 59);

      lancamentosQuery = query(
        lancamentosRef,
        where('data', '>=', Timestamp.fromDate(inicio)),
        where('data', '<=', Timestamp.fromDate(fim))
      );
    } else {
      // Mês atual
      const agora = new Date();
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

      lancamentosQuery = query(
        lancamentosRef,
        where('data', '>=', Timestamp.fromDate(inicio)),
        where('data', '<=', Timestamp.fromDate(fim))
      );
    }

    const snapshot = await getDocs(lancamentosQuery);

    let totalReceitas = 0;
    let totalDespesas = 0;
    let totalPendente = 0;
    const porCategoria: Record<string, number> = {};
    const receitasPorCategoria: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const valor = data.valor || 0;

      if (data.tipo === 'RECEITA') {
        if (data.status === 'OK') {
          totalReceitas += valor;
          // Agrupar receitas por categoria
          receitasPorCategoria[data.categoria] = (receitasPorCategoria[data.categoria] || 0) + valor;
        } else {
          totalPendente += valor;
        }
      } else {
        if (data.status === 'OK') {
          totalDespesas += valor;
        } else {
          totalPendente -= valor;
        }
      }

      // Agrupar por categoria (apenas despesas OK)
      if (data.tipo === 'DESPESA' && data.status === 'OK') {
        porCategoria[data.categoria] = (porCategoria[data.categoria] || 0) + valor;
      }
    });

    // Ordenar categorias de despesas por valor
    const categoriasOrdenadas = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([categoria, valor]) => ({ categoria, valor }));

    // Ordenar categorias de receitas por valor
    const receitasOrdenadas = Object.entries(receitasPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, valor]) => ({ categoria, valor }));

    return NextResponse.json({
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      totalPendente,
      totalLancamentos: snapshot.size,
      porCategoria: categoriasOrdenadas,
      receitasPorCategoria: receitasOrdenadas
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar resumo' },
      { status: 500 }
    );
  }
}
