'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

interface Lancamento {
  id?: string;
  tipo: 'RECEITA' | 'DESPESA';
  valor: number;
  categoria: string;
  descricao: string;
  data: string | Date;
  status: 'OK' | 'PENDENTE';
  conta?: 'EMPRESA' | 'THARCISIO' | 'ESPOSA';
  usuario?: string;
  criadoEm?: string | Date;
}

interface Resumo {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  saldoAnterior: number;
  saldoFinal: number;
}

interface CategoriaResumo {
  categoria: string;
  total: number;
  quantidade: number;
  percentual: number;
}

interface Top5Lancamento {
  id: string;
  valor: number;
  categoria: string;
  descricao: string;
  data: string | Date;
}

interface Insight {
  tipo: 'alerta' | 'positivo' | 'neutro';
  icone: string;
  mensagem: string;
}

interface Orcamento {
  id?: string;
  usuario: string;
  mes: string;
  orcamentoGlobal?: number;
  categorias: Record<string, number>;
}

export default function Home() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [processando, setProcessando] = useState(false);
  const [lancamentosRecentes, setLancamentosRecentes] = useState<Lancamento[]>([]);
  const [lancamentosFiltrados, setLancamentosFiltrados] = useState<Lancamento[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [categoriasResumo, setCategoriasResumo] = useState<CategoriaResumo[]>([]);
  const [top5Gastos, setTop5Gastos] = useState<Top5Lancamento[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [contaSelecionada, setContaSelecionada] = useState<'TODAS' | 'EMPRESA' | 'THARCISIO' | 'ESPOSA'>('TODAS');
  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [lancamentoEdit, setLancamentoEdit] = useState<Lancamento | null>(null);
  const [filtro, setFiltro] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Log de versão para debug
    console.log('%c🚀 Nardotos Finance v3.6 - FASE 3: Orçamento e Metas', 'color: #f97316; font-size: 14px; font-weight: bold');
    console.log('%c💰 Controle de gastos por categoria, barras de progresso visuais', 'color: #10b981; font-size: 12px');

    const usuarioSalvo = localStorage.getItem('usuario');
    if (!usuarioSalvo) {
      router.push('/login');
    } else {
      setUsuario(usuarioSalvo);
      carregarDados();
    }
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, [router]);

  useEffect(() => {
    if (filtro) {
      const termo = filtro.toLowerCase();
      setLancamentosFiltrados(lancamentosRecentes.filter(l =>
        l.categoria.toLowerCase().includes(termo) ||
        l.descricao?.toLowerCase().includes(termo) ||
        l.valor.toString().includes(termo)
      ));
    } else {
      setLancamentosFiltrados(lancamentosRecentes);
    }
  }, [filtro, lancamentosRecentes]);

  // Recarregar dados quando mudar o mês ou conta
  useEffect(() => {
    if (usuario) {
      carregarDados();
    }
  }, [mesSelecionado, contaSelecionada]);

  const carregarDados = async () => {
    try {
      const contaParam = contaSelecionada !== 'TODAS' ? `&conta=${contaSelecionada}` : '';

      const resLancamentos = await fetch(`/api/lancamentos?limit=20&mes=${mesSelecionado}${contaParam}`);
      const dataLancamentos = await resLancamentos.json();
      setLancamentosRecentes(dataLancamentos.lancamentos || []);

      const resResumo = await fetch(`/api/resumo?mes=${mesSelecionado}${contaParam}`);
      const dataResumo = await resResumo.json();
      setResumo(dataResumo);

      // Carregar dados de categorias (apenas do mês selecionado)
      const resCategorias = await fetch(`/api/categorias-resumo?mes=${mesSelecionado}${contaParam}`);
      const dataCategorias = await resCategorias.json();
      setCategoriasResumo(dataCategorias.categorias || []);
      setTop5Gastos(dataCategorias.top5Lancamentos || []);

      // Carregar insights automáticos
      const resInsights = await fetch(`/api/insights?mes=${mesSelecionado}${contaParam}`);
      const dataInsights = await resInsights.json();
      setInsights(dataInsights.insights || []);

      // Carregar orçamento do mês
      if (usuario) {
        const resOrcamento = await fetch(`/api/orcamento?usuario=${usuario}&mes=${mesSelecionado}`);
        const dataOrcamento = await resOrcamento.json();
        setOrcamento(dataOrcamento.orcamento || null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const enviarLancamento = async () => {
    if (!texto.trim()) return;
    setProcessando(true);
    setErro('');
    try {
      const resProcessar = await fetch('/api/processar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });
      const dataProcessar = await resProcessar.json();

      if (dataProcessar.error) {
        setErro(dataProcessar.error);
        return;
      }

      const resSalvar = await fetch('/api/lancamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lancamentos: dataProcessar.lancamentos, usuario }),
      });
      const dataSalvar = await resSalvar.json();

      if (dataSalvar.error) {
        setErro(dataSalvar.error);
      } else {
        setSucesso('Salvo!');
        setTexto('');
        setModalAberto(false);
        carregarDados();
        setTimeout(() => setSucesso(''), 2000);
      }
    } catch (error) {
      setErro('Erro ao processar.');
      console.error(error);
    } finally {
      setProcessando(false);
    }
  };

  const processarCSV = async (file: File) => {
    setProcessando(true);
    setErro('');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result as string;
      try {
        // Envia CSV como texto - usa mesmos tokens que texto normal!
        const resProcessar = await fetch('/api/processar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: `Extraia os lancamentos financeiros deste CSV:\n${csvText}` }),
        });
        const dataProcessar = await resProcessar.json();

        if (dataProcessar.error) {
          setErro(dataProcessar.error);
          return;
        }

        const resSalvar = await fetch('/api/lancamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lancamentos: dataProcessar.lancamentos, usuario }),
        });
        const dataSalvar = await resSalvar.json();

        if (dataSalvar.error) {
          setErro(dataSalvar.error);
        } else {
          setSucesso(dataSalvar.salvos.length + ' lancamento(s) do CSV salvo(s)! (Custo de texto)');
          setModalAberto(false);
          carregarDados();
          setTimeout(() => setSucesso(''), 3000);
        }
      } catch { setErro('Erro ao processar CSV.'); }
      setProcessando(false);
    };
    reader.readAsText(file);
  };

  const processarImagem = async (file: File) => {
    // Aviso de custo alto
    if (!confirm('⚠️ ATENÇÃO: Fotos consomem 10-20x mais tokens que texto!\n\n💡 Alternativa: Exporte seu extrato como CSV para custo MUITO menor.\n\nDeseja continuar com a foto?')) {
      return;
    }

    setProcessando(true);
    setErro('');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      try {
        const resProcessar = await fetch('/api/processar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imagemBase64: base64 }),
        });
        const dataProcessar = await resProcessar.json();

        if (dataProcessar.error) {
          setErro(dataProcessar.error);
          return;
        }

        const resSalvar = await fetch('/api/lancamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lancamentos: dataProcessar.lancamentos, usuario }),
        });
        const dataSalvar = await resSalvar.json();

        if (dataSalvar.error) {
          setErro(dataSalvar.error);
        } else {
          setSucesso(dataSalvar.salvos.length + ' lancamento(s) salvo(s)! (Alto custo - use CSV)');
          setModalAberto(false);
          carregarDados();
          setTimeout(() => setSucesso(''), 3000);
        }
      } catch { setErro('Erro ao processar imagem.'); }
      setProcessando(false);
    };
    reader.readAsDataURL(file);
  };

  const processarArquivo = (file: File) => {
    if (file.name.endsWith('.csv')) {
      processarCSV(file);
    } else {
      processarImagem(file);
    }
  };

  const excluirLancamento = async (id: string) => {
    setDeletando(true);
    try {
      const res = await fetch(`/api/lancamentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConfirmDelete(null);
        carregarDados();
        setSucesso('Excluido!');
        setTimeout(() => setSucesso(''), 2000);
      }
    } catch { setErro('Erro ao excluir.'); }
    finally { setDeletando(false); }
  };

  const iniciarEdicao = (l: Lancamento) => {
    setEditando(l.id || null);
    setLancamentoEdit({ ...l });
  };

  const salvarEdicao = async () => {
    if (!lancamentoEdit || !editando) return;
    setSalvandoEdicao(true);
    try {
      const res = await fetch(`/api/lancamentos/${editando}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lancamentoEdit),
      });
      if (res.ok) {
        setEditando(null);
        setLancamentoEdit(null);
        carregarDados();
        setSucesso('Atualizado!');
        setTimeout(() => setSucesso(''), 2000);
      }
    } catch { setErro('Erro ao atualizar.'); }
    finally { setSalvandoEdicao(false); }
  };

  // Helper para gráfico de pizza
  const getCoordinatesForPercent = (percent: number) => {
    const x = 60 + 50 * Math.cos(2 * Math.PI * percent - Math.PI / 2);
    const y = 60 + 50 * Math.sin(2 * Math.PI * percent - Math.PI / 2);
    return [x, y];
  };

  const formatarValor = (valor: number) => (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarData = (data: string | Date) => new Date(data).toLocaleDateString('pt-BR');
  const formatarDataHora = (data: string | Date) => {
    const d = new Date(data);
    const hoje = new Date();
    const ehHoje = d.toDateString() === hoje.toDateString();
    if (ehHoje) {
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };
  const logout = () => { localStorage.removeItem('usuario'); router.push('/login'); };

  // Funções para navegação de mês
  const mudarMes = (direcao: number) => {
    const [ano, mes] = mesSelecionado.split('-').map(Number);
    const novaData = new Date(ano, mes - 1 + direcao, 1);
    setMesSelecionado(`${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}`);
  };

  const getNomeMes = (mesAno: string) => {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const [ano, mes] = mesAno.split('-');
    return `${meses[parseInt(mes) - 1]} ${ano}`;
  };

  if (!usuario) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;

  return (
    <main className="min-h-screen p-4 max-w-2xl mx-auto pb-20">
      <header className="flex justify-between items-center mb-6">
        <div><h1 className="text-xl font-bold">Nardotos Finance</h1><p className="text-gray-500 text-sm">{usuario}</p></div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={logout} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm">Sair</button>
        </div>
      </header>

      {/* Navegação com abas */}
      <div className="flex border-b border-[#1e2a4a] mb-6 overflow-x-auto">
        <button className="px-4 py-2 text-orange-500 border-b-2 border-orange-500 font-medium whitespace-nowrap">
          Lançamentos
        </button>
        <button onClick={() => router.push('/dashboard')} className="px-4 py-2 text-gray-500 hover:text-orange-400 border-b-2 border-transparent whitespace-nowrap">
          Dashboard
        </button>
        <button onClick={() => router.push('/orcamento')} className="px-4 py-2 text-gray-500 hover:text-orange-400 border-b-2 border-transparent whitespace-nowrap">
          💰 Orçamento
        </button>
        <button onClick={() => router.push('/planejamento')} className="px-4 py-2 text-gray-500 hover:text-orange-400 border-b-2 border-transparent whitespace-nowrap">
          Planejar
        </button>
        <button onClick={() => router.push('/categorias')} className="px-4 py-2 text-gray-500 hover:text-orange-400 border-b-2 border-transparent whitespace-nowrap">
          Categorias
        </button>
      </div>

      {/* Seletor de Mês - Melhorado */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => mudarMes(-1)}
          className="bg-[#151d32] border border-[#1e2a4a] hover:border-orange-500 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 hover:bg-[#1e2a4a]"
        >
          <span className="text-xl">←</span> Anterior
        </button>
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-2 rounded-lg">
          <h2 className="font-bold text-lg text-white text-center min-w-[150px]">{getNomeMes(mesSelecionado)}</h2>
        </div>
        <button
          onClick={() => mudarMes(1)}
          className="bg-[#151d32] border border-[#1e2a4a] hover:border-orange-500 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 hover:bg-[#1e2a4a]"
        >
          Próximo <span className="text-xl">→</span>
        </button>
      </div>

      {/* Filtro de Contas - Discreto */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <span className="text-[10px] text-gray-600 mr-1">Conta:</span>
        <button
          onClick={() => setContaSelecionada('TODAS')}
          className={`px-2 py-1 rounded text-[10px] transition ${
            contaSelecionada === 'TODAS'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setContaSelecionada('EMPRESA')}
          className={`px-2 py-1 rounded text-[10px] transition ${
            contaSelecionada === 'EMPRESA'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          Empresa
        </button>
        <button
          onClick={() => setContaSelecionada('THARCISIO')}
          className={`px-2 py-1 rounded text-[10px] transition ${
            contaSelecionada === 'THARCISIO'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          Tharcisio
        </button>
        <button
          onClick={() => setContaSelecionada('ESPOSA')}
          className={`px-2 py-1 rounded text-[10px] transition ${
            contaSelecionada === 'ESPOSA'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
              : 'text-gray-600 hover:text-gray-400'
          }`}
        >
          Tamires
        </button>
      </div>

      {/* Fluxo de Caixa - Card Principal */}
      {resumo && (
        <div className="border-2 border-orange-500 rounded-xl p-4 mb-6 bg-gradient-to-br from-[#151d32] to-[#0f1629]">
          <h3 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
            <span>💰</span> Fluxo de Caixa
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Saldo Anterior</span>
              <span className={`font-bold ${resumo.saldoAnterior >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                {formatarValor(resumo.saldoAnterior)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">+ Receitas {getNomeMes(mesSelecionado).split(' ')[0]}</span>
              <span className="font-bold text-green-400">+{formatarValor(resumo.totalReceitas)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">- Despesas {getNomeMes(mesSelecionado).split(' ')[0]}</span>
              <span className="font-bold text-red-400">-{formatarValor(resumo.totalDespesas)}</span>
            </div>
            <div className="border-t border-[#1e2a4a] pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">= Saldo Atual</span>
                <span className={`text-2xl font-bold ${resumo.saldoFinal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatarValor(resumo.saldoFinal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insights Automáticos */}
      {insights.length > 0 && (
        <div className="border border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
            <span>🤖</span> Insights Automáticos
          </h3>
          <div className="space-y-2">
            {insights.map((insight, index) => {
              let corTexto = 'text-gray-300';
              let corBorda = 'border-gray-700';

              if (insight.tipo === 'alerta') {
                corTexto = 'text-yellow-300';
                corBorda = 'border-yellow-500/30';
              } else if (insight.tipo === 'positivo') {
                corTexto = 'text-green-300';
                corBorda = 'border-green-500/30';
              }

              return (
                <div
                  key={index}
                  className={`flex items-start gap-2 p-2 rounded-lg border ${corBorda} bg-[#0f1629]/50`}
                >
                  <span className="text-lg">{insight.icone}</span>
                  <p className={`text-sm ${corTexto} flex-1`}>{insight.mensagem}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gráficos e Insights */}
      {categoriasResumo.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Gráfico de Pizza - Gastos por Categoria */}
          <div className="border border-[#1e2a4a] rounded-xl p-4 bg-[#151d32]">
            <h3 className="text-sm font-medium text-gray-400 mb-3">📊 Despesas por Categoria</h3>
            <div className="flex items-center gap-4">
              {/* Pizza Chart SVG */}
              <svg width="120" height="120" viewBox="0 0 120 120" className="flex-shrink-0">
                {(() => {
                  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']; // vermelho, azul, verde, amarelo, roxo
                  let cumulativePercent = 0;
                  const top5 = categoriasResumo.filter(c => c.total > 0).slice(0, 5);

                  return top5.map((cat, index) => {
                    const [x, y] = getCoordinatesForPercent(cumulativePercent);
                    cumulativePercent += cat.percentual / 100;
                    const [nextX, nextY] = getCoordinatesForPercent(cumulativePercent);
                    const largeArcFlag = cat.percentual > 50 ? 1 : 0;

                    const pathData = [
                      `M 60 60`,
                      `L ${x} ${y}`,
                      `A 50 50 0 ${largeArcFlag} 1 ${nextX} ${nextY}`,
                      `Z`
                    ].join(' ');

                    return <path key={cat.categoria} d={pathData} fill={colors[index % colors.length]} />;
                  });
                })()}
              </svg>

              {/* Legenda */}
              <div className="flex-1 space-y-1">
                {categoriasResumo.filter(c => c.total > 0).slice(0, 5).map((cat, index) => {
                  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']; // vermelho, azul, verde, amarelo, roxo
                  return (
                    <div key={cat.categoria} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: colors[index % colors.length] }}></div>
                        <span className="text-gray-400 truncate max-w-[100px]">{cat.categoria}</span>
                      </div>
                      <span className="text-white font-medium">{cat.percentual.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Barras de Progresso de Orçamento */}
            {orcamento && Object.keys(orcamento.categorias).length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#1e2a4a]">
                <h4 className="text-[10px] text-gray-500 mb-2 uppercase">Orçamento vs Gasto</h4>
                <div className="space-y-2">
                  {categoriasResumo.filter(c => orcamento.categorias[c.categoria]).map(cat => {
                    const limite = orcamento.categorias[cat.categoria];
                    const percentual = (cat.total / limite) * 100;
                    let corBarra = '#10b981'; // verde
                    let corTexto = 'text-green-400';

                    if (percentual >= 100) {
                      corBarra = '#ef4444'; // vermelho
                      corTexto = 'text-red-400';
                    } else if (percentual >= 80) {
                      corBarra = '#f59e0b'; // amarelo
                      corTexto = 'text-yellow-400';
                    }

                    return (
                      <div key={cat.categoria}>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-gray-500">{cat.categoria}</span>
                          <span className={`font-medium ${corTexto}`}>
                            {formatarValor(cat.total)} / {formatarValor(limite)}
                          </span>
                        </div>
                        <div className="h-2 bg-[#0f1629] rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500 rounded-full"
                            style={{
                              width: `${Math.min(percentual, 100)}%`,
                              backgroundColor: corBarra
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Top 5 Maiores Gastos */}
          <div className="border border-[#1e2a4a] rounded-xl p-4 bg-[#151d32]">
            <h3 className="text-sm font-medium text-gray-400 mb-3">🔥 Top 5 Maiores Gastos</h3>
            <div className="space-y-2">
              {top5Gastos.length === 0 ? (
                <p className="text-xs text-gray-600 text-center py-4">Nenhum gasto registrado</p>
              ) : (
                top5Gastos.map((lanc, index) => (
                  <div key={lanc.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-orange-500 font-bold">{index + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{lanc.descricao || lanc.categoria}</p>
                        <p className="text-gray-500 text-[10px]">{lanc.categoria}</p>
                      </div>
                    </div>
                    <span className="text-red-400 font-bold ml-2">{formatarValor(lanc.valor)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Comparação Receitas vs Despesas */}
      {resumo && (
        <div className="border border-[#1e2a4a] rounded-xl p-4 mb-6 bg-[#151d32]">
          <h3 className="text-sm font-medium text-gray-400 mb-4">📊 Receitas vs Despesas</h3>
          <div className="space-y-3">
            {/* Receitas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Receitas</span>
                <span className="text-sm font-bold text-green-400">{formatarValor(resumo.totalReceitas)}</span>
              </div>
              <div className="h-8 bg-[#0f1629] rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-600 to-green-400 flex items-center justify-end pr-2 transition-all duration-500"
                  style={{ width: `${resumo.totalReceitas > 0 ? Math.min((resumo.totalReceitas / Math.max(resumo.totalReceitas, resumo.totalDespesas)) * 100, 100) : 0}%` }}
                >
                  <span className="text-white text-xs font-bold">{resumo.totalReceitas > 0 ? '💰' : ''}</span>
                </div>
              </div>
            </div>

            {/* Despesas */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Despesas</span>
                <span className="text-sm font-bold text-red-400">{formatarValor(resumo.totalDespesas)}</span>
              </div>
              <div className="h-8 bg-[#0f1629] rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 flex items-center justify-end pr-2 transition-all duration-500"
                  style={{ width: `${resumo.totalDespesas > 0 ? Math.min((resumo.totalDespesas / Math.max(resumo.totalReceitas, resumo.totalDespesas)) * 100, 100) : 0}%` }}
                >
                  <span className="text-white text-xs font-bold">{resumo.totalDespesas > 0 ? '💸' : ''}</span>
                </div>
              </div>
            </div>

            {/* Saldo */}
            <div className="pt-2 border-t border-[#1e2a4a]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Saldo do Mês</span>
                <span className={`text-lg font-bold ${resumo.saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {resumo.saldo >= 0 ? '↑' : '↓'} {formatarValor(Math.abs(resumo.saldo))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão Flutuante (FAB) para Mobile */}
      <button
        onClick={() => setModalAberto(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-orange-600 to-orange-500 rounded-full shadow-lg flex items-center justify-center text-white text-3xl font-bold hover:scale-110 transition-transform z-40"
        title="Adicionar lançamento"
      >
        +
      </button>

      {/* Modal de Lançamento */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#151d32] border-t sm:border border-[#1e2a4a] rounded-t-3xl sm:rounded-xl p-6 w-full sm:max-w-md sm:w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Novo Lançamento</h3>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ex: Gastei 45 no mercado"
              className="w-full bg-[#0f1629] border border-[#1e2a4a] rounded-xl p-3 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-orange-500/50 mb-3"
              rows={3}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarLancamento(); } }}
              autoFocus
            />

            <div className="flex flex-col gap-2">
              <button
                onClick={enviarLancamento}
                disabled={processando || !texto.trim()}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-[#1e2a4a] disabled:text-gray-500 text-white font-medium py-3 px-4 rounded-xl transition"
              >
                {processando ? 'Salvando...' : 'Enviar'}
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={processando}
                className="w-full border border-[#1e2a4a] hover:border-orange-500/50 disabled:border-[#1e2a4a] disabled:text-gray-500 text-white font-medium py-3 px-4 rounded-xl transition"
              >
                📎 Importar CSV/Foto
              </button>

              <input ref={fileInputRef} type="file" accept=".csv,image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) processarArquivo(file); }} />
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">💡 Use CSV do banco (grátis) ao invés de foto (20x mais caro)</p>
          </div>
        </div>
      )}

      {erro && <div className="border border-red-800 text-red-400 rounded-lg p-3 mb-4">{erro}</div>}
      {sucesso && <div className="border border-green-800 text-green-400 rounded-lg p-3 mb-4">{sucesso}</div>}

      {/* Filtro */}
      <div className="mb-4">
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por categoria, descricao ou valor..."
          className="w-full bg-[#151d32] border border-[#1e2a4a] rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
        />
      </div>

      {/* Modal de confirmacao */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#151d32] border border-[#1e2a4a] rounded-xl p-6 max-w-sm w-full">
            <p className="text-white mb-4">Tem certeza que deseja excluir este lancamento?</p>
            <div className="flex gap-2">
              <button onClick={() => excluirLancamento(confirmDelete)} className="flex-1 bg-red-600 text-white py-2 rounded-xl">Excluir</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-[#1e2a4a] text-white py-2 rounded-xl">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-gray-500 font-medium mb-3">Lancamentos ({lancamentosFiltrados.length})</h3>
        {lancamentosFiltrados.length === 0 ? <p className="text-gray-600 text-center py-8">Nenhum lancamento encontrado</p> : (
          <div className="space-y-2">
            {lancamentosFiltrados.map((l) => (
              <div key={l.id} className="border border-[#1e2a4a] rounded-xl p-3 bg-[#151d32]">
                {editando === l.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select value={lancamentoEdit?.tipo} onChange={(e) => setLancamentoEdit(prev => prev ? {...prev, tipo: e.target.value as 'RECEITA' | 'DESPESA'} : null)} className="bg-[#0f1629] border border-[#1e2a4a] rounded-xl p-2 text-white">
                        <option value="DESPESA">Despesa</option>
                        <option value="RECEITA">Receita</option>
                      </select>
                      <input type="number" value={lancamentoEdit?.valor} onChange={(e) => setLancamentoEdit(prev => prev ? {...prev, valor: Number(e.target.value)} : null)} className="flex-1 bg-[#0f1629] border border-[#1e2a4a] rounded-xl p-2 text-white" />
                    </div>
                    <input value={lancamentoEdit?.categoria} onChange={(e) => setLancamentoEdit(prev => prev ? {...prev, categoria: e.target.value.toUpperCase()} : null)} className="w-full bg-[#0f1629] border border-[#1e2a4a] rounded-xl p-2 text-white" placeholder="Categoria" />
                    <input value={lancamentoEdit?.descricao} onChange={(e) => setLancamentoEdit(prev => prev ? {...prev, descricao: e.target.value} : null)} className="w-full bg-[#0f1629] border border-[#1e2a4a] rounded-xl p-2 text-white" placeholder="Descricao" />
                    <div className="flex gap-2">
                      <button onClick={salvarEdicao} className="flex-1 bg-orange-500 text-white py-2 rounded-xl">Salvar</button>
                      <button onClick={() => { setEditando(null); setLancamentoEdit(null); }} className="flex-1 border border-[#1e2a4a] text-white py-2 rounded-xl">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={"font-medium " + (l.tipo === 'RECEITA' ? 'text-green-400' : 'text-red-400')}>{l.tipo === 'RECEITA' ? '+' : '-'}{formatarValor(l.valor)}</p>
                      <p className="text-sm text-gray-400">{l.categoria}</p>
                      {l.descricao && <p className="text-xs text-gray-500">{l.descricao}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatarData(l.data)}</p>
                        <p className="text-xs text-gray-600">{l.usuario}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => iniciarEdicao(l)} className="text-gray-500 hover:text-orange-400 text-sm px-2">Editar</button>
                        <button onClick={() => setConfirmDelete(l.id || null)} className="text-gray-500 hover:text-red-400 text-sm px-2">X</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Indicador de versão */}
      <div className="fixed bottom-2 left-2 text-[10px] text-gray-600 bg-[#0f1629] px-2 py-1 rounded border border-[#1e2a4a]">
        v3.6 • {new Date().toISOString().split('T')[0]}
      </div>
    </main>
  );
}
