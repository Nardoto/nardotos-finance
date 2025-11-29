'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

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

  // Calcular máximo para escala das barras
  const maxValor = Math.max(...dados.flatMap(d => [d.receitas, d.despesas]), 1);

  // Totais
  const totalReceitas = dados.reduce((acc, d) => acc + d.receitas, 0);
  const totalDespesas = dados.reduce((acc, d) => acc + d.despesas, 0);
  const saldo = totalReceitas - totalDespesas;

  if (!usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
          <button onClick={() => router.push('/login')} className="text-gray-500 text-sm">Sair</button>
        </div>
      </header>

      {/* Navegação com abas */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button onClick={() => router.push('/')} className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent">
          Lançamentos
        </button>
        <button className="px-4 py-2 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 font-medium">
          Dashboard
        </button>
        <button onClick={() => router.push('/planejamento')} className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent">
          Planejar
        </button>
        <button onClick={() => router.push('/categorias')} className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent">
          Categorias
        </button>
      </div>

      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-xs mb-1">Total Receitas</p>
              <p className="text-xl font-bold text-green-400">{formatarValor(totalReceitas)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-xs mb-1">Total Despesas</p>
              <p className="text-xl font-bold text-red-400">{formatarValor(totalDespesas)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-500 text-xs mb-1">Saldo</p>
              <p className={`text-xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatarValor(saldo)}</p>
            </div>
          </div>

          {/* Gráfico simples de barras */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="font-medium">Últimos 6 meses</h3>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> Receitas</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> Despesas</span>
              </div>
            </div>

            <div className="space-y-4">
              {dados.map((d) => (
                <div key={d.mes} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 w-12">{d.mes}</span>
                    <div className="flex gap-4 text-xs">
                      <span className="text-green-400">{formatarValor(d.receitas)}</span>
                      <span className="text-red-400">{formatarValor(d.despesas)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 h-4">
                    {/* Barra Receita */}
                    <div
                      className="bg-green-500 rounded-sm h-full transition-all"
                      style={{ width: `${(d.receitas / maxValor) * 50}%` }}
                    />
                    {/* Barra Despesa */}
                    <div
                      className="bg-red-500 rounded-sm h-full transition-all"
                      style={{ width: `${(d.despesas / maxValor) * 50}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
