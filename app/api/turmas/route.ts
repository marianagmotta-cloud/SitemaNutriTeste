import { NextResponse } from 'next/server';
import { getTurmasPorDocente, isLiveDatabaseConnected } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nifParam = searchParams.get('nif');

    if (!nifParam) {
      return NextResponse.json(
        { success: false, message: 'Parâmetro nif é obrigatório' },
        { status: 400 }
      );
    }

    const nif = parseInt(nifParam, 10);
    const turmas = await getTurmasPorDocente(nif);
    const isLive = await isLiveDatabaseConnected();

    return NextResponse.json({
      success: true,
      turmas,
      isLive,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao carregar turmas' },
      { status: 500 }
    );
  }
}
