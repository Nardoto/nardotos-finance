'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Meta {
  id?: string;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string;
  limite: number;
  mes: string;
}

interface ProgressoMeta {
  categoria: string;
  tipo: 'RECEITA' | 'DESPESA';
  total: number;
  limite: number;
  percentual: number;
}

export default function Metas() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [progressoDespesas, setProgressoDespesas] = useState<ProgressoMeta[]>([]);
  const [progressoReceitas, setProgressoReceitas] = useState<ProgressoMeta[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [novoTipo, setNovoTipo] = useState<'RECEITA' | 'DESPESA'>('DESPESA');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoLimite, setNovoLimite] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [mesAtual] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const router = useRouter();

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (!usuarioSalvo) {
      router.push('/login');
    } else {
      setUsuario(usuarioSalvo);
      carregarDados();
    }
  }, [router]);

  const carregarDados = async () => {
    try {
      const [resMetas, resResumo, resCategorias] = await Promise.all([
        fetch('/api/metas'),
        fetch(`/api/resumo?mes=${mesAtual}`),
        fetch('/api/categorias')
      ]);
      const dataMetas = await resMetas.json();
      const dataResumo = await resResumo.json();
      const dataCategorias = await resCategorias.json();

      const todasMetas = dataMetas.metas || [];
      setMetas(todasMetas);
      setCategorias(dataCategorias.categorias || []);

      // Calcular progresso de despesas
      const metasDespesas = todasMetas.filter((m: Meta) => m.tipo !== 'RECEITA');
      const despesasProgresso = (dataResumo.porCategoria || []).map((g: { categoria: string; valor: number }) => {
        const meta = metasDespesas.find((m: Meta) => m.categoria === g.categoria);
        return {
          categoria: g.categoria,
          tipo: 'DESPESA' as const,
          total: g.valor,
          limite: meta?.limite || 0,
          percentual: meta?.limite ? (g.valor / meta.limite) * 100 : 0
        };
      }).filter((p: ProgressoMeta) => p.limite > 0);
      setProgressoDespesas(despesasProgresso);

      // Calcular progresso de receitas
      const metasReceitas = todasMetas.filter((m: Meta) => m.tipo === 'RECEITA');
      const receitasProgresso = metasReceitas.map((m: Meta) => {
        const receitaCategoria = (dataResumo.receitasPorCategoria || []).find(
          (r: { categoria: string; valor: number }) => r.categoria === m.categoria
        );
        const total = receitaCategoria?.valor || 0;
        return {
          categoria: m.categoria,
          tipo: 'RECEITA' as const,
          total,
          limite: m.limite,
          percentual: m.limite ? (total / m.limite) * 100 : 0
        };
      });
      setProgressoReceitas(receitasProgresso);
    } catch (error) {
      console.error('Erro ao carregar:', error);
    }
  };

  const adicionarMeta = async () => {
    if (!novaCategoria || !novoLimite) {
      setErro('Selecione uma categoria e preencha o valor');
      return;
    }

    try {
      const res = await fetch('/api/metas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: novoTipo,
          categoria: novaCategoria,
          limite: Number(novoLimite),
          mes: mesAtual
        }),
      });

      if (res.ok) {
        setNovaCategoria('');
        setNovoLimite('');
        carregarDados();
        setSucesso('Meta adicionada!');
        setTimeout(() => setSucesso(''), 2000);
      }
    } catch { setErro('Erro ao adicionar.'); }
  };

  const excluirMeta = async (id: string) => {
    try {
      await fetch(`/api/metas/${id}`, { method: 'DELETE' });
      carregarDados();
    } catch { setErro('Erro ao excluir.'); }
  };

  const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (!usuario) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div><h1 className="text-xl font-bold text-white">Nardotos Finance</h1><p className="text-gray-500 text-sm">{usuario}</p></div>
        <button onClick={() => router.push('/login')} className="text-gray-500 hover:text-white text-sm">Sair</button>
      </header>

      {/* Navegacao */}
      <div className="flex gap-2 mb-6 text-sm">
        <button onClick={() => router.push('/')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Lancamentos</button>
        <button onClick={() => router.push('/dashboard')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Dashboard</button>
        <button onClick={() => router.push('/planejamento')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Planejamento</button>
        <button className="flex-1 bg-white text-black py-2 px-3 rounded-lg font-medium">Metas</button>
      </div>

      {/* Adicionar Meta */}
      <div className="border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-gray-500 font-medium mb-3">Nova meta</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              onClick={() => setNovoTipo('DESPESA')}
              className={`flex-1 py-2 rounded-lg transition ${novoTipo === 'DESPESA' ? 'bg-red-600 text-white' : 'border border-gray-700 text-gray-400'}`}
            >
              Limite gasto
            </button>
            <button
              onClick={() => setNovoTipo('RECEITA')}
              className={`flex-1 py-2 rounded-lg transition ${novoTipo === 'RECEITA' ? 'bg-green-600 text-white' : 'border border-gray-700 text-gray-400'}`}
            >
              Meta receita
            </button>
          </div>
          <select
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded p-2 text-white"
          >
            <option value="">Selecione uma categoria</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="number"
            value={novoLimite}
            onChange={(e) => setNovoLimite(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded p-2 text-white"
            placeholder={novoTipo === 'RECEITA' ? 'Meta de faturamento (ex: 5000)' : 'Limite de gasto (ex: 500)'}
          />
          <button onClick={adicionarMeta} className="w-full bg-white text-black py-2 rounded-lg font-medium">Adicionar Meta</button>
        </div>
      </div>

      {erro && <div className="border border-red-800 text-red-400 rounded-lg p-3 mb-4">{erro}</div>}
      {sucesso && <div className="border border-green-800 text-green-400 rounded-lg p-3 mb-4">{sucesso}</div>}

      {/* Progresso de Receitas */}
      {progressoReceitas.length > 0 && (
        <div className="mb-6">
          <h3 className="text-gray-500 font-medium mb-3">Metas de faturamento</h3>
          <div className="space-y-3">
            {progressoReceitas.map((p, i) => (
              <div key={i} className="border border-gray-800 rounded-lg p-3">
                <div className="flex justify-between mb-2">
                  <span className="text-white">{p.categoria}</span>
                  <span className={p.percentual >= 100 ? 'text-green-500' : p.percentual >= 50 ? 'text-yellow-500' : 'text-red-500'}>
                    {formatarValor(p.total)} / {formatarValor(p.limite)}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${p.percentual >= 100 ? 'bg-green-500' : p.percentual >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(p.percentual, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{p.percentual.toFixed(0)}% alcancado</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progresso de Despesas */}
      {progressoDespesas.length > 0 && (
        <div className="mb-6">
          <h3 className="text-gray-500 font-medium mb-3">Limites de gasto</h3>
          <div className="space-y-3">
            {progressoDespesas.map((p, i) => (
              <div key={i} className="border border-gray-800 rounded-lg p-3">
                <div className="flex justify-between mb-2">
                  <span className="text-white">{p.categoria}</span>
                  <span className={p.percentual > 100 ? 'text-red-500' : p.percentual > 80 ? 'text-yellow-500' : 'text-green-500'}>
                    {formatarValor(p.total)} / {formatarValor(p.limite)}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${p.percentual > 100 ? 'bg-red-500' : p.percentual > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(p.percentual, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{p.percentual.toFixed(0)}% usado</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {progressoDespesas.length === 0 && progressoReceitas.length === 0 && (
        <p className="text-gray-600 text-center py-4 mb-6">Nenhuma meta com progresso ainda</p>
      )}

      {/* Lista de Metas */}
      <div>
        <h3 className="text-gray-500 font-medium mb-3">Metas cadastradas</h3>
        {metas.length === 0 ? <p className="text-gray-600 text-center py-4">Nenhuma meta cadastrada</p> : (
          <div className="space-y-2">
            {metas.map((m) => (
              <div key={m.id} className="flex items-center justify-between border border-gray-800 rounded-lg p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${m.tipo === 'RECEITA' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                      {m.tipo === 'RECEITA' ? 'Meta' : 'Limite'}
                    </span>
                    <p className="text-white">{m.categoria}</p>
                  </div>
                  <p className="text-sm text-gray-500">{formatarValor(m.limite)}</p>
                </div>
                <button onClick={() => m.id && excluirMeta(m.id)} className="text-gray-500 hover:text-red-400">X</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
