'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Lancamento {
  id: string;
  tipo: 'RECEITA' | 'DESPESA';
  valor: number;
  categoria: string;
  descricao: string;
  data: string;
  status: 'OK' | 'PENDENTE';
  usuario: string;
}

interface Resumo {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalPendente: number;
  totalLancamentos: number;
  porCategoria: { categoria: string; valor: number }[];
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [mesAtual, setMesAtual] = useState(() => {
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
    }
  }, [router]);

  useEffect(() => {
    if (usuario) {
      carregarDados();
    }
  }, [usuario, mesAtual]);

  const carregarDados = async () => {
    try {
      const [resLancamentos, resResumo] = await Promise.all([
        fetch(`/api/lancamentos?mes=${mesAtual}&limit=100`),
        fetch(`/api/resumo?mes=${mesAtual}`)
      ]);

      const dataLancamentos = await resLancamentos.json();
      const dataResumo = await resResumo.json();

      setLancamentos(dataLancamentos.lancamentos || []);
      setResumo(dataResumo);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarData = (data: string) => new Date(data).toLocaleDateString('pt-BR');

  const getNomeMes = (mesAno: string) => {
    const [ano, mes] = mesAno.split('-');
    const data = new Date(parseInt(ano), parseInt(mes) - 1);
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const mudarMes = (direcao: number) => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const novaData = new Date(ano, mes - 1 + direcao);
    setMesAtual(`${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}`);
  };

  // Calcular dados para gráfico de pizza
  const totalDespesas = resumo?.totalDespesas || 0;
  const cores = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899', '#6b7280'];

  if (!usuario) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <div><h1 className="text-xl font-bold text-white">Nardotos Finance</h1><p className="text-gray-500 text-sm">{usuario}</p></div>
        <button onClick={() => router.push('/login')} className="text-gray-500 hover:text-white text-sm">Sair</button>
      </header>

      {/* Navegacao */}
      <div className="flex gap-2 mb-6 text-sm">
        <button onClick={() => router.push('/')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Lancamentos</button>
        <button className="flex-1 bg-white text-black py-2 px-3 rounded-lg font-medium">Dashboard</button>
        <button onClick={() => router.push('/planejamento')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Planejamento</button>
        <button onClick={() => router.push('/metas')} className="flex-1 border border-gray-700 text-white py-2 px-3 rounded-lg">Metas</button>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        <button onClick={() => mudarMes(-1)} className="text-gray-500 hover:text-white p-2">Anterior</button>
        <h2 className="text-lg font-medium capitalize">{getNomeMes(mesAtual)}</h2>
        <button onClick={() => mudarMes(1)} className="text-gray-500 hover:text-white p-2">Proximo</button>
      </div>

      {resumo && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Receitas</p>
              <p className="text-xl font-bold text-green-500">{formatarValor(resumo.totalReceitas)}</p>
            </div>
            <div className="border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Despesas</p>
              <p className="text-xl font-bold text-red-500">{formatarValor(resumo.totalDespesas)}</p>
            </div>
            <div className="border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Saldo</p>
              <p className={`text-xl font-bold ${resumo.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatarValor(resumo.saldo)}</p>
            </div>
            <div className="border border-gray-800 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Lancamentos</p>
              <p className="text-xl font-bold text-white">{resumo.totalLancamentos}</p>
            </div>
          </div>

          {/* Gráfico de Pizza - Despesas por Categoria */}
          {resumo.porCategoria.length > 0 && (
            <div className="border border-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-gray-500 font-medium mb-4">Despesas por Categoria</h3>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Gráfico SVG */}
                <div className="flex justify-center">
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    {(() => {
                      let acumulado = 0;
                      return resumo.porCategoria.map((cat, i) => {
                        const percentual = (cat.valor / totalDespesas) * 100;
                        const angulo = (percentual / 100) * 360;
                        const startAngle = acumulado;
                        acumulado += angulo;

                        const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                        const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                        const x2 = 100 + 80 * Math.cos((startAngle + angulo - 90) * Math.PI / 180);
                        const y2 = 100 + 80 * Math.sin((startAngle + angulo - 90) * Math.PI / 180);
                        const largeArc = angulo > 180 ? 1 : 0;

                        return (
                          <path
                            key={i}
                            d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={cores[i % cores.length]}
                          />
                        );
                      });
                    })()}
                  </svg>
                </div>
                {/* Legenda */}
                <div className="flex-1 space-y-2">
                  {resumo.porCategoria.map((cat, i) => {
                    const percentual = ((cat.valor / totalDespesas) * 100).toFixed(1);
                    return (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cores[i % cores.length] }} />
                          <span className="text-sm text-white">{cat.categoria}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-red-500">{formatarValor(cat.valor)}</span>
                          <span className="text-xs text-gray-500 ml-2">({percentual}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Lista de Lancamentos */}
      <div>
        <h3 className="text-gray-500 font-medium mb-3">Todos os Lancamentos</h3>
        {lancamentos.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Nenhum lancamento neste mes</p>
        ) : (
          <div className="space-y-2">
            {lancamentos.map((l) => (
              <div key={l.id} className="flex items-center justify-between border border-gray-800 rounded-lg p-3">
                <div>
                  <p className={`font-medium ${l.tipo === 'RECEITA' ? 'text-green-500' : 'text-red-500'}`}>
                    {l.tipo === 'RECEITA' ? '+' : '-'}{formatarValor(l.valor)}
                  </p>
                  <p className="text-sm text-gray-500">{l.categoria}</p>
                  {l.descricao && <p className="text-xs text-gray-600">{l.descricao}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">{formatarData(l.data)}</p>
                  <p className="text-xs text-gray-600">{l.usuario}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
