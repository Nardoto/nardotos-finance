import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

// GET - Listar contas futuras
export async function GET() {
  try {
    const contasRef = collection(db, 'planejamento');
    const q = query(contasRef, orderBy('dataVencimento', 'asc'));
    const snapshot = await getDocs(q);

    const contas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataVencimento: doc.data().dataVencimento?.toDate?.()?.toISOString() || doc.data().dataVencimento
    }));

    return NextResponse.json({ contas });
  } catch (error) {
    console.error('Erro ao buscar contas:', error);
    return NextResponse.json({ error: 'Erro ao buscar contas' }, { status: 500 });
  }
}

// POST - Criar conta futura
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const contasRef = collection(db, 'planejamento');
    const docRef = await addDoc(contasRef, {
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
    return NextResponse.json({ error: 'Erro ao criar conta' }, { status: 500 });
  }
}
