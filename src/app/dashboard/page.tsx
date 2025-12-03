'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import OrcamentoWidget from '@/components/OrcamentoWidget';

interface DadosMes {
  mes: string;
  receitas: number;
  despesas: number;
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [dados, setDados] = useState<DadosMes[]>([]);
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
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDados(data.meses || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarValorCurto = (valor: number) => {
    if (valor >= 1000) return `${(valor / 1000).toFixed(1)}K`;
    return valor.toString();
  };

  // Totais
  const totalReceitas = dados.reduce((acc, d) => acc + d.receitas, 0);
  const totalDespesas = dados.reduce((acc, d) => acc + d.despesas, 0);
  const saldo = totalReceitas - totalDespesas;
  const percentualMudanca = totalDespesas > 0 ? ((saldo / totalDespesas) * 100).toFixed(1) : '0';

  // Calcular pontos para o gráfico de linhas
  const maxValor = Math.max(...dados.flatMap(d => [d.receitas, d.despesas]), 1);
  const chartWidth = 100;
  const chartHeight = 60;
  const padding = 5;

  const getY = (valor: number) => {
    return chartHeight - padding - ((valor / maxValor) * (chartHeight - padding * 2));
  };

  const getX = (index: number) => {
    if (dados.length <= 1) return chartWidth / 2;
    return padding + (index * (chartWidth - padding * 2) / (dados.length - 1));
  };

  // Criar paths para as linhas
  const receitasPath = dados.length > 0
    ? dados.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.receitas)}`).join(' ')
    : '';
  const despesasPath = dados.length > 0
    ? dados.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.despesas)}`).join(' ')
    : '';

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm">{usuario}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => router.push('/login')} className="text-gray-500 hover:text-orange-400 text-sm">Sair</button>
        </div>
      </header>

      {/* Navegação com abas */}
      <div className="flex border-b border-[#1e2a4a] mb-6">
        <button onClick={() => router.push('/')} className="px-4 py-2 text-gray-500 hover:text-orange-400 border-b-2 border-transparent">
          Lançamentos
        </button>
        <button className="px-4 py-2 text-orange-500 border-b-2 border-orange-500 font-medium">
          Dashboard
        </button>
        <button onClick={() => router.push('/planejamento')} className="px-4 py-2 text-gray-500 hover:text-orange-400 border-b-2 border-transparent">
          Planejar
        </button>
        <button onClick={() => router.push('/categorias')} className="px-4 py-2 text-gray-500 hover:text-orange-400 border-b-2 border-transparent">
          Categorias
        </button>
      </div>

      {/* Widget de Orçamento */}
      <OrcamentoWidget />

      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Card principal - Cashflow */}
          <div className="bg-[#151d32] border border-[#1e2a4a] rounded-2xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-gray-400 text-sm mb-1">Cashflow</h2>
                <p className="text-3xl font-bold text-white">{formatarValor(saldo)}</p>
                <span className={`text-sm ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {saldo >= 0 ? '↑' : '↓'} {percentualMudanca}%
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Receitas
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  Despesas
                </span>
              </div>
            </div>

            {/* Gráfico de Linhas SVG */}
            <div className="relative h-48 mt-4">
              {/* Grid horizontal */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="border-t border-[#1e2a4a] w-full flex items-center">
                    <span className="text-[10px] text-gray-600 -mt-2 mr-2">
                      {formatarValorCurto(maxValor - (maxValor / 3) * i)}
                    </span>
                  </div>
                ))}
              </div>

              {/* SVG do gráfico */}
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Área preenchida das receitas */}
                {dados.length > 0 && (
                  <path
                    d={`${receitasPath} L ${getX(dados.length - 1)} ${chartHeight} L ${getX(0)} ${chartHeight} Z`}
                    fill="url(#gradientOrange)"
                    opacity="0.2"
                  />
                )}

                {/* Linha das despesas */}
                <path
                  d={despesasPath}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Linha das receitas */}
                <path
                  d={receitasPath}
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="0.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Pontos das despesas */}
                {dados.map((d, i) => (
                  <circle
                    key={`desp-${i}`}
                    cx={getX(i)}
                    cy={getY(d.despesas)}
                    r="1"
                    fill="#64748b"
                  />
                ))}

                {/* Pontos das receitas */}
                {dados.map((d, i) => (
                  <circle
                    key={`rec-${i}`}
                    cx={getX(i)}
                    cy={getY(d.receitas)}
                    r="1"
                    fill="#f97316"
                  />
                ))}

                {/* Gradiente */}
                <defs>
                  <linearGradient id="gradientOrange" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Labels dos meses */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 pt-2">
                {dados.map((d) => (
                  <span key={d.mes}>{d.mes}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Resumo em cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#151d32] border border-[#1e2a4a] rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs mb-1">Total Receitas</p>
              <p className="text-xl font-bold text-green-400">{formatarValor(totalReceitas)}</p>
            </div>
            <div className="bg-[#151d32] border border-[#1e2a4a] rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs mb-1">Total Despesas</p>
              <p className="text-xl font-bold text-red-400">{formatarValor(totalDespesas)}</p>
            </div>
            <div className="bg-[#151d32] border border-[#1e2a4a] rounded-xl p-4 text-center">
              <p className="text-gray-500 text-xs mb-1">Saldo</p>
              <p className={`text-xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatarValor(saldo)}</p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
