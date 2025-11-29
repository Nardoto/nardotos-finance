import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// PUT - Renomear categoria (atualiza em todos os lançamentos e planejamentos)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ nome: string }> }
) {
  try {
    const { nome } = await params;
    const nomeAntigo = decodeURIComponent(nome).toUpperCase();
    const body = await request.json();
    const novoNome = body.novoNome?.toUpperCase();

    if (!novoNome) {
      return NextResponse.json({ error: 'Novo nome é obrigatório' }, { status: 400 });
    }

    const db = getAdminDb();
    const batch = db.batch();
    let atualizados = 0;

    // Atualizar lançamentos
    const lancamentosSnapshot = await db.collection('lancamentos')
      .where('categoria', '==', nomeAntigo)
      .get();

    lancamentosSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { categoria: novoNome });
      atualizados++;
    });

    // Atualizar planejamentos
    const planejamentosSnapshot = await db.collection('planejamento')
      .where('categoria', '==', nomeAntigo)
      .get();

    planejamentosSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { categoria: novoNome });
      atualizados++;
    });

    // Atualizar tabela de categorias se existir
    const categoriasSnapshot = await db.collection('categorias')
      .where('nome', '==', nomeAntigo)
      .get();

    categoriasSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { nome: novoNome });
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      atualizados,
      mensagem: `Categoria "${nomeAntigo}" renomeada para "${novoNome}" em ${atualizados} registros`
    });
  } catch (error) {
    console.error('Erro ao renomear categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao renomear', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Mesclar categoria com outra (move todos para a categoria destino)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ nome: string }> }
) {
  try {
    const { nome } = await params;
    const categoriaOrigem = decodeURIComponent(nome).toUpperCase();
    const { categoriaDestino } = await request.json();

    if (!categoriaDestino) {
      return NextResponse.json({ error: 'Categoria destino é obrigatória' }, { status: 400 });
    }

    const destino = categoriaDestino.toUpperCase();
    const db = getAdminDb();
    const batch = db.batch();
    let movidos = 0;

    // Mover lançamentos
    const lancamentosSnapshot = await db.collection('lancamentos')
      .where('categoria', '==', categoriaOrigem)
      .get();

    lancamentosSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { categoria: destino });
      movidos++;
    });

    // Mover planejamentos
    const planejamentosSnapshot = await db.collection('planejamento')
      .where('categoria', '==', categoriaOrigem)
      .get();

    planejamentosSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { categoria: destino });
      movidos++;
    });

    // Remover categoria original da tabela de categorias
    const categoriasSnapshot = await db.collection('categorias')
      .where('nome', '==', categoriaOrigem)
      .get();

    categoriasSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      movidos,
      mensagem: `${movidos} registros movidos de "${categoriaOrigem}" para "${destino}"`
    });
  } catch (error) {
    console.error('Erro ao mesclar categoria:', error);
    return NextResponse.json(
      { error: 'Erro ao mesclar', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
