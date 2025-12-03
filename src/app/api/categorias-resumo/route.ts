import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

interface CategoriaResumo {
  categoria: string;
  total: number;
  quantidade: number;
  percentual: number;
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const searchParams = request.nextUrl.searchParams;
    const mes = searchParams.get('mes'); // formato: 2025-12

    const lancamentosRef = db.collection('lancamentos');
    let snapshot;

    if (mes) {
      const [ano, mesNum] = mes.split('-').map(Number);
      const inicio = new Date(ano, mesNum - 1, 1);
      const fim = new Date(ano, mesNum, 0, 23, 59, 59);

      snapshot = await lancamentosRef
        .where('data', '>=', inicio)
        .where('data', '<=', fim)
        .get();
    } else {
      // Pegar tudo se não especificar mês
      snapshot = await lancamentosRef.get();
    }

    // Agrupar por categoria
    const categorias = new Map<string, { total: number; quantidade: number; lancamentos: any[] }>();

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const categoria = data.categoria || 'OUTROS';
      const valor = data.valor || 0;

      if (!categorias.has(categoria)) {
        categorias.set(categoria, { total: 0, quantidade: 0, lancamentos: [] });
      }

      const cat = categorias.get(categoria)!;
      cat.total += valor;
      cat.quantidade += 1;
      cat.lancamentos.push({
        id: doc.id,
        ...data,
        data: data.data?.toDate?.() || data.data
      });
    });

    // Calcular total geral para percentuais
    let totalGeral = 0;
    categorias.forEach(cat => {
      totalGeral += cat.total;
    });

    // Montar resposta
    const resumoPorCategoria: CategoriaResumo[] = Array.from(categorias.entries())
      .map(([categoria, dados]) => ({
        categoria,
        total: dados.total,
        quantidade: dados.quantidade,
        percentual: totalGeral > 0 ? (dados.total / totalGeral) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total); // Ordenar por valor decrescente

    // Top 5 maiores lançamentos individuais
    const todosLancamentos: any[] = [];
    categorias.forEach(cat => {
      todosLancamentos.push(...cat.lancamentos);
    });

    const top5Lancamentos = todosLancamentos
      .filter(l => l.tipo === 'DESPESA')
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);

    return NextResponse.json({
      categorias: resumoPorCategoria,
      top5Lancamentos,
      totalGeral
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
