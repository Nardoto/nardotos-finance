import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// GET - Listar categorias existentes (extraidas dos lancamentos)
export async function GET() {
  try {
    const lancamentosRef = collection(db, 'lancamentos');
    const snapshot = await getDocs(lancamentosRef);

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
    return NextResponse.json({ error: 'Erro ao buscar categorias' }, { status: 500 });
  }
}
