import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// PUT - Atualizar planejamento (marcar como pago)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();
    const body = await request.json();

    const docRef = db.collection('planejamento').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Planejamento não encontrado' }, { status: 404 });
    }

    const dadosAtuais = doc.data();

    // Se está marcando como pago, criar lançamento real
    if (body.paga === true && !dadosAtuais?.paga) {
      const lancamentosRef = db.collection('lancamentos');

      await lancamentosRef.add({
        tipo: dadosAtuais?.tipo || 'DESPESA',
        valor: dadosAtuais?.valor,
        categoria: dadosAtuais?.categoria,
        descricao: dadosAtuais?.descricao,
        data: Timestamp.now(),
        status: 'OK',
        usuario: dadosAtuais?.usuario,
        criadoEm: Timestamp.now(),
        origemPlanejamento: id
      });

      // Se é recorrente, criar próximo planejamento
      if (dadosAtuais?.recorrente) {
        const dataAtual = dadosAtuais?.dataVencimento?.toDate() || new Date();
        const proximaData = new Date(dataAtual);
        proximaData.setMonth(proximaData.getMonth() + 1);

        await db.collection('planejamento').add({
          tipo: dadosAtuais?.tipo,
          descricao: dadosAtuais?.descricao,
          valor: dadosAtuais?.valor,
          dataVencimento: Timestamp.fromDate(proximaData),
          categoria: dadosAtuais?.categoria,
          recorrente: true,
          paga: false,
          usuario: dadosAtuais?.usuario,
          criadoEm: Timestamp.now()
        });
      }
    }

    await docRef.update({
      ...body,
      atualizadoEm: Timestamp.now()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar planejamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Excluir planejamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getAdminDb();

    await db.collection('planejamento').doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir planejamento:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
