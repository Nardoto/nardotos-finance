import { NextRequest, NextResponse } from 'next/server';
import { processarPlanejamento } from '@/lib/gemini';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { texto } = body;

    if (!texto) {
      return NextResponse.json(
        { error: 'Envie um texto' },
        { status: 400 }
      );
    }

    // Buscar categorias existentes
    const db = getAdminDb();
    const categoriasSnapshot = await db.collection('categorias').get();
    const categoriasExistentes = categoriasSnapshot.docs.map(doc => doc.data().nome);

    const planejamentos = await processarPlanejamento(texto, categoriasExistentes);

    return NextResponse.json({ planejamentos });
  } catch (error) {
    console.error('Erro ao processar planejamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar planejamento', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
