import { NextRequest, NextResponse } from 'next/server';
import { processarTexto, processarImagem } from '@/lib/gemini';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

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
    const categoriasRef = collection(db, 'categorias');
    const categoriasSnapshot = await getDocs(categoriasRef);
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
      { error: 'Erro ao processar lançamento' },
      { status: 500 }
    );
  }
}
