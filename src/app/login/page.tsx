'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha }),
      });

      const data = await res.json();

      if (data.error) {
        setErro(data.error);
      } else {
        localStorage.setItem('usuario', data.usuario);
        router.push('/');
      }
    } catch {
      setErro('Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  const selecionarUsuario = (nome: string) => {
    setUsuario(nome);
    setErro('');
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Nardotos Finance</h1>
          <p className="text-gray-500 text-sm">Controle financeiro</p>
        </div>

        <form onSubmit={handleLogin} className="border border-gray-800 rounded-lg p-6">
          <div className="mb-4">
            <label className="block text-gray-500 text-sm mb-2">Quem e voce?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selecionarUsuario('THARCISIO')}
                className={`p-4 rounded-lg border transition ${
                  usuario === 'THARCISIO'
                    ? 'border-white bg-white text-black'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                Tharcisio
              </button>
              <button
                type="button"
                onClick={() => selecionarUsuario('TAMIRES')}
                className={`p-4 rounded-lg border transition ${
                  usuario === 'TAMIRES'
                    ? 'border-white bg-white text-black'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                Tamires
              </button>
            </div>
          </div>

          {usuario && (
            <div className="mb-4">
              <label className="block text-gray-500 text-sm mb-2">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-white"
                placeholder="Digite sua senha"
                autoFocus
              />
            </div>
          )}

          {erro && (
            <div className="border border-gray-700 text-gray-400 rounded-lg p-3 mb-4 text-sm">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={!usuario || !senha || carregando}
            className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 text-black font-medium py-3 px-4 rounded-lg transition"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
