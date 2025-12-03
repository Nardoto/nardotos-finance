import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export interface Orcamento {
  id?: string;
  usuario: string;
  mes: string; // formato: 2025-12
  orcamentoGlobal?: number; // limite total mensal
  categorias: Record<string, number>; // { "ALIMENTACAO": 500, "GASOLINA": 300 }
  criadoEm?: Date;
  atualizadoEm?: Date;
}

// GET - Buscar orçamento do mês
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const searchParams = request.nextUrl.searchParams;
    const mes = searchParams.get('mes'); // formato: 2025-12
    const usuario = searchParams.get('usuario');

    if (!mes || !usuario) {
      return NextResponse.json(
        { error: 'Mês e usuário são obrigatórios' },
        { status: 400 }
      );
    }

    const orcamentosRef = db.collection('orcamentos');
    const snapshot = await orcamentosRef
      .where('mes', '==', mes)
      .where('usuario', '==', usuario)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        orcamento: null
      });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return NextResponse.json({
      orcamento: {
        id: doc.id,
        usuario: data.usuario,
        mes: data.mes,
        orcamentoGlobal: data.orcamentoGlobal || null,
        categorias: data.categorias || {},
        criadoEm: data.criadoEm?.toDate?.() || data.criadoEm,
        atualizadoEm: data.atualizadoEm?.toDate?.() || data.atualizadoEm
      }
    });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar orçamento', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar orçamento
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb();
    const body = await request.json();
    const { usuario, mes, orcamentoGlobal, categorias } = body;

    if (!usuario || !mes) {
      return NextResponse.json(
        { error: 'Usuário e mês são obrigatórios' },
        { status: 400 }
      );
    }

    const orcamentosRef = db.collection('orcamentos');

    // Verificar se já existe orçamento para este mês/usuário
    const snapshot = await orcamentosRef
      .where('mes', '==', mes)
      .where('usuario', '==', usuario)
      .limit(1)
      .get();

    const now = new Date();

    if (snapshot.empty) {
      // Criar novo
      const docRef = await orcamentosRef.add({
        usuario,
        mes,
        orcamentoGlobal: orcamentoGlobal || null,
        categorias: categorias || {},
        criadoEm: now,
        atualizadoEm: now
      });

      return NextResponse.json({
        id: docRef.id,
        message: 'Orçamento criado com sucesso'
      });
    } else {
      // Atualizar existente
      const docId = snapshot.docs[0].id;
      await orcamentosRef.doc(docId).update({
        orcamentoGlobal: orcamentoGlobal || null,
        categorias: categorias || {},
        atualizadoEm: now
      });

      return NextResponse.json({
        id: docId,
        message: 'Orçamento atualizado com sucesso'
      });
    }
  } catch (error) {
    console.error('Erro ao salvar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar orçamento', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
