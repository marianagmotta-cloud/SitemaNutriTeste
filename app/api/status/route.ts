import { NextResponse } from 'next/server';
import { isLiveDatabaseConnected, initPostgresTablesIfNeeded } from '@/lib/db';

export async function GET() {
  try {
    const isLive = await isLiveDatabaseConnected();
    return NextResponse.json({
      connected: isLive,
      mode: isLive ? 'Vercel Postgres (Conexão Ativa)' : 'Armazenamento de Demonstração (Fallback)',
      environment: process.env.NODE_ENV || 'production',
      hasPostgresUrl: !!(process.env.POSTGRES_URL || process.env.DATABASE_URL),
    });
  } catch (e: any) {
    return NextResponse.json({
      connected: false,
      error: e.message,
    });
  }
}

export async function POST() {
  try {
    await initPostgresTablesIfNeeded();
    const isLive = await isLiveDatabaseConnected();
    return NextResponse.json({
      success: true,
      message: isLive
        ? 'Tabelas sincronizadas no Vercel Postgres com sucesso!'
        : 'Estrutura verificada (Modo Demonstração ativo).',
      connected: isLive,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e.message },
      { status: 500 }
    );
  }
}
