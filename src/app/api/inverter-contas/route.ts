import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Endpoint temporário para inverter contas THARCISIO <-> ESPOSA
export async function POST() {
  try {
    const db = getAdminDb();
    const lancamentosRef = db.collection('lancamentos');

    // Buscar TODOS os lançamentos
    const snapshot = await lancamentosRef.get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'Nenhum lançamento encontrado' });
    }

    const batch = db.batch();
    let trocados = 0;

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const contaAtual = data.conta;

      // Inverter: THARCISIO -> ESPOSA e ESPOSA -> THARCISIO
      if (contaAtual === 'THARCISIO') {
        batch.update(doc.ref, { conta: 'ESPOSA' });
        trocados++;
      } else if (contaAtual === 'ESPOSA') {
        batch.update(doc.ref, { conta: 'THARCISIO' });
        trocados++;
      }
      // EMPRESA permanece como está
    });

    // Executar todas as atualizações
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `${trocados} lançamentos invertidos com sucesso!`,
      detalhes: {
        total: snapshot.docs.length,
        trocados
      }
    });
  } catch (error) {
    console.error('Erro ao inverter contas:', error);
    return NextResponse.json(
      { error: 'Erro ao inverter contas', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
