import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// GET - Listar categorias existentes (extraidas dos lancamentos)
export async function GET() {
  try {
    const db = getAdminDb();
    const lancamentosRef = db.collection('lancamentos');
    const snapshot = await lancamentosRef.get();

    const categoriasSet = new Set<string>();

    snapshot.docs.forEach(doc => {
      const categoria = doc.data().categoria;
      if (categoria) {
        categoriasSet.add(categoria.toUpperCase());
      }
    });

    // Categorias padrao caso nao tenha nenhuma
    const categoriasPadrao = [
      'ALIMENTACAO',
      'TRANSPORTE',
      'MORADIA',
      'SAUDE',
      'EDUCACAO',
      'LAZER',
      'VESTUARIO',
      'SERVICOS',
      'OUTROS'
    ];

    // Combinar categorias existentes com padrao
    categoriasPadrao.forEach(cat => categoriasSet.add(cat));

    const categorias = Array.from(categoriasSet).sort();

    return NextResponse.json({ categorias });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar categorias', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
