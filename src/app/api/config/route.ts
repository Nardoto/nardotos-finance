import { NextResponse } from 'next/server';

// Configuração da API - controle de custos
export async function GET() {
  return NextResponse.json({
    modoEconomico: process.env.MODO_ECONOMICO === 'true',
    permitirImagens: process.env.PERMITIR_IMAGENS !== 'false',
  });
}
