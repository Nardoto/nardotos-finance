'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ContaFutura {
  id?: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  categoria: string;
  recorrente: boolean;
  paga: boolean;
}

export default function Planejamento() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [contas, setContas] = useState<ContaFutura[]>([]);
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');
  const [novaData, setNovaData] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [recorrente, setRecorrente] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const router = useRouter();

  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario');
    if (!usuarioSalvo) {
      router.push('/login');
    } else {
      setUsuario(usuarioSalvo);
      carregarContas();
    }
  }, [router]);

  const carregarContas = async () => {
    try {
      const res = await fetch('/api/planejamento');
      const data = await res.json();
      setContas(data.contas || []);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const adicionarConta = async () => {
    if (!novaDescricao || !novoValor || !novaData) {
      setErro('Preencha todos os campos');
      return;
    }

    try {
      const res = await fetch('/api/planejamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao: novaDescricao,
          valor: Number(novoValor),
          dataVencimento: novaData,
          categoria: novaCategoria.toUpperCase() || 'OUTROS',
          recorrente,
          paga: false,
          usuario
        }),
      });

      if (res.ok) {
        setNovaDescricao('');
        setNovoValor('');
        setNovaData('');
        setNovaCategoria('');
        setRecorrente(false);
        carregarContas();
        setSucesso('Conta adicionada!');
        setTimeout(() => setSucesso(''), 2000);
      }
    } catch { setErro('Erro ao adicionar.'); }
  };

  const marcarPaga = async (id: string) => {
    try {
      await fetch(`/api/planejamento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paga: true }),
      });
      carregarContas();
    } catch { setErro('Erro ao atualizar.'); }
  };

  const excluirConta = async (id: string) => {
    try {
      await fetch(`/api/planejamento/${id}`, { method: 'DELETE' });
      carregarContas();
    } catch { setErro('Erro ao excluir.'); }
  };

  const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR');

  const totalPendente = contas.filter(c => !c.paga).reduce((acc, c) => acc + c.valor, 0);

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
        <button className="flex-1 bg-white text-black py-2 px-3 rounded-lg font-medium">Planejamento</button>
        <button onClick={() => router.push('/metas')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Metas</button>
      </div>

      {/* Total Pendente */}
      <div className="border border-gray-800 rounded-lg p-4 mb-6 text-center">
        <p className="text-gray-500 text-sm">Total a pagar</p>
        <p className="text-2xl font-bold text-red-500">{formatarValor(totalPendente)}</p>
      </div>

      {/* Adicionar Conta */}
      <div className="border border-gray-800 rounded-lg p-4 mb-6">
        <h3 className="text-gray-500 font-medium mb-3">Nova conta futura</h3>
        <div className="space-y-2">
          <input value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white" placeholder="Descricao (ex: Aluguel)" />
          <div className="flex gap-2">
            <input type="number" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} className="flex-1 bg-black border border-gray-700 rounded p-2 text-white" placeholder="Valor" />
            <input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} className="flex-1 bg-black border border-gray-700 rounded p-2 text-white" />
          </div>
          <input value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white" placeholder="Categoria (ex: ALUGUEL)" />
          <label className="flex items-center gap-2 text-gray-400 text-sm">
            <input type="checkbox" checked={recorrente} onChange={(e) => setRecorrente(e.target.checked)} className="rounded" />
            Conta recorrente (mensal)
          </label>
          <button onClick={adicionarConta} className="w-full bg-white text-black py-2 rounded-lg font-medium">Adicionar</button>
        </div>
      </div>

      {erro && <div className="border border-red-800 text-red-400 rounded-lg p-3 mb-4">{erro}</div>}
      {sucesso && <div className="border border-green-800 text-green-400 rounded-lg p-3 mb-4">{sucesso}</div>}

      {/* Lista de Contas */}
      <div>
        <h3 className="text-gray-500 font-medium mb-3">Contas futuras</h3>
        {contas.length === 0 ? <p className="text-gray-600 text-center py-8">Nenhuma conta cadastrada</p> : (
          <div className="space-y-2">
            {contas.map((c) => (
              <div key={c.id} className={`border rounded-lg p-3 ${c.paga ? 'border-green-800 opacity-50' : 'border-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${c.paga ? 'text-green-500 line-through' : 'text-red-500'}`}>-{formatarValor(c.valor)}</p>
                    <p className="text-sm text-gray-500">{c.descricao}</p>
                    <p className="text-xs text-gray-600">{c.categoria} - Vence {formatarData(c.dataVencimento)}</p>
                    {c.recorrente && <span className="text-xs text-yellow-500">Recorrente</span>}
                  </div>
                  <div className="flex gap-2">
                    {!c.paga && (
                      <button onClick={() => c.id && marcarPaga(c.id)} className="text-green-500 hover:text-green-400 text-sm">Pagar</button>
                    )}
                    <button onClick={() => c.id && excluirConta(c.id)} className="text-gray-500 hover:text-red-400 text-sm">X</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
