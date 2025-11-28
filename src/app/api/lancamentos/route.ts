import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';

// GET - Listar lançamentos
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitCount = parseInt(searchParams.get('limit') || '50');
    const mes = searchParams.get('mes'); // formato: 2025-01

    const lancamentosRef = collection(db, 'lancamentos');
    let q;

    if (mes) {
      const [ano, mesNum] = mes.split('-').map(Number);
      const inicio = new Date(ano, mesNum - 1, 1);
      const fim = new Date(ano, mesNum, 0, 23, 59, 59);

      q = query(
        lancamentosRef,
        where('data', '>=', Timestamp.fromDate(inicio)),
        where('data', '<=', Timestamp.fromDate(fim)),
        orderBy('data', 'desc'),
        limit(limitCount)
      );
    } else {
      // Usando limit simples para evitar necessidade de índice
      q = query(lancamentosRef, limit(limitCount));
    }

    const snapshot = await getDocs(q);
    const lancamentos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      data: doc.data().data?.toDate?.() || doc.data().data,
      criadoEm: doc.data().criadoEm?.toDate?.() || doc.data().criadoEm
    }));

    return NextResponse.json({ lancamentos });
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lançamentos' },
      { status: 500 }
    );
  }
}

// POST - Criar lançamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lancamentos, usuario } = body;

    if (!lancamentos || !Array.isArray(lancamentos)) {
      return NextResponse.json(
        { error: 'Envie um array de lançamentos' },
        { status: 400 }
      );
    }

    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não informado' },
        { status: 400 }
      );
    }

    const lancamentosRef = collection(db, 'lancamentos');
    const categoriasRef = collection(db, 'categorias');
    const salvos = [];

    for (const lancamento of lancamentos) {
      // Verificar/criar categoria
      const categoriasSnapshot = await getDocs(categoriasRef);
      const categoriaExiste = categoriasSnapshot.docs.some(
        doc => doc.data().nome === lancamento.categoria
      );

      if (!categoriaExiste) {
        await addDoc(categoriasRef, {
          nome: lancamento.categoria,
          tipo: lancamento.tipo,
          criadaEm: Timestamp.now()
        });
      }

      // Salvar lançamento
      const docRef = await addDoc(lancamentosRef, {
        tipo: lancamento.tipo,
        valor: lancamento.valor,
        categoria: lancamento.categoria,
        descricao: lancamento.descricao,
        data: Timestamp.fromDate(new Date(lancamento.data)),
        status: lancamento.status,
        usuario: usuario,
        criadoEm: Timestamp.now()
      });

      salvos.push({ id: docRef.id, ...lancamento });
    }

    return NextResponse.json({ salvos });
  } catch (error) {
    console.error('Erro ao salvar lançamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar lançamentos' },
      { status: 500 }
    );
  }
}
