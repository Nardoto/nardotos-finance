import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const searchParams = request.nextUrl.searchParams;
    const mes = searchParams.get('mes'); // formato: 2025-01
    const conta = searchParams.get('conta'); // EMPRESA, THARCISIO, ESPOSA

    const lancamentosRef = db.collection('lancamentos');
    let snapshot;
    let saldoAnterior = 0;

    if (mes) {
      const [ano, mesNum] = mes.split('-').map(Number);
      const inicio = new Date(ano, mesNum - 1, 1);
      const fim = new Date(ano, mesNum, 0, 23, 59, 59);

      // Buscar lançamentos do mês atual
      let q = lancamentosRef
        .where('data', '>=', Timestamp.fromDate(inicio))
        .where('data', '<=', Timestamp.fromDate(fim));

      if (conta) {
        q = q.where('conta', '==', conta);
      }

      snapshot = await q.get();

      // Calcular saldo anterior (todos os lançamentos ANTES do mês atual)
      let qAnterior = lancamentosRef
        .where('data', '<', Timestamp.fromDate(inicio));

      if (conta) {
        qAnterior = qAnterior.where('conta', '==', conta);
      }

      const snapshotAnterior = await qAnterior.get();

      snapshotAnterior.docs.forEach(doc => {
        const data = doc.data();
        const valor = data.valor || 0;
        if (data.status === 'OK') {
          if (data.tipo === 'RECEITA') {
            saldoAnterior += valor;
          } else {
            saldoAnterior -= valor;
          }
        }
      });
    } else {
      // Sem filtro de mês - retorna TODOS os lançamentos
      if (conta) {
        snapshot = await lancamentosRef.where('conta', '==', conta).get();
      } else {
        snapshot = await lancamentosRef.get();
      }
    }

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

      if (data.tipo === 'DESPESA' && data.status === 'OK') {
        porCategoria[data.categoria] = (porCategoria[data.categoria] || 0) + valor;
      }
    });

    const categoriasOrdenadas = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([categoria, valor]) => ({ categoria, valor }));

    const receitasOrdenadas = Object.entries(receitasPorCategoria)
      .sort((a, b) => b[1] - a[1])
      .map(([categoria, valor]) => ({ categoria, valor }));

    return NextResponse.json({
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      saldoAnterior,
      saldoFinal: saldoAnterior + (totalReceitas - totalDespesas),
      totalPendente,
      totalLancamentos: snapshot.size,
      porCategoria: categoriasOrdenadas,
      receitasPorCategoria: receitasOrdenadas
    });
  } catch (error) {
    console.error('Erro ao buscar resumo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar resumo', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
