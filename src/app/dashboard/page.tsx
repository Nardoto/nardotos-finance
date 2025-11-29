'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import LineChart from '@/components/LineChart';

interface DadosMensal {
  mes: string;
  mesAno: string;
  receitas: number;
  despesas: number;
  saldo: number;
  lancamentos: number;
  porCategoria: { categoria: string; valor: number }[];
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [dadosMensais, setDadosMensais] = useState<DadosMensal[]>([]);
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
    setCarregando(true);
    try {
      // UMA ÚNICA REQUISIÇÃO! Muito mais rápido!
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDadosMensais(data.meses || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Dados do mês atual (último da lista)
  const mesAtual = dadosMensais[dadosMensais.length - 1];
  const mesAnterior = dadosMensais[dadosMensais.length - 2];

  // Calcular variações (proteção contra divisão por zero)
  const variacaoReceitas = mesAnterior?.receitas ? ((mesAtual?.receitas - mesAnterior.receitas) / mesAnterior.receitas) * 100 : 0;
  const variacaoDespesas = mesAnterior?.despesas ? ((mesAtual?.despesas - mesAnterior.despesas) / mesAnterior.despesas) * 100 : 0;
  const variacaoSaldo = mesAnterior?.saldo ? ((mesAtual?.saldo - mesAnterior.saldo) / Math.abs(mesAnterior.saldo)) * 100 : 0;

  // Média dos últimos 6 meses
  const totalMeses = dadosMensais.length || 1;
  const mediaReceitas = dadosMensais.reduce((acc, d) => acc + d.receitas, 0) / totalMeses;
  const mediaDespesas = dadosMensais.reduce((acc, d) => acc + d.despesas, 0) / totalMeses;
  const mediaSaldo = dadosMensais.reduce((acc, d) => acc + d.saldo, 0) / totalMeses;

  // Cores para categorias
  const cores = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899'];

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-4 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
          <p className="text-gray-500 text-sm">{usuario}</p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={() => router.push('/login')} className="text-gray-500 hover:text-gray-400 text-sm">
            Sair
          </button>
        </div>
      </header>

      {/* Navegação */}
      <div className="flex gap-2 mb-8 text-sm">
        <button onClick={() => router.push('/')} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2 px-3 rounded-lg">
          Lançamentos
        </button>
        <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg font-medium">
          Dashboard
        </button>
        <button onClick={() => router.push('/planejamento')} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2 px-3 rounded-lg">
          Planejar
        </button>
        <button onClick={() => router.push('/categorias')} className="flex-1 border border-gray-700 text-gray-400 hover:text-white py-2 px-3 rounded-lg">
          Categorias
        </button>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Cards principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Card Receitas */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-800/30 p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm mb-1">Receitas do Mês</p>
                <p className="text-3xl font-bold text-green-400 mb-2">{formatarValor(mesAtual?.receitas || 0)}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`${variacaoReceitas >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {variacaoReceitas >= 0 ? '↑' : '↓'} {Math.abs(variacaoReceitas || 0).toFixed(1)}%
                  </span>
                  <span className="text-gray-500">vs mês anterior</span>
                </div>
                <div className="mt-3 pt-3 border-t border-green-800/30">
                  <p className="text-xs text-gray-500">Média 6 meses</p>
                  <p className="text-sm text-gray-400">{formatarValor(mediaReceitas)}</p>
                </div>
              </div>
            </div>

            {/* Card Despesas */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-800/30 p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm mb-1">Despesas do Mês</p>
                <p className="text-3xl font-bold text-red-400 mb-2">{formatarValor(mesAtual?.despesas || 0)}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`${variacaoDespesas <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {variacaoDespesas >= 0 ? '↑' : '↓'} {Math.abs(variacaoDespesas || 0).toFixed(1)}%
                  </span>
                  <span className="text-gray-500">vs mês anterior</span>
                </div>
                <div className="mt-3 pt-3 border-t border-red-800/30">
                  <p className="text-xs text-gray-500">Média 6 meses</p>
                  <p className="text-sm text-gray-400">{formatarValor(mediaDespesas)}</p>
                </div>
              </div>
            </div>

            {/* Card Saldo */}
            <div className={`relative overflow-hidden rounded-xl ${(mesAtual?.saldo || 0) >= 0 ? 'bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-800/30' : 'bg-gradient-to-br from-orange-600/20 to-orange-900/20 border border-orange-800/30'} p-6`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${(mesAtual?.saldo || 0) >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'} rounded-full blur-3xl`}></div>
              <div className="relative z-10">
                <p className="text-gray-400 text-sm mb-1">Saldo do Mês</p>
                <p className={`text-3xl font-bold ${(mesAtual?.saldo || 0) >= 0 ? 'text-blue-400' : 'text-orange-400'} mb-2`}>
                  {formatarValor(mesAtual?.saldo || 0)}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`${variacaoSaldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {variacaoSaldo >= 0 ? '↑' : '↓'} {Math.abs(variacaoSaldo || 0).toFixed(1)}%
                  </span>
                  <span className="text-gray-500">vs mês anterior</span>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-800/30">
                  <p className="text-xs text-gray-500">Média 6 meses</p>
                  <p className="text-sm text-gray-400">{formatarValor(mediaSaldo)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de Evolução */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Evolução Financeira</h3>
              {dadosMensais.length > 0 && (
                <LineChart
                  data={dadosMensais.map(d => ({
                    label: d.mes,
                    value: d.saldo,
                    color: d.saldo >= 0 ? '#3b82f6' : '#f97316'
                  }))}
                  height={280}
                  color="#3b82f6"
                  showGrid={true}
                />
              )}
            </div>

            {/* Despesas por Categoria */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
              {mesAtual?.porCategoria && mesAtual.porCategoria.length > 0 ? (
                <div className="space-y-3">
                  {mesAtual.porCategoria.map((cat, i) => {
                    const percentual = mesAtual.despesas > 0 ? (cat.valor / mesAtual.despesas) * 100 : 0;
                    return (
                      <div key={cat.categoria}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">{cat.categoria}</span>
                          <span className="text-red-400">{formatarValor(cat.valor)}</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${percentual}%`,
                              backgroundColor: cores[i % cores.length]
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{percentual.toFixed(1)}%</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Sem despesas neste mês</p>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Lançamentos do Mês</p>
              <p className="text-2xl font-bold">{mesAtual?.lancamentos || 0}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Maior Receita (média)</p>
              <p className="text-2xl font-bold text-green-400">
                {mesAtual?.lancamentos ? formatarValor(mesAtual.receitas / Math.max(1, mesAtual.lancamentos)) : 'R$ 0'}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Maior Despesa (média)</p>
              <p className="text-2xl font-bold text-red-400">
                {mesAtual?.lancamentos ? formatarValor(mesAtual.despesas / Math.max(1, mesAtual.lancamentos)) : 'R$ 0'}
              </p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Taxa de Poupança</p>
              <p className="text-2xl font-bold text-blue-400">
                {mesAtual?.receitas ? ((mesAtual.saldo / mesAtual.receitas) * 100).toFixed(1) : '0'}%
              </p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
