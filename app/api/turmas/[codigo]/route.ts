import { NextResponse } from 'next/server';
import { getTurmaComAlunos, isLiveDatabaseConnected } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { codigo: string } }
) {
  try {
    const codigoTurma = parseInt(params.codigo, 10);
    if (isNaN(codigoTurma)) {
      return NextResponse.json(
        { success: false, message: 'Código da turma inválido' },
        { status: 400 }
      );
    }

    const data = await getTurmaComAlunos(codigoTurma);
    if (!data) {
      return NextResponse.json(
        { success: false, message: 'Turma não encontrada' },
        { status: 404 }
      );
    }

    const isLive = await isLiveDatabaseConnected();

    return NextResponse.json({
      success: true,
      data,
      isLive,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao carregar detalhes da turma' },
      { status: 500 }
    );
  }
}
