import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, Timestamp } from 'firebase/firestore';

// GET - Listar metas
export async function GET() {
  try {
    const metasRef = collection(db, 'metas');
    const q = query(metasRef);
    const snapshot = await getDocs(q);

    const metas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ metas });
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return NextResponse.json({ error: 'Erro ao buscar metas' }, { status: 500 });
  }
}

// POST - Criar meta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const metasRef = collection(db, 'metas');
    const docRef = await addDoc(metasRef, {
      tipo: body.tipo || 'DESPESA',
      categoria: body.categoria,
      limite: body.limite,
      mes: body.mes,
      criadoEm: Timestamp.now()
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    return NextResponse.json({ error: 'Erro ao criar meta' }, { status: 500 });
  }
}
