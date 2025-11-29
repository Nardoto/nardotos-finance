'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

interface CategoriaInfo {
  nome: string;
  quantidade: number;
  tipo: 'DESPESA' | 'RECEITA' | 'MISTO';
}

export default function Categorias() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<CategoriaInfo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [mesclando, setMesclando] = useState<string | null>(null);
  const [categoriaDestino, setCategoriaDestino] = useState('');
  const [renomeando, setRenomeando] = useState(false);
  const [mesclandoCategoria, setMesclandoCategoria] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (!usuarioSalvo) {
      router.push('/login');
    } else {
      setUsuario(usuarioSalvo);
      carregarCategorias();
    }
  }, [router]);

  const carregarCategorias = async () => {
    try {
      setCarregando(true);

      // Buscar lancamentos para contar por categoria
      const resLancamentos = await fetch('/api/lancamentos?limit=1000');
      const dataLancamentos = await resLancamentos.json();

      // Buscar planejamentos
      const resPlanejamentos = await fetch('/api/planejamento');
      const dataPlanejamentos = await resPlanejamentos.json();

      const contagem: Record<string, { quantidade: number; tipos: Set<string> }> = {};

      // Contar lancamentos
      (dataLancamentos.lancamentos || []).forEach((l: { categoria: string; tipo: string }) => {
        const cat = l.categoria?.toUpperCase() || 'OUTROS';
        if (!contagem[cat]) contagem[cat] = { quantidade: 0, tipos: new Set() };
        contagem[cat].quantidade++;
        contagem[cat].tipos.add(l.tipo);
      });

      // Contar planejamentos
      (dataPlanejamentos.contas || []).forEach((p: { categoria: string; tipo: string }) => {
        const cat = p.categoria?.toUpperCase() || 'OUTROS';
        if (!contagem[cat]) contagem[cat] = { quantidade: 0, tipos: new Set() };
        contagem[cat].quantidade++;
        contagem[cat].tipos.add(p.tipo);
      });

      const categoriasInfo: CategoriaInfo[] = Object.entries(contagem)
        .map(([nome, info]) => ({
          nome,
          quantidade: info.quantidade,
          tipo: info.tipos.size > 1 ? 'MISTO' as const :
                info.tipos.has('RECEITA') ? 'RECEITA' as const : 'DESPESA' as const
        }))
        .sort((a, b) => b.quantidade - a.quantidade);

      setCategorias(categoriasInfo);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      setErro('Erro ao carregar categorias');
    } finally {
      setCarregando(false);
    }
  };

  const renomearCategoria = async (nomeAntigo: string) => {
    if (!novoNome.trim() || novoNome.toUpperCase() === nomeAntigo) {
      setEditando(null);
      return;
    }

    setRenomeando(true);
    try {
      const res = await fetch(`/api/categorias/${encodeURIComponent(nomeAntigo)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novoNome: novoNome.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        setSucesso(data.mensagem);
        setTimeout(() => setSucesso(''), 3000);
        carregarCategorias();
      } else {
        setErro(data.error);
      }
    } catch {
      setErro('Erro ao renomear categoria');
    } finally {
      setRenomeando(false);
      setEditando(null);
      setNovoNome('');
    }
  };

  const mesclarCategoria = async (origem: string) => {
    if (!categoriaDestino || categoriaDestino === origem) {
      setMesclando(null);
      return;
    }

    setMesclandoCategoria(true);
    try {
      const res = await fetch(`/api/categorias/${encodeURIComponent(origem)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoriaDestino })
      });

      const data = await res.json();
      if (res.ok) {
        setSucesso(data.mensagem);
        setTimeout(() => setSucesso(''), 3000);
        carregarCategorias();
      } else {
        setErro(data.error);
      }
    } catch {
      setErro('Erro ao mesclar categoria');
    } finally {
      setMesclandoCategoria(false);
      setMesclando(null);
      setCategoriaDestino('');
    }
  };

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Nardotos Finance</h1>
          <p className="text-gray-500 text-sm">{usuario}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => router.push('/login')} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">
            Sair
          </button>
        </div>
      </header>

      <div className="flex gap-2 mb-6 text-sm flex-wrap">
        <button onClick={() => router.push('/')} className="flex-1 border border-gray-700 py-2 px-3 rounded-lg min-w-[70px]">Lancamentos</button>
        <button onClick={() => router.push('/dashboard')} className="flex-1 border border-gray-700 py-2 px-3 rounded-lg min-w-[70px]">Dashboard</button>
        <button onClick={() => router.push('/planejamento')} className="flex-1 border border-gray-700 py-2 px-3 rounded-lg min-w-[70px]">Planejar</button>
        <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg font-medium min-w-[70px]">Categorias</button>
      </div>

      <h2 className="font-bold text-lg mb-4">Gerenciar Categorias</h2>

      {erro && (
        <div className="border border-red-800 text-red-400 rounded-lg p-3 mb-4">
          {erro}
          <button onClick={() => setErro('')} className="float-right text-red-500">X</button>
        </div>
      )}

      {sucesso && (
        <div className="border border-green-800 text-green-400 rounded-lg p-3 mb-4">
          {sucesso}
        </div>
      )}

      {carregando ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
        </div>
      ) : categorias.length === 0 ? (
        <p className="text-gray-600 text-center py-8">Nenhuma categoria encontrada</p>
      ) : (
        <div className="space-y-2">
          {categorias.map((cat) => (
            <div key={cat.nome} className="border border-gray-800 rounded-lg p-3 bg-gray-900">
              {editando === cat.nome ? (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1"
                    placeholder="Novo nome"
                    autoFocus
                  />
                  <button
                    onClick={() => renomearCategoria(cat.nome)}
                    disabled={renomeando}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {renomeando ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => { setEditando(null); setNovoNome(''); }}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2"
                  >
                    X
                  </button>
                </div>
              ) : mesclando === cat.nome ? (
                <div className="space-y-2">
                  <p className="text-sm">Mesclar "{cat.nome}" com:</p>
                  <select
                    value={categoriaDestino}
                    onChange={(e) => setCategoriaDestino(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1"
                  >
                    <option value="">Selecione a categoria destino</option>
                    {categorias
                      .filter(c => c.nome !== cat.nome)
                      .map(c => (
                        <option key={c.nome} value={c.nome}>{c.nome} ({c.quantidade})</option>
                      ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => mesclarCategoria(cat.nome)}
                      disabled={!categoriaDestino || mesclandoCategoria}
                      className="bg-orange-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {mesclandoCategoria ? 'Mesclando...' : 'Confirmar'}
                    </button>
                    <button
                      onClick={() => { setMesclando(null); setCategoriaDestino(''); }}
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${
                        cat.tipo === 'RECEITA' ? 'bg-green-600 dark:bg-green-400' :
                        cat.tipo === 'DESPESA' ? 'bg-red-600 dark:bg-red-400' : 'bg-yellow-600 dark:bg-yellow-400'
                      }`}></span>
                      <span className="font-medium">{cat.nome}</span>
                      <span className="text-gray-500 text-sm">({cat.quantidade} registros)</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditando(cat.nome); setNovoNome(cat.nome); }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm px-2 py-1 border border-blue-600 dark:border-blue-700 rounded"
                    >
                      Renomear
                    </button>
                    <button
                      onClick={() => setMesclando(cat.nome)}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 text-sm px-2 py-1 border border-orange-600 dark:border-orange-700 rounded"
                    >
                      Mesclar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 border border-gray-800 rounded-lg bg-gray-900">
        <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-2">Dicas:</h3>
        <ul className="text-gray-600 dark:text-gray-500 text-xs space-y-1">
          <li>• <strong>Renomear:</strong> Altera o nome da categoria em todos os lancamentos e planejamentos</li>
          <li>• <strong>Mesclar:</strong> Move todos os registros para outra categoria e remove a original</li>
        </ul>
      </div>
    </main>
  );
}
