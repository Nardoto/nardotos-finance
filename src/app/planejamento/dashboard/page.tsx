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

interface ResumoMensal {
  mes: string;
  totalReceitasPendentes: number;
  totalReceitasPagas: number;
  totalDespesasPendentes: number;
  totalDespesasPagas: number;
  saldoPrevisto: number;
  saldoRealizado: number;
  percentualReceitasRecebidas: number;
  percentualDespesasPagas: number;
}

export default function PlanejamentoDashboard() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [contas, setContas] = useState<ContaFutura[]>([]);
  const [resumosMensais, setResumosMensais] = useState<ResumoMensal[]>([]);
  const [carregando, setCarregando] = useState(true);
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
      setCarregando(true);
      const res = await fetch('/api/planejamento');
      const data = await res.json();
      const todasContas = data.contas || [];
      setContas(todasContas);

      // Agrupar por mês
      const contasPorMes: Record<string, ContaFutura[]> = {};
      todasContas.forEach((c: ContaFutura) => {
        const dataVenc = new Date(c.dataVencimento);
        const mesAno = `${dataVenc.getFullYear()}-${String(dataVenc.getMonth() + 1).padStart(2, '0')}`;
        if (!contasPorMes[mesAno]) contasPorMes[mesAno] = [];
        contasPorMes[mesAno].push(c);
      });

      // Calcular resumos
      const resumos: ResumoMensal[] = Object.entries(contasPorMes)
        .map(([mes, contas]) => {
          const receitasPendentes = contas.filter(c => c.tipo === 'RECEITA' && !c.paga);
          const receitasPagas = contas.filter(c => c.tipo === 'RECEITA' && c.paga);
          const despesasPendentes = contas.filter(c => c.tipo === 'DESPESA' && !c.paga);
          const despesasPagas = contas.filter(c => c.tipo === 'DESPESA' && c.paga);

          const totalReceitasPendentes = receitasPendentes.reduce((acc, c) => acc + c.valor, 0);
          const totalReceitasPagas = receitasPagas.reduce((acc, c) => acc + c.valor, 0);
          const totalDespesasPendentes = despesasPendentes.reduce((acc, c) => acc + c.valor, 0);
          const totalDespesasPagas = despesasPagas.reduce((acc, c) => acc + c.valor, 0);

          const totalReceitas = totalReceitasPendentes + totalReceitasPagas;
          const totalDespesas = totalDespesasPendentes + totalDespesasPagas;

          return {
            mes,
            totalReceitasPendentes,
            totalReceitasPagas,
            totalDespesasPendentes,
            totalDespesasPagas,
            saldoPrevisto: totalReceitasPendentes - totalDespesasPendentes,
            saldoRealizado: totalReceitasPagas - totalDespesasPagas,
            percentualReceitasRecebidas: totalReceitas > 0 ? (totalReceitasPagas / totalReceitas) * 100 : 0,
            percentualDespesasPagas: totalDespesas > 0 ? (totalDespesasPagas / totalDespesas) * 100 : 0,
          };
        })
        .sort((a, b) => b.mes.localeCompare(a.mes)); // Mais recente primeiro

      setResumosMensais(resumos);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const getNomeMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1);
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Nardotos Finance</h1>
          <p className="text-gray-500 text-sm">{usuario}</p>
        </div>
        <button onClick={() => router.push('/login')} className="text-gray-500 hover:text-white text-sm">
          Sair
        </button>
      </header>

      <div className="flex gap-2 mb-6 text-sm flex-wrap">
        <button onClick={() => router.push('/')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg min-w-[70px]">Lancamentos</button>
        <button onClick={() => router.push('/dashboard')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg min-w-[70px]">Dashboard</button>
        <button onClick={() => router.push('/planejamento')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg min-w-[70px]">Planejar</button>
        <button onClick={() => router.push('/categorias')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg min-w-[70px]">Categorias</button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-bold text-lg">Dashboard de Planejamento</h2>
        <button
          onClick={() => router.push('/planejamento')}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          ← Voltar para Planejamento
        </button>
      </div>

      {carregando ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : resumosMensais.length === 0 ? (
        <p className="text-gray-600 text-center py-8">Nenhum planejamento encontrado</p>
      ) : (
        <div className="space-y-6">
          {resumosMensais.map((resumo) => (
            <div key={resumo.mes} className="border border-gray-800 rounded-lg p-4">
              <h3 className="text-white font-bold text-lg mb-4 capitalize">{getNomeMes(resumo.mes)}</h3>

              {/* Cards de resumo */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="border border-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">A Receber</p>
                  <p className="text-lg font-bold text-green-500">{formatarValor(resumo.totalReceitasPendentes)}</p>
                  <div className="mt-2">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all"
                        style={{ width: `${resumo.percentualReceitasRecebidas}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {resumo.percentualReceitasRecebidas.toFixed(0)}% recebido ({formatarValor(resumo.totalReceitasPagas)})
                    </p>
                  </div>
                </div>

                <div className="border border-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">A Pagar</p>
                  <p className="text-lg font-bold text-red-500">{formatarValor(resumo.totalDespesasPendentes)}</p>
                  <div className="mt-2">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 transition-all"
                        style={{ width: `${resumo.percentualDespesasPagas}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {resumo.percentualDespesasPagas.toFixed(0)}% pago ({formatarValor(resumo.totalDespesasPagas)})
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Saldo Previsto</p>
                  <p className={`text-lg font-bold ${resumo.saldoPrevisto >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatarValor(resumo.saldoPrevisto)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Contas pendentes</p>
                </div>

                <div className="border border-gray-800 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">Saldo Realizado</p>
                  <p className={`text-lg font-bold ${resumo.saldoRealizado >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatarValor(resumo.saldoRealizado)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Contas pagas</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 border border-gray-800 rounded-lg">
        <h3 className="text-gray-400 text-sm font-medium mb-2">Sobre este Dashboard</h3>
        <ul className="text-gray-500 text-xs space-y-1">
          <li>• <strong>A Receber/Pagar:</strong> Valores das contas pendentes do mês</li>
          <li>• <strong>Barra de progresso:</strong> Percentual já pago/recebido</li>
          <li>• <strong>Saldo Previsto:</strong> Diferença entre receitas e despesas pendentes</li>
          <li>• <strong>Saldo Realizado:</strong> Diferença entre receitas e despesas já pagas</li>
        </ul>
      </div>
    </main>
  );
}
