import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET - Listar metas
export async function GET() {
  try {
    const db = getAdminDb();
    const metasRef = db.collection('metas');
    const snapshot = await metasRef.get();

    const metas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ metas });
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar metas', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Criar meta
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const metasRef = db.collection('metas');
    const docRef = await metasRef.add({
      tipo: body.tipo || 'DESPESA',
      categoria: body.categoria,
      limite: body.limite,
      mes: body.mes,
      criadoEm: Timestamp.now()
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    return NextResponse.json(
      { error: 'Erro ao criar meta', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
