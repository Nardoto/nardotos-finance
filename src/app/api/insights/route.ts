import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface Insight {
  tipo: 'alerta' | 'positivo' | 'neutro';
  icone: string;
  mensagem: string;
}

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const searchParams = request.nextUrl.searchParams;
    const mes = searchParams.get('mes'); // formato: 2025-12
    const conta = searchParams.get('conta'); // EMPRESA, THARCISIO, ESPOSA

    if (!mes) {
      return NextResponse.json({ error: 'Mês não informado' }, { status: 400 });
    }

    const [ano, mesNum] = mes.split('-').map(Number);
    const inicioAtual = new Date(ano, mesNum - 1, 1);
    const fimAtual = new Date(ano, mesNum, 0, 23, 59, 59);

    // Mês anterior
    const inicioAnterior = new Date(ano, mesNum - 2, 1);
    const fimAnterior = new Date(ano, mesNum - 1, 0, 23, 59, 59);

    const lancamentosRef = db.collection('lancamentos');

    // Buscar dados do mês atual
    let qAtual = lancamentosRef
      .where('data', '>=', Timestamp.fromDate(inicioAtual))
      .where('data', '<=', Timestamp.fromDate(fimAtual));

    if (conta) {
      qAtual = qAtual.where('conta', '==', conta);
    }

    const snapshotAtual = await qAtual.get();

    // Buscar dados do mês anterior
    let qAnterior = lancamentosRef
      .where('data', '>=', Timestamp.fromDate(inicioAnterior))
      .where('data', '<=', Timestamp.fromDate(fimAnterior));

    if (conta) {
      qAnterior = qAnterior.where('conta', '==', conta);
    }

    const snapshotAnterior = await qAnterior.get();

    // Processar dados do mês atual
    let receitasAtual = 0;
    let despesasAtual = 0;
    const categoriaAtual: Record<string, number> = {};

    snapshotAtual.docs.forEach(doc => {
      const data = doc.data();
      const valor = data.valor || 0;
      if (data.status === 'OK') {
        if (data.tipo === 'RECEITA') {
          receitasAtual += valor;
        } else {
          despesasAtual += valor;
          categoriaAtual[data.categoria] = (categoriaAtual[data.categoria] || 0) + valor;
        }
      }
    });

    // Processar dados do mês anterior
    let receitasAnterior = 0;
    let despesasAnterior = 0;
    const categoriaAnterior: Record<string, number> = {};

    snapshotAnterior.docs.forEach(doc => {
      const data = doc.data();
      const valor = data.valor || 0;
      if (data.status === 'OK') {
        if (data.tipo === 'RECEITA') {
          receitasAnterior += valor;
        } else {
          despesasAnterior += valor;
          categoriaAnterior[data.categoria] = (categoriaAnterior[data.categoria] || 0) + valor;
        }
      }
    });

    // Gerar insights
    const insights: Insight[] = [];

    // 1. Comparação geral de despesas
    if (despesasAnterior > 0) {
      const variacao = ((despesasAtual - despesasAnterior) / despesasAnterior) * 100;

      if (variacao > 20) {
        insights.push({
          tipo: 'alerta',
          icone: '⚠️',
          mensagem: `Você gastou ${variacao.toFixed(0)}% a mais que o mês passado (${(despesasAtual - despesasAnterior).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de aumento)`
        });
      } else if (variacao < -20) {
        insights.push({
          tipo: 'positivo',
          icone: '🎉',
          mensagem: `Parabéns! Você economizou ${Math.abs(variacao).toFixed(0)}% em relação ao mês passado (${Math.abs(despesasAtual - despesasAnterior).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} a menos)`
        });
      } else if (Math.abs(variacao) <= 5) {
        insights.push({
          tipo: 'neutro',
          icone: '📊',
          mensagem: `Seus gastos estão estáveis, variação de apenas ${Math.abs(variacao).toFixed(1)}% em relação ao mês anterior`
        });
      }
    }

    // 2. Análise por categoria (maior variação)
    const variacoesCategorias: Array<{ categoria: string; variacao: number; valor: number }> = [];

    Object.keys(categoriaAtual).forEach(cat => {
      const valorAtual = categoriaAtual[cat] || 0;
      const valorAnterior = categoriaAnterior[cat] || 0;

      if (valorAnterior > 0) {
        const variacao = ((valorAtual - valorAnterior) / valorAnterior) * 100;
        variacoesCategorias.push({ categoria: cat, variacao, valor: valorAtual - valorAnterior });
      } else if (valorAtual > 0) {
        variacoesCategorias.push({ categoria: cat, variacao: 100, valor: valorAtual });
      }
    });

    // Ordenar por variação absoluta
    variacoesCategorias.sort((a, b) => Math.abs(b.variacao) - Math.abs(a.variacao));

    // Maior aumento em categoria
    if (variacoesCategorias.length > 0 && variacoesCategorias[0].variacao > 30) {
      const maior = variacoesCategorias[0];
      insights.push({
        tipo: 'alerta',
        icone: '📈',
        mensagem: `Categoria ${maior.categoria}: aumento de ${maior.variacao.toFixed(0)}% (${maior.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
      });
    }

    // Maior redução em categoria
    const reducoes = variacoesCategorias.filter(v => v.variacao < -30);
    if (reducoes.length > 0) {
      const maiorReducao = reducoes[0];
      insights.push({
        tipo: 'positivo',
        icone: '💰',
        mensagem: `Economia em ${maiorReducao.categoria}: redução de ${Math.abs(maiorReducao.variacao).toFixed(0)}% (${Math.abs(maiorReducao.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} economizados)`
      });
    }

    // 3. Comparação de receitas
    if (receitasAnterior > 0) {
      const variacaoReceitas = ((receitasAtual - receitasAnterior) / receitasAnterior) * 100;

      if (variacaoReceitas > 20) {
        insights.push({
          tipo: 'positivo',
          icone: '💵',
          mensagem: `Suas receitas aumentaram ${variacaoReceitas.toFixed(0)}% este mês (+${(receitasAtual - receitasAnterior).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
        });
      } else if (variacaoReceitas < -20) {
        insights.push({
          tipo: 'alerta',
          icone: '📉',
          mensagem: `Suas receitas diminuíram ${Math.abs(variacaoReceitas).toFixed(0)}% este mês (-${Math.abs(receitasAtual - receitasAnterior).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
        });
      }
    }

    // 4. Projeção de gastos (baseado em dias decorridos)
    const hoje = new Date();
    const diasNoMes = new Date(ano, mesNum, 0).getDate();
    const diaAtual = hoje.getMonth() === mesNum - 1 && hoje.getFullYear() === ano ? hoje.getDate() : diasNoMes;

    if (diaAtual < diasNoMes && diaAtual > 0) {
      const mediaDiaria = despesasAtual / diaAtual;
      const projecao = mediaDiaria * diasNoMes;
      const diferenca = projecao - despesasAtual;

      if (diferenca > 0) {
        insights.push({
          tipo: 'neutro',
          icone: '🔮',
          mensagem: `Projeção: você deve gastar cerca de ${projecao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} até o fim do mês (faltam ~${diferenca.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`
        });
      }
    }

    // 5. Saldo comparativo
    const saldoAtual = receitasAtual - despesasAtual;
    const saldoAnterior = receitasAnterior - despesasAnterior;

    if (saldoAnterior !== 0) {
      const diferencaSaldo = saldoAtual - saldoAnterior;

      if (diferencaSaldo > 0 && Math.abs(diferencaSaldo) > 100) {
        insights.push({
          tipo: 'positivo',
          icone: '✨',
          mensagem: `Seu saldo melhorou ${diferencaSaldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em relação ao mês passado`
        });
      } else if (diferencaSaldo < 0 && Math.abs(diferencaSaldo) > 100) {
        insights.push({
          tipo: 'alerta',
          icone: '⚡',
          mensagem: `Seu saldo piorou ${Math.abs(diferencaSaldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em relação ao mês passado`
        });
      }
    }

    // Se não houver insights, mostrar mensagem padrão
    if (insights.length === 0) {
      insights.push({
        tipo: 'neutro',
        icone: '📋',
        mensagem: 'Continue registrando seus lançamentos para gerar insights personalizados'
      });
    }

    return NextResponse.json({
      insights,
      comparacao: {
        despesasAtual,
        despesasAnterior,
        receitasAtual,
        receitasAnterior,
        variacaoDespesas: despesasAnterior > 0 ? ((despesasAtual - despesasAnterior) / despesasAnterior) * 100 : 0,
        variacaoReceitas: receitasAnterior > 0 ? ((receitasAtual - receitasAnterior) / receitasAnterior) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Erro ao gerar insights:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar insights', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
