import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';

export async function GET() {
  const startTime = Date.now();
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    // Teste 1: Verificar configuração
    (results.steps as string[]).push('1. Iniciando teste...');

    // Teste 2: Listar coleção
    const step2Start = Date.now();
    const lancamentosRef = collection(db, 'lancamentos');
    const snapshot = await getDocs(lancamentosRef);
    (results.steps as string[]).push(`2. getDocs levou ${Date.now() - step2Start}ms - encontrou ${snapshot.size} docs`);

    // Teste 3: Tentar adicionar documento
    const step3Start = Date.now();
    const docRef = await addDoc(collection(db, 'test'), {
      teste: true,
      criadoEm: Timestamp.now()
    });
    (results.steps as string[]).push(`3. addDoc levou ${Date.now() - step3Start}ms - id: ${docRef.id}`);

    results.success = true;
    results.totalTime = `${Date.now() - startTime}ms`;

    return NextResponse.json(results);
  } catch (error) {
    results.success = false;
    results.error = error instanceof Error ? error.message : String(error);
    results.totalTime = `${Date.now() - startTime}ms`;

    return NextResponse.json(results, { status: 500 });
  }
}
