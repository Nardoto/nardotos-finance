'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Orcamento {
  id?: string;
  usuario: string;
  mes: string;
  orcamentoGlobal?: number;
  categorias: Record<string, number>;
}

export default function OrcamentoPage() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [orcamentoGlobal, setOrcamentoGlobal] = useState<string>('');
  const [categorias, setCategorias] = useState<Record<string, number>>({});
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novoLimite, setNovoLimite] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');
  const router = useRouter();

  const CATEGORIAS_SUGERIDAS = [
    'ALIMENTACAO', 'GASOLINA', 'EDUCACAO', 'LAZER', 'SAUDE',
    'TRANSPORTE', 'MERCADO', 'RESTAURANTE', 'UBER', 'CARTAO'
  ];

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (!usuarioSalvo) {
      router.push('/login');
    } else {
      setUsuario(usuarioSalvo);
      carregarOrcamento(usuarioSalvo, mesSelecionado);
    }
  }, [mesSelecionado]);

  const carregarOrcamento = async (user: string, mes: string) => {
    try {
      const res = await fetch(`/api/orcamento?usuario=${user}&mes=${mes}`);
      const data = await res.json();

      if (data.orcamento) {
        setOrcamentoGlobal(data.orcamento.orcamentoGlobal?.toString() || '');
        setCategorias(data.orcamento.categorias || {});
      } else {
        setOrcamentoGlobal('');
        setCategorias({});
      }
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
    }
  };

  const adicionarCategoria = () => {
    if (!novaCategoria.trim() || !novoLimite) return;

    const categoriaUpper = novaCategoria.toUpperCase().trim();
    setCategorias(prev => ({
      ...prev,
      [categoriaUpper]: Number(novoLimite)
    }));
    setNovaCategoria('');
    setNovoLimite('');
  };

  const removerCategoria = (categoria: string) => {
    setCategorias(prev => {
      const novo = { ...prev };
      delete novo[categoria];
      return novo;
    });
  };

  const salvarOrcamento = async () => {
    if (!usuario) return;

    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      const res = await fetch('/api/orcamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario,
          mes: mesSelecionado,
          orcamentoGlobal: orcamentoGlobal ? Number(orcamentoGlobal) : null,
          categorias
        })
      });

      const data = await res.json();

      if (data.error) {
        setErro(data.error);
      } else {
        setSucesso('Orçamento salvo com sucesso!');
        setTimeout(() => setSucesso(''), 3000);
      }
    } catch (error) {
      setErro('Erro ao salvar orçamento');
      console.error(error);
    } finally {
      setSalvando(false);
    }
  };

  const getNomeMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  };

  const mudarMes = (delta: number) => {
    const [ano, mes] = mesSelecionado.split('-').map(Number);
    const data = new Date(ano, mes - 1 + delta, 1);
    setMesSelecionado(`${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a0f1e] to-[#1a1f2e] p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition"
          >
            ← Voltar
          </button>
          <h1 className="text-2xl font-bold text-white">💰 Orçamento e Metas</h1>
        </div>
      </div>

      {/* Seletor de Mês */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => mudarMes(-1)}
          className="bg-[#151d32] border border-[#1e2a4a] hover:border-orange-500 text-white px-4 py-2 rounded-lg transition"
        >
          ←
        </button>
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-2 rounded-lg">
          <h2 className="font-bold text-lg text-white text-center min-w-[120px]">{getNomeMes(mesSelecionado)}</h2>
        </div>
        <button
          onClick={() => mudarMes(1)}
          className="bg-[#151d32] border border-[#1e2a4a] hover:border-orange-500 text-white px-4 py-2 rounded-lg transition"
        >
          →
        </button>
      </div>

      {/* Orçamento Global */}
      <div className="border border-orange-500/50 rounded-xl p-4 mb-6 bg-[#151d32]">
        <h3 className="text-sm font-medium text-orange-400 mb-3">🎯 Meta de Gastos Mensal (Opcional)</h3>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">R$</span>
          <input
            type="number"
            value={orcamentoGlobal}
            onChange={(e) => setOrcamentoGlobal(e.target.value)}
            placeholder="Ex: 3000"
            className="flex-1 bg-[#0f1629] border border-[#1e2a4a] rounded-lg p-2 text-white focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Defina um limite total de gastos para o mês</p>
      </div>

      {/* Orçamento por Categoria */}
      <div className="border border-[#1e2a4a] rounded-xl p-4 mb-6 bg-[#151d32]">
        <h3 className="text-sm font-medium text-gray-400 mb-3">📊 Orçamento por Categoria</h3>

        {/* Lista de categorias configuradas */}
        <div className="space-y-2 mb-4">
          {Object.entries(categorias).length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-4">Nenhuma categoria configurada</p>
          ) : (
            Object.entries(categorias).map(([categoria, limite]) => (
              <div key={categoria} className="flex items-center justify-between bg-[#0f1629] border border-[#1e2a4a] rounded-lg p-3">
                <div>
                  <p className="text-white font-medium text-sm">{categoria}</p>
                  <p className="text-xs text-gray-500">Limite: {formatarValor(limite)}</p>
                </div>
                <button
                  onClick={() => removerCategoria(categoria)}
                  className="text-red-400 hover:text-red-300 text-sm px-2"
                >
                  Remover
                </button>
              </div>
            ))
          )}
        </div>

        {/* Adicionar nova categoria */}
        <div className="border-t border-[#1e2a4a] pt-4">
          <p className="text-xs text-gray-500 mb-2">Adicionar nova categoria:</p>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Nome da categoria"
              className="flex-1 bg-[#0f1629] border border-[#1e2a4a] rounded-lg p-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
              list="categorias-sugeridas"
            />
            <datalist id="categorias-sugeridas">
              {CATEGORIAS_SUGERIDAS.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
            <input
              type="number"
              value={novoLimite}
              onChange={(e) => setNovoLimite(e.target.value)}
              placeholder="Limite (R$)"
              className="w-32 bg-[#0f1629] border border-[#1e2a4a] rounded-lg p-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
            />
            <button
              onClick={adicionarCategoria}
              disabled={!novaCategoria.trim() || !novoLimite}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-[#1e2a4a] disabled:text-gray-500 text-white px-4 rounded-lg text-sm transition"
            >
              + Adicionar
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {CATEGORIAS_SUGERIDAS.map(cat => (
              <button
                key={cat}
                onClick={() => setNovaCategoria(cat)}
                className="text-[10px] bg-[#0f1629] border border-[#1e2a4a] hover:border-orange-500/50 text-gray-400 hover:text-orange-400 px-2 py-1 rounded transition"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <button
        onClick={salvarOrcamento}
        disabled={salvando}
        className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-3 rounded-xl transition"
      >
        {salvando ? 'Salvando...' : '💾 Salvar Orçamento'}
      </button>

      {/* Mensagens */}
      {erro && <div className="border border-red-800 text-red-400 rounded-lg p-3 mt-4">{erro}</div>}
      {sucesso && <div className="border border-green-800 text-green-400 rounded-lg p-3 mt-4">{sucesso}</div>}

      {/* Dicas */}
      <div className="mt-6 border border-blue-500/30 bg-blue-900/20 rounded-xl p-4">
        <h3 className="text-sm font-medium text-blue-400 mb-2">💡 Dicas</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Configure limites para as categorias que você mais gasta</li>
          <li>• O orçamento global é opcional e serve como meta total mensal</li>
          <li>• Você verá barras de progresso na página principal mostrando quanto já gastou</li>
          <li>• Cores: 🟢 verde (ok) • 🟡 amarelo (80%+) • 🔴 vermelho (100%+)</li>
        </ul>
      </div>
    </main>
  );
}
