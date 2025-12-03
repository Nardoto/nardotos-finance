import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// GET - Listar lançamentos
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const searchParams = request.nextUrl.searchParams;
    const limitCount = parseInt(searchParams.get('limit') || '50');
    const mes = searchParams.get('mes'); // formato: 2025-01

    const lancamentosRef = db.collection('lancamentos');
    let q;

    if (mes) {
      const [ano, mesNum] = mes.split('-').map(Number);
      const inicio = new Date(ano, mesNum - 1, 1);
      const fim = new Date(ano, mesNum, 0, 23, 59, 59);

      q = lancamentosRef
        .where('data', '>=', Timestamp.fromDate(inicio))
        .where('data', '<=', Timestamp.fromDate(fim))
        .orderBy('data', 'desc')
        .limit(limitCount);
    } else {
      q = lancamentosRef
        .orderBy('criadoEm', 'desc')
        .limit(limitCount);
    }

    const snapshot = await q.get();
    const lancamentos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        data: data.data?.toDate?.() || data.data,
        criadoEm: data.criadoEm?.toDate?.() || data.criadoEm
      };
    });

    return NextResponse.json({ lancamentos });
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar lançamentos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Criar lançamento
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
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

    const lancamentosRef = db.collection('lancamentos');
    const categoriasRef = db.collection('categorias');
    const salvos = [];

    for (const lancamento of lancamentos) {
      // Verificar/criar categoria
      const categoriasSnapshot = await categoriasRef.where('nome', '==', lancamento.categoria).get();

      if (categoriasSnapshot.empty) {
        await categoriasRef.add({
          nome: lancamento.categoria,
          tipo: lancamento.tipo,
          criadaEm: Timestamp.now()
        });
      }

      // Salvar lançamento
      const docRef = await lancamentosRef.add({
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
      { error: 'Erro ao salvar lançamentos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
