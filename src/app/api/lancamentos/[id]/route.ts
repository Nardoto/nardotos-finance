import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';

// DELETE - Excluir lançamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDoc(doc(db, 'lancamentos', id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}

// PUT - Atualizar lançamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      tipo: body.tipo,
      valor: body.valor,
      categoria: body.categoria,
      descricao: body.descricao,
      status: body.status || 'OK',
      atualizadoEm: Timestamp.now()
    };

    if (body.data) {
      updateData.data = Timestamp.fromDate(new Date(body.data));
    }

    await updateDoc(doc(db, 'lancamentos', id), updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
