import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';

// DELETE - Excluir conta futura
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDoc(doc(db, 'planejamento', id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}

// PUT - Atualizar conta futura
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await updateDoc(doc(db, 'planejamento', id), body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
