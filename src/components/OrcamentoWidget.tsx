'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Orcamento {
  id?: string;
  usuario: string;
  mes: string;
  orcamentoGlobal?: number;
  categorias: Record<string, number>;
}

interface CategoriaResumo {
  categoria: string;
  total: number;
  percentual: number;
}

export default function OrcamentoWidget() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [categoriasResumo, setCategoriasResumo] = useState<CategoriaResumo[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const router = useRouter();

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (usuarioSalvo) {
      setUsuario(usuarioSalvo);
      carregarDados(usuarioSalvo);
    }
  }, [mesSelecionado]);

  const carregarDados = async (user: string) => {
    try {
      // Carregar orçamento
      const resOrcamento = await fetch(`/api/orcamento?usuario=${user}&mes=${mesSelecionado}`);
      const dataOrcamento = await resOrcamento.json();
      setOrcamento(dataOrcamento.orcamento || null);

      // Carregar categorias resumo
      const resCategorias = await fetch(`/api/categorias-resumo?mes=${mesSelecionado}`);
      const dataCategorias = await resCategorias.json();
      setCategoriasResumo(dataCategorias.categorias || []);
    } catch (error) {
      console.error('Erro ao carregar dados de orçamento:', error);
    }
  };

  const formatarValor = (valor: number) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Alertas de Orçamento
  const alertas = orcamento && Object.keys(orcamento.categorias).length > 0
    ? categoriasResumo
        .filter(c => orcamento.categorias[c.categoria])
        .map(c => ({
          categoria: c.categoria,
          percentual: (c.total / orcamento.categorias[c.categoria]) * 100,
          gasto: c.total,
          limite: orcamento.categorias[c.categoria]
        }))
        .filter(a => a.percentual >= 80)
        .sort((a, b) => b.percentual - a.percentual)
    : [];

  if (!orcamento || Object.keys(orcamento.categorias).length === 0) {
    // Mostrar banner para configurar orçamento
    return (
      <div className="border border-orange-500/30 bg-gradient-to-br from-orange-900/10 to-yellow-900/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-orange-400 mb-1">💰 Configure seu Orçamento</h3>
            <p className="text-xs text-gray-400">Defina metas de gastos para controlar melhor suas finanças</p>
          </div>
          <button
            onClick={() => router.push('/orcamento')}
            className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            Configurar
          </button>
        </div>
      </div>
    );
  }

  if (alertas.length === 0) {
    // Orçamento configurado, tudo ok
    return (
      <div className="border border-green-500/30 bg-gradient-to-br from-green-900/10 to-blue-900/10 rounded-xl p-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div>
              <p className="text-sm font-medium text-green-400">Orçamento sob controle</p>
              <p className="text-xs text-gray-500">Nenhuma categoria acima de 80%</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/orcamento')}
            className="text-xs text-gray-500 hover:text-orange-400 transition"
          >
            Ver detalhes →
          </button>
        </div>
      </div>
    );
  }

  // Tem alertas
  return (
    <div className="border border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-yellow-400 flex items-center gap-2">
          <span>⚠️</span> Alertas de Orçamento
        </h3>
        <button
          onClick={() => router.push('/orcamento')}
          className="text-xs text-orange-400 hover:text-orange-300 transition"
        >
          Gerenciar →
        </button>
      </div>
      <div className="space-y-2">
        {alertas.slice(0, 3).map(alerta => {
          const corTexto = alerta.percentual >= 100 ? 'text-red-400' : 'text-yellow-400';
          const icone = alerta.percentual >= 100 ? '🔴' : '🟡';
          return (
            <div key={alerta.categoria} className="text-sm">
              <span className={corTexto}>{icone} {alerta.categoria}:</span>{' '}
              <span className="text-white font-medium">{alerta.percentual.toFixed(0)}%</span>{' '}
              <span className="text-gray-400 text-xs">
                ({formatarValor(alerta.gasto)} / {formatarValor(alerta.limite)})
              </span>
            </div>
          );
        })}
        {alertas.length > 3 && (
          <p className="text-xs text-gray-500 mt-2">+{alertas.length - 3} categoria(s) em alerta</p>
        )}
      </div>
    </div>
  );
}
