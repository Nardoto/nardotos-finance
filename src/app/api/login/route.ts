import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usuario, senha } = body;

    if (!usuario || !senha) {
      return NextResponse.json(
        { error: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const usuarioUpper = usuario.toUpperCase();

    // Verificar credenciais (senhas fixas para app pessoal)
    const senhas: Record<string, string> = {
      'THARCISIO': 'tharcisio123',
      'TAMIRES': 'tamires123'
    };

    const senhaCorreta = senhas[usuarioUpper];
    if (!senhaCorreta) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      );
    }

    if (senha !== senhaCorreta) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      );
    }

    // Login bem-sucedido
    return NextResponse.json({
      success: true,
      usuario: usuarioUpper
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
