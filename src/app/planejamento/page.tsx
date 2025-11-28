'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ContaFutura {
  id?: string;
  tipo: 'RECEITA' | 'DESPESA';
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
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'atrasadas' | 'pagas'>('pendentes');
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

  const processarTexto = async () => {
    if (!texto.trim()) return;

    setSalvando(true);
    setErro('');

    try {
      const resProcessar = await fetch('/api/processar-planejamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });

      const dataProcessar = await resProcessar.json();

      if (!resProcessar.ok) {
        throw new Error(dataProcessar.error || 'Erro ao processar');
      }

      for (const plan of dataProcessar.planejamentos) {
        await fetch('/api/planejamento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...plan,
            dataVencimento: plan.dataVencimento,
            paga: false,
            usuario
          }),
        });
      }

      setTexto('');
      carregarContas();
      setSucesso(`${dataProcessar.planejamentos.length} planejamento(s) adicionado(s)!`);
      setTimeout(() => setSucesso(''), 3000);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao processar');
    } finally {
      setSalvando(false);
    }
  };

  const marcarPaga = async (id: string) => {
    try {
      await fetch(`/api/planejamento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paga: true }),
      });
      carregarContas();
      setSucesso('Marcado como pago e lancamento criado!');
      setTimeout(() => setSucesso(''), 3000);
    } catch { setErro('Erro ao atualizar.'); }
  };

  const excluirConta = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir?')) return;
    try {
      await fetch(`/api/planejamento/${id}`, { method: 'DELETE' });
      carregarContas();
    } catch { setErro('Erro ao excluir.'); }
  };

  const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR');

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const isAtrasada = (conta: ContaFutura) => {
    if (conta.paga) return false;
    const dataVenc = new Date(conta.dataVencimento);
    dataVenc.setHours(0, 0, 0, 0);
    return dataVenc < hoje;
  };

  const isProximaVencer = (conta: ContaFutura) => {
    if (conta.paga) return false;
    const dataVenc = new Date(conta.dataVencimento);
    dataVenc.setHours(0, 0, 0, 0);
    const diffDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diffDias >= 0 && diffDias <= 3;
  };

  const contasFiltradas = contas.filter(c => {
    if (filtro === 'todas') return true;
    if (filtro === 'pendentes') return !c.paga;
    if (filtro === 'atrasadas') return isAtrasada(c);
    if (filtro === 'pagas') return c.paga;
    return true;
  }).sort((a, b) => new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime());

  const contasAtrasadas = contas.filter(c => isAtrasada(c));
  const contasPendentes = contas.filter(c => !c.paga);
  const despesasPendentes = contasPendentes.filter(c => c.tipo === 'DESPESA');
  const receitasPendentes = contasPendentes.filter(c => c.tipo === 'RECEITA');
  const totalAtrasado = contasAtrasadas.reduce((acc, c) => acc + c.valor, 0);
  const totalDespesas = despesasPendentes.reduce((acc, c) => acc + c.valor, 0);
  const totalReceitas = receitasPendentes.reduce((acc, c) => acc + c.valor, 0);
  const saldoPrevisto = totalReceitas - totalDespesas;

  if (!usuario) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div><h1 className="text-xl font-bold text-white">Nardotos Finance</h1><p className="text-gray-500 text-sm">{usuario}</p></div>
        <button onClick={() => router.push('/login')} className="text-gray-500 hover:text-white text-sm">Sair</button>
      </header>

      <div className="flex gap-2 mb-6 text-sm">
        <button onClick={() => router.push('/')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Lancamentos</button>
        <button onClick={() => router.push('/dashboard')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Dashboard</button>
        <button className="flex-1 bg-white text-black py-2 px-3 rounded-lg font-medium">Planejamento</button>
        <button onClick={() => router.push('/metas')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Metas</button>
      </div>

      {contasAtrasadas.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-500 text-xl">!</span>
            <h3 className="text-red-400 font-bold">Contas Atrasadas!</h3>
          </div>
          <p className="text-red-300 text-sm">
            Voce tem <strong>{contasAtrasadas.length}</strong> conta(s) atrasada(s) totalizando <strong>{formatarValor(totalAtrasado)}</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="border border-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">A receber</p>
          <p className="text-lg font-bold text-green-500">{formatarValor(totalReceitas)}</p>
        </div>
        <div className="border border-gray-800 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">A pagar</p>
          <p className="text-lg font-bold text-red-500">{formatarValor(totalDespesas)}</p>
        </div>
      </div>
      <div className="border border-gray-800 rounded-lg p-3 text-center mb-6">
        <p className="text-xs text-gray-500">Saldo previsto</p>
        <p className={`text-xl font-bold ${saldoPrevisto >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatarValor(saldoPrevisto)}</p>
      </div>

      <div className="border border-gray-800 rounded-lg p-4 mb-6">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[80px]"
          placeholder="Ex: pagar aluguel 1500 dia 30, luz 180 dia 10, receber freelance 2000 dia 15..."
          disabled={salvando}
        />
        <button
          onClick={processarTexto}
          disabled={salvando || !texto.trim()}
          className="w-full bg-white text-black py-3 rounded-lg font-medium disabled:bg-gray-700 disabled:text-gray-500 mt-2"
        >
          {salvando ? 'Processando...' : 'Adicionar Planejamento'}
        </button>
      </div>

      {erro && <div className="border border-red-800 text-red-400 rounded-lg p-3 mb-4">{erro}</div>}
      {sucesso && <div className="border border-green-800 text-green-400 rounded-lg p-3 mb-4">{sucesso}</div>}

      <div className="flex gap-2 mb-4 text-xs">
        {(['pendentes', 'atrasadas', 'pagas', 'todas'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-3 py-1 rounded-full ${filtro === f ? 'bg-white text-black' : 'border border-gray-700 text-gray-400'}`}
          >
            {f === 'pendentes' && `Pendentes (${contasPendentes.length})`}
            {f === 'atrasadas' && `Atrasadas (${contasAtrasadas.length})`}
            {f === 'pagas' && `Pagas`}
            {f === 'todas' && `Todas`}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {contasFiltradas.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Nenhuma conta encontrada</p>
        ) : (
          contasFiltradas.map((c) => {
            const atrasada = isAtrasada(c);
            const proximaVencer = isProximaVencer(c);

            return (
              <div
                key={c.id}
                className={`border rounded-lg p-3 ${
                  c.paga
                    ? 'border-gray-800 opacity-60'
                    : atrasada
                    ? 'border-red-700 bg-red-900/20'
                    : proximaVencer
                    ? 'border-yellow-700 bg-yellow-900/20'
                    : 'border-gray-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${c.tipo === 'RECEITA' ? 'text-green-500' : 'text-red-500'}`}>
                        {c.tipo === 'RECEITA' ? '+' : '-'}{formatarValor(c.valor)}
                      </p>
                      {atrasada && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded">ATRASADA</span>}
                      {proximaVencer && !atrasada && <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">VENCE EM BREVE</span>}
                      {c.paga && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">PAGO</span>}
                    </div>
                    <p className="text-sm text-gray-400">{c.descricao}</p>
                    <p className="text-xs text-gray-600">
                      {c.categoria} - {atrasada ? 'Venceu em' : 'Vence em'} {formatarData(c.dataVencimento)}
                      {c.recorrente && ' - Recorrente'}
                    </p>
                  </div>
                  {!c.paga && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => c.id && marcarPaga(c.id)}
                        className="text-green-500 hover:text-green-400 text-sm px-2 py-1 border border-green-700 rounded"
                      >
                        {c.tipo === 'RECEITA' ? 'Recebido' : 'Pago'}
                      </button>
                      <button
                        onClick={() => c.id && excluirConta(c.id)}
                        className="text-gray-500 hover:text-red-400 text-sm"
                      >
                        X
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
