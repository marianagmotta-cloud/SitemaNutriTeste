import { NextResponse } from 'next/server';
import { registrarPresencasENotas } from '@/lib/db';

export async function POST(
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

    const body = await request.json();
    const { lancamentos } = body;

    if (!Array.isArray(lancamentos)) {
      return NextResponse.json(
        { success: false, message: 'Lista de lançamentos inválida' },
        { status: 400 }
      );
    }

    const result = await registrarPresencasENotas(codigoTurma, lancamentos);

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Erro ao registrar diário' },
      { status: 500 }
    );
  }
}
