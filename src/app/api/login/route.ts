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

    // Verificar credenciais
    let senhaCorreta = '';
    if (usuarioUpper === 'THARCISIO') {
      senhaCorreta = process.env.USER_THARCISIO_PASSWORD || 'tharcisio123';
    } else if (usuarioUpper === 'TAMIRES') {
      senhaCorreta = process.env.USER_TAMIRES_PASSWORD || 'tamires123';
    } else {
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
