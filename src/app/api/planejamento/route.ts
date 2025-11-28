import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET - Listar contas futuras
export async function GET() {
  try {
    const db = getAdminDb();
    const contasRef = db.collection('planejamento');
    const snapshot = await contasRef.orderBy('dataVencimento', 'asc').get();

    const contas = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dataVencimento: data.dataVencimento?.toDate?.()?.toISOString() || data.dataVencimento
      };
    });

    return NextResponse.json({ contas });
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contas', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Criar conta futura
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();

    const contasRef = db.collection('planejamento');
    const docRef = await contasRef.add({
      tipo: body.tipo || 'DESPESA',
      descricao: body.descricao,
      valor: body.valor,
      dataVencimento: Timestamp.fromDate(new Date(body.dataVencimento)),
      categoria: body.categoria,
      recorrente: body.recorrente || false,
      paga: false,
      usuario: body.usuario,
      criadoEm: Timestamp.now()
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
