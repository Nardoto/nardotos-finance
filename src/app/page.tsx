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
  usuario?: string;
  criadoEm?: string | Date;
}

interface Resumo {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}

export default function Home() {
  const [usuario, setUsuario] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [processando, setProcessando] = useState(false);
  const [lancamentosRecentes, setLancamentosRecentes] = useState<Lancamento[]>([]);
  const [lancamentosFiltrados, setLancamentosFiltrados] = useState<Lancamento[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [lancamentoEdit, setLancamentoEdit] = useState<Lancamento | null>(null);
  const [filtro, setFiltro] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
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

  const carregarDados = async () => {
    try {
      const resLancamentos = await fetch('/api/lancamentos?limit=20');
      const dataLancamentos = await resLancamentos.json();
      setLancamentosRecentes(dataLancamentos.lancamentos || []);
      const resResumo = await fetch('/api/resumo');
      const dataResumo = await resResumo.json();
      setResumo(dataResumo);
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

  const formatarValor = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

      {/* Navegacao */}
      <div className="flex gap-2 mb-6 text-sm">
        <button className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-black py-2 px-3 rounded-lg font-medium">Lancamentos</button>
        <button onClick={() => router.push('/dashboard')} className="flex-1 border border-gray-300 dark:border-gray-700 py-2 px-3 rounded-lg">Dashboard</button>
        <button onClick={() => router.push('/planejamento')} className="flex-1 border border-gray-300 dark:border-gray-700 py-2 px-3 rounded-lg">Planejar</button>
        <button onClick={() => router.push('/categorias')} className="flex-1 border border-gray-300 dark:border-gray-700 py-2 px-3 rounded-lg">Categorias</button>
      </div>

      {resumo && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="border border-gray-300 dark:border-gray-800 rounded-lg p-3 text-center bg-white dark:bg-transparent"><p className="text-xs text-gray-500">Receitas</p><p className="text-lg font-bold text-green-600 dark:text-green-400">{formatarValor(resumo.totalReceitas)}</p></div>
          <div className="border border-gray-300 dark:border-gray-800 rounded-lg p-3 text-center bg-white dark:bg-transparent"><p className="text-xs text-gray-500">Despesas</p><p className="text-lg font-bold text-red-600 dark:text-red-400">{formatarValor(resumo.totalDespesas)}</p></div>
          <div className="border border-gray-300 dark:border-gray-800 rounded-lg p-3 text-center bg-white dark:bg-transparent"><p className="text-xs text-gray-500">Saldo</p><p className={"text-lg font-bold " + (resumo.saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>{formatarValor(resumo.saldo)}</p></div>
        </div>
      )}

      <div className="border border-gray-800 rounded-lg p-4 mb-6">
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex: Gastei 45 no mercado" className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white placeholder-gray-600 resize-none focus:outline-none focus:border-white" rows={2} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarLancamento(); } }} />
        <div className="flex gap-2 mt-3">
          <button onClick={enviarLancamento} disabled={processando || !texto.trim()} className="flex-1 bg-white hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 text-black font-medium py-2 px-4 rounded-lg transition">{processando ? 'Salvando...' : 'Enviar'}</button>
          <button onClick={() => fileInputRef.current?.click()} disabled={processando} className="border border-gray-700 hover:border-white disabled:border-gray-800 disabled:text-gray-500 text-white font-medium py-2 px-4 rounded-lg transition" title="CSV = barato | Foto = 20x mais caro">Extrato CSV/Foto</button>
          <input ref={fileInputRef} type="file" accept=".csv,image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) processarArquivo(file); }} />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">💡 Use CSV do banco (grátis) ao invés de foto (20x mais caro)</p>
      </div>

      {erro && <div className="border border-red-800 text-red-400 rounded-lg p-3 mb-4">{erro}</div>}
      {sucesso && <div className="border border-green-800 text-green-400 rounded-lg p-3 mb-4">{sucesso}</div>}

      {/* Filtro */}
      <div className="mb-4">
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por categoria, descricao ou valor..."
          className="w-full bg-black border border-gray-800 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-white"
        />
      </div>

      {/* Modal de confirmacao */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full">
            <p className="text-white mb-4">Tem certeza que deseja excluir este lancamento?</p>
            <div className="flex gap-2">
              <button onClick={() => excluirLancamento(confirmDelete)} className="flex-1 bg-red-600 text-white py-2 rounded-lg">Excluir</button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-700 text-white py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-gray-500 font-medium mb-3">Lancamentos ({lancamentosFiltrados.length})</h3>
        {lancamentosFiltrados.length === 0 ? <p className="text-gray-600 text-center py-8">Nenhum lancamento encontrado</p> : (
          <div className="space-y-2">
            {lancamentosFiltrados.map((l) => (
              <div key={l.id} className="border border-gray-800 rounded-lg p-3">
                {editando === l.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select value={lancamentoEdit?.tipo} onChange={(e) => setLancamentoEdit(prev => prev ? {...prev, tipo: e.target.value as 'RECEITA' | 'DESPESA'} : null)} className="bg-black border border-gray-700 rounded p-2 text-white">
                        <option value="DESPESA">Despesa</option>
                        <option value="RECEITA">Receita</option>
                      </select>
                      <input type="number" value={lancamentoEdit?.valor} onChange={(e) => setLancamentoEdit(prev => prev ? {...prev, valor: Number(e.target.value)} : null)} className="flex-1 bg-black border border-gray-700 rounded p-2 text-white" />
                    </div>
                    <input value={lancamentoEdit?.categoria} onChange={(e) => setLancamentoEdit(prev => prev ? {...prev, categoria: e.target.value.toUpperCase()} : null)} className="w-full bg-black border border-gray-700 rounded p-2 text-white" placeholder="Categoria" />
                    <input value={lancamentoEdit?.descricao} onChange={(e) => setLancamentoEdit(prev => prev ? {...prev, descricao: e.target.value} : null)} className="w-full bg-black border border-gray-700 rounded p-2 text-white" placeholder="Descricao" />
                    <div className="flex gap-2">
                      <button onClick={salvarEdicao} className="flex-1 bg-white text-black py-2 rounded">Salvar</button>
                      <button onClick={() => { setEditando(null); setLancamentoEdit(null); }} className="flex-1 border border-gray-700 text-white py-2 rounded">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={"font-medium " + (l.tipo === 'RECEITA' ? 'text-green-500' : 'text-red-500')}>{l.tipo === 'RECEITA' ? '+' : '-'}{formatarValor(l.valor)}</p>
                      <p className="text-sm text-gray-500">{l.categoria}</p>
                      {l.descricao && <p className="text-xs text-gray-600">{l.descricao}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-gray-600">{formatarData(l.data)}</p>
                        <p className="text-xs text-gray-600">{l.usuario}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => iniciarEdicao(l)} className="text-gray-500 hover:text-white text-sm px-2">Editar</button>
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
    </main>
  );
}
