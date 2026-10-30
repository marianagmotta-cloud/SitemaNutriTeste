import { NextResponse } from 'next/server';
import { autenticarDocente } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nif, senha } = body;

    if (!nif || !senha) {
      return NextResponse.json(
        { success: false, message: 'NIF e Senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const nifNum = parseInt(String(nif), 10);
    if (isNaN(nifNum)) {
      return NextResponse.json(
        { success: false, message: 'O NIF deve ser um número inteiro.' },
        { status: 400 }
      );
    }

    const docente = await autenticarDocente(nifNum, String(senha).trim());

    if (!docente) {
      return NextResponse.json(
        { success: false, message: 'NIF ou senha inválidos. Tente NIF 1001 e senha 123 (ou 123456).' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso!',
      docente,
    });
  } catch (error: any) {
    console.error('ERRO EM /api/auth/login:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Erro interno no servidor' },
      { status: 500 }
    );
  }
}
