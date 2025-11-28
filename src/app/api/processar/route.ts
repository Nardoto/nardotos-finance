import { NextRequest, NextResponse } from 'next/server';
import { processarTexto, processarImagem } from '@/lib/gemini';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { texto, imagemBase64 } = body;

    if (!texto && !imagemBase64) {
      return NextResponse.json(
        { error: 'Envie um texto ou imagem' },
        { status: 400 }
      );
    }

    // Buscar categorias existentes
    const db = getAdminDb();
    const categoriasSnapshot = await db.collection('categorias').get();
    const categoriasExistentes = categoriasSnapshot.docs.map(doc => doc.data().nome);

    let lancamentos;

    if (imagemBase64) {
      lancamentos = await processarImagem(imagemBase64, categoriasExistentes);
    } else {
      lancamentos = await processarTexto(texto, categoriasExistentes);
    }

    return NextResponse.json({ lancamentos });
  } catch (error) {
    console.error('Erro ao processar:', error);
    return NextResponse.json(
      { error: 'Erro ao processar lançamento', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
