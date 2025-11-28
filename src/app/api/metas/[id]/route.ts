import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

// DELETE - Excluir meta
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteDoc(doc(db, 'metas', id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir:', error);
    return NextResponse.json({ error: 'Erro ao excluir' }, { status: 500 });
  }
}
