'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  BookOpen,
  CheckCircle2,
  XCircle,
  LogOut,
  Save,
  Search,
  Database,
  ArrowLeft,
  Calendar,
  Sparkles,
  Layers,
  Building2,
  Clock,
  ShieldCheck,
  Award
} from 'lucide-react';

interface Docente {
  nif: number;
  nome: string;
}

interface Turma {
  codigo: number;
  nome_curso: string;
  quantidade_maxima: number;
  empresa: boolean;
  nome_empresa: string | null;
  turno: string;
  total_alunos?: number;
}

interface AlunoItem {
  matricula: number;
  nome: string;
  status_final: string;
  nota: number | null;
  presenca_percentual: number;
  presente_hoje: boolean;
}

export default function DiarioEscolarPage() {
  // Estado de Autenticação
  const [docente, setDocente] = useState<Docente | null>(null);
  const [nifInput, setNifInput] = useState('');
  const [senhaInput, setSenhaInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Estado das Turmas e Diário
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<AlunoItem[]>([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [dataAula, setDataAula] = useState(() => new Date().toISOString().split('T')[0]);

  // Estado do Banco de Dados
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; mode: string } | null>(null);
  const [modalSql, setModalSql] = useState(false);

  // Verificar status do banco ao iniciar
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch(() => setDbStatus({ connected: false, mode: 'Modo Demonstração Ativo' }));
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Handler de Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nif: nifInput, senha: senhaInput }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Falha no login');
      } else {
        setDocente(data.docente);
        carregarTurmas(data.docente.nif);
      }
    } catch (err: any) {
      setAuthError('Erro de conexão ao autenticar');
    } finally {
      setAuthLoading(false);
    }
  };

  // Preenchimento rápido para demonstração
  const preencherLoginTeste = (nif: number) => {
    setNifInput(String(nif));
    setSenhaInput('123');
    setAuthError('');
  };

  // Carregar turmas do docente logado
  const carregarTurmas = async (nif: number) => {
    try {
      const res = await fetch(`/api/turmas?nif=${nif}`);
      const data = await res.json();
      if (data.success) {
        setTurmas(data.turmas);
      }
    } catch (err) {
      showToast('Erro ao carregar lista de turmas', 'error');
    }
  };

  // Selecionar uma turma e carregar alunos
  const abrirTurma = async (turma: Turma) => {
    setTurmaSelecionada(turma);
    setLoadingAlunos(true);
    try {
      const res = await fetch(`/api/turmas/${turma.codigo}`);
      const data = await res.json();
      if (data.success) {
        setAlunos(
          data.data.alunos.map((a: any) => ({
            ...a,
            presente_hoje: a.presente_hoje !== undefined ? a.presente_hoje : true,
          }))
        );
      } else {
        showToast(data.message || 'Erro ao carregar alunos', 'error');
      }
    } catch (err) {
      showToast('Erro na consulta dos alunos da turma', 'error');
    } finally {
      setLoadingAlunos(false);
    }
  };

  // Alternar presença do aluno
  const alternarPresenca = (matricula: number) => {
    setAlunos((prev) =>
      prev.map((aluno) =>
        aluno.matricula === matricula
          ? { ...aluno, presente_hoje: !aluno.presente_hoje }
          : aluno
      )
    );
  };

  // Atualizar nota do aluno
  const atualizarNota = (matricula: number, novaNota: string) => {
    const val = novaNota === '' ? null : Math.min(10, Math.max(0, parseFloat(novaNota) || 0));
    setAlunos((prev) =>
      prev.map((aluno) =>
        aluno.matricula === matricula ? { ...aluno, nota: val } : aluno
      )
    );
  };

  // Atualizar status final do aluno
  const atualizarStatus = (matricula: number, status: string) => {
    setAlunos((prev) =>
      prev.map((aluno) =>
        aluno.matricula === matricula ? { ...aluno, status_final: status } : aluno
      )
    );
  };

  // Ações em lote
  const marcarTodosPresentes = (presente: boolean) => {
    setAlunos((prev) => prev.map((a) => ({ ...a, presente_hoje: presente })));
    showToast(presente ? 'Todos marcados como Presentes!' : 'Todos marcados como Ausentes!');
  };

  // Salvar alterações no banco de dados
  const salvarLancamentos = async () => {
    if (!turmaSelecionada) return;
    setSalvando(true);
    try {
      const payload = {
        lancamentos: alunos.map((a) => ({
          matricula: a.matricula,
          presente: a.presente_hoje,
          nota: a.nota,
          status_final: a.status_final,
        })),
      };

      const res = await fetch(`/api/turmas/${turmaSelecionada.codigo}/salvar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || 'Lançamentos gravados com sucesso!');
        // Recarregar para refletir percentuais de presença
        abrirTurma(turmaSelecionada);
      } else {
        showToast(data.message || 'Erro ao salvar alterações', 'error');
      }
    } catch (err) {
      showToast('Falha na comunicação ao salvar diário', 'error');
    } finally {
      setSalvando(false);
    }
  };

  // Alunos filtrados
  const alunosFiltrados = alunos.filter(
    (a) =>
      a.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      String(a.matricula).includes(filtro)
  );

  // Cálculos de resumo
  const totalPresentes = alunos.filter((a) => a.presente_hoje).length;
  const mediaNotas =
    alunos.filter((a) => a.nota !== null).length > 0
      ? (
          alunos
            .filter((a) => a.nota !== null)
            .reduce((acc, curr) => acc + (curr.nota || 0), 0) /
          alunos.filter((a) => a.nota !== null).length
        ).toFixed(1)
      : '--';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#065f46' : '#991b1b',
            color: '#fff',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 600,
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Barra Superior / Header Global */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          padding: '16px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <GraduationCap size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Diário Escolar <span style={{ color: '#818cf8' }}>Eletrônico</span>
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Vercel Postgres & Gestão Acadêmica Integrada
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status do Banco */}
          <div
            onClick={() => setModalSql(true)}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              backgroundColor: dbStatus?.connected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${dbStatus?.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
              color: dbStatus?.connected ? '#34d399' : '#fbbf24',
              transition: 'all 0.2s',
            }}
            title="Clique para ver o esquema SQL e detalhes de conexão"
          >
            <Database size={14} />
            <span style={{ fontWeight: 600 }}>
              {dbStatus?.connected ? 'Vercel Postgres Live' : 'Banco em Memória / Demo'}
            </span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>🔍 Ver SQL</span>
          </div>

          {/* Docente Logado */}
          {docente && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'right',
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{docente.nome}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  NIF: <span className="code-badge">{docente.nif}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setDocente(null);
                  setTurmaSelecionada(null);
                }}
                style={{
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  color: '#fb7185',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'background 0.2s',
                }}
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main style={{ flex: 1, padding: '32px 28px', maxWidth: '1300px', margin: '0 auto', width: '100%' }}>
        {/* =========================================================================
            TELA 1: LOGIN DO DOCENTE
            ========================================================================= */}
        {!docente ? (
          <div
            style={{
              minHeight: '70vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              className="glass-panel animate-fade-in"
              style={{
                width: '100%',
                maxWidth: '460px',
                padding: '40px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 20px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(59,130,246,0.2) 100%)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={32} color="#818cf8" />
              </div>

              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
                Acesso do Docente
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
                Informe seu NIF e senha cadastrados para acessar o diário eletrônico das suas turmas.
              </p>

              {authError && (
                <div
                  style={{
                    backgroundColor: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fda4af',
                    padding: '12px',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    marginBottom: '20px',
                    textAlign: 'left',
                  }}
                >
                  {authError}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    NIF (Número de Identificação Funcional)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 1001"
                    value={nifInput}
                    onChange={(e) => setNifInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ textAlign: 'left' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    Senha de Acesso
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={senhaInput}
                    onChange={(e) => setSenhaInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  style={{
                    marginTop: '8px',
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    cursor: authLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                    transition: 'opacity 0.2s',
                    opacity: authLoading ? 0.7 : 1,
                  }}
                >
                  {authLoading ? 'Verificando...' : 'Entrar no Diário de Classe ➔'}
                </button>
              </form>

              {/* Contas de Demonstração Rápidas */}
              <div
                style={{
                  marginTop: '32px',
                  paddingTop: '20px',
                  borderTop: '1px solid var(--border-subtle)',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '10px' }}>
                  💡 ATALHO RÁPIDO PARA TESTAR (SELECIONE UM DOCENTE):
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => preencherLoginTeste(1001)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#cbd5e1',
                      fontSize: '0.78rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    👨‍🏫 <strong>Prof. Carlos</strong><br />
                    <span style={{ color: '#818cf8' }}>NIF: 1001</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => preencherLoginTeste(1002)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: '#cbd5e1',
                      fontSize: '0.78rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    👩‍🏫 <strong>Profa. Mariana</strong><br />
                    <span style={{ color: '#818cf8' }}>NIF: 1002</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : !turmaSelecionada ? (
          /* =========================================================================
             TELA 2: LISTA DE TURMAS ATRIBUÍDAS AO DOCENTE
             ========================================================================= */
          <div className="animate-fade-in">
            {/* Banner com Boas-Vindas e Métricas */}
            <div
              className="glass-panel"
              style={{
                padding: '28px 32px',
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                background: 'linear-gradient(135deg, rgba(23, 32, 54, 0.9) 0%, rgba(16, 23, 38, 0.75) 100%)',
              }}
            >
              <div>
                <span
                  style={{
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    color: '#818cf8',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Painel de Atribuições
                </span>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '8px' }}>
                  Olá, {docente.nome} 👋
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                  Selecione abaixo a turma que deseja lançar frequência e notas escolares.
                </p>
              </div>

              {/* Cards de Métricas */}
              <div style={{ display: 'flex', gap: '16px' }}>
                <div
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8' }}>
                    {turmas.length}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    TURMAS ATRIBUÍDAS
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
                    {turmas.reduce((acc, t) => acc + (t.total_alunos || 0), 0)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                    ALUNOS MATRICULADOS
                  </div>
                </div>
              </div>
            </div>

            {/* Grid de Turmas */}
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Minhas Turmas</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                Tabela relacional <code className="code-badge">professor_turma</code>
              </span>
            </div>

            {turmas.length === 0 ? (
              <div
                className="glass-panel"
                style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}
              >
                <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                <h3>Nenhuma turma vinculada ao seu NIF ({docente.nif})</h3>
                <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                  Verifique a tabela <code className="code-badge">professor_turma</code> no banco de dados.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                  gap: '24px',
                }}
              >
                {turmas.map((turma) => (
                  <div
                    key={turma.codigo}
                    className="glass-panel glass-panel-hover"
                    style={{
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Borda superior de destaque */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: turma.empresa
                          ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                          : 'linear-gradient(90deg, #6366f1, #3b82f6)',
                      }}
                    />

                    <div>
                      {/* Tags de Código e Turno */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '16px',
                        }}
                      >
                        <span
                          className="code-badge"
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                          }}
                        >
                          CÓDIGO: #{turma.codigo}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                          <Clock size={14} />
                          <span>{turma.turno}</span>
                        </div>
                      </div>

                      {/* Nome do Curso */}
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.3 }}>
                        {turma.nome_curso}
                      </h4>

                      {/* Detalhe de Empresa (se houver) */}
                      {turma.empresa && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            color: '#fbbf24',
                            fontSize: '0.8rem',
                            marginBottom: '16px',
                          }}
                        >
                          <Building2 size={16} />
                          <span>Parceria: <strong>{turma.nome_empresa || 'Empresa Parceira'}</strong></span>
                        </div>
                      )}

                      {/* Informações de Alunos e Capacidade */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '12px',
                          padding: '12px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(15, 23, 42, 0.4)',
                          marginBottom: '20px',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>MATRICULADOS</div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', color: '#38bdf8' }}>
                            {turma.total_alunos || 0} alunos
                          </div>
                        </div>

                        <div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>CAPACIDADE</div>
                          <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                            {turma.quantidade_maxima} vagas
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botão de Ação */}
                    <button
                      onClick={() => abrirTurma(turma)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)',
                        transition: 'transform 0.15s',
                      }}
                    >
                      <span>Abrir Diário de Classe</span>
                      <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             TELA 3: DIÁRIO DE CLASSE (CONSULTA DE ALUNOS, NOTAS E PRESENÇA)
             ========================================================================= */
          <div className="animate-fade-in">
            {/* Navegação / Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={() => setTurmaSelecionada(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={16} />
                Voltar às Turmas
              </button>

              <span style={{ color: 'var(--text-dim)' }}>/</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Turma #{turmaSelecionada.codigo} - {turmaSelecionada.nome_curso}
              </span>
            </div>

            {/* Cabeçalho da Turma */}
            <div
              className="glass-panel"
              style={{
                padding: '24px 30px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
                    {turmaSelecionada.nome_curso}
                  </h2>
                  <span
                    className="code-badge"
                    style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                    }}
                  >
                    #{turmaSelecionada.codigo}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <span>Turno: <strong>{turmaSelecionada.turno}</strong></span>
                  <span>•</span>
                  <span>Vagas: <strong>{turmaSelecionada.quantidade_maxima}</strong></span>
                  {turmaSelecionada.empresa && (
                    <>
                      <span>•</span>
                      <span style={{ color: '#fbbf24' }}>Empresa: <strong>{turmaSelecionada.nome_empresa}</strong></span>
                    </>
                  )}
                </div>
              </div>

              {/* Data da Aula e Resumo Rápido */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} color="#818cf8" />
                  <input
                    type="date"
                    value={dataAula}
                    onChange={(e) => setDataAula(e.target.value)}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border-subtle)',
                      color: '#fff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    Presença Hoje:{' '}
                    <strong style={{ color: '#34d399' }}>
                      {totalPresentes}/{alunos.length}
                    </strong>
                  </div>
                  <div>•</div>
                  <div>
                    Média de Notas: <strong style={{ color: '#818cf8' }}>{mediaNotas}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Barra de Ferramentas / Ações em Lote */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '16px',
              }}
            >
              {/* Campo de Busca */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  width: '320px',
                }}
              >
                <Search size={16} color="var(--text-dim)" />
                <input
                  type="text"
                  placeholder="Filtrar por nome ou matrícula..."
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    outline: 'none',
                    width: '100%',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => marcarTodosPresentes(true)}
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#34d399',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  ✓ Todos Presentes
                </button>

                <button
                  onClick={() => marcarTodosPresentes(false)}
                  style={{
                    background: 'rgba(244, 63, 94, 0.1)',
                    border: '1px solid rgba(244, 63, 94, 0.25)',
                    color: '#fb7185',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                  }}
                >
                  ✕ Todos Ausentes
                </button>

                <button
                  onClick={salvarLancamentos}
                  disabled={salvando}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    color: '#fff',
                    padding: '10px 22px',
                    borderRadius: '10px',
                    cursor: salvando ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
                  }}
                >
                  <Save size={16} />
                  <span>{salvando ? 'Gravando no Banco...' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </div>

            {/* Tabela de Alunos e Diário */}
            {loadingAlunos ? (
              <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ color: '#818cf8', fontWeight: 600 }}>Carregando dados dos alunos...</div>
              </div>
            ) : alunosFiltrados.length === 0 ? (
              <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
                <h3>Nenhum aluno encontrado para os critérios pesquisados.</h3>
              </div>
            ) : (
              <div
                className="glass-panel"
                style={{
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      textAlign: 'left',
                      fontSize: '0.9rem',
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          backgroundColor: 'rgba(15, 23, 42, 0.7)',
                          borderBottom: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)',
                          fontSize: '0.78rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <th style={{ padding: '16px 20px' }}>Matrícula</th>
                        <th style={{ padding: '16px 20px' }}>Nome do Aluno</th>
                        <th style={{ padding: '16px 20px', textAlign: 'center' }}>Presença (Hoje)</th>
                        <th style={{ padding: '16px 20px', textAlign: 'center' }}>Frequência Geral</th>
                        <th style={{ padding: '16px 20px', textAlign: 'center' }}>Nota (0 - 10)</th>
                        <th style={{ padding: '16px 20px' }}>Situação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosFiltrados.map((aluno, index) => {
                        const notaNum = aluno.nota !== null ? Number(aluno.nota) : null;
                        const notaCor =
                          notaNum === null
                            ? '#94a3b8'
                            : notaNum >= 7
                            ? '#34d399'
                            : notaNum >= 5
                            ? '#fbbf24'
                            : '#fb7185';

                        return (
                          <tr
                            key={aluno.matricula}
                            style={{
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              backgroundColor: index % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                              transition: 'background-color 0.15s',
                            }}
                          >
                            {/* Matrícula */}
                            <td style={{ padding: '16px 20px' }}>
                              <span
                                className="code-badge"
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  color: '#cbd5e1',
                                }}
                              >
                                {aluno.matricula}
                              </span>
                            </td>

                            {/* Nome */}
                            <td style={{ padding: '16px 20px', fontWeight: 600 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                    color: '#a5b4fc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {aluno.nome.charAt(0)}
                                </div>
                                <span>{aluno.nome}</span>
                              </div>
                            </td>

                            {/* Alternador de Presença */}
                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                              <button
                                onClick={() => alternarPresenca(aluno.matricula)}
                                style={{
                                  background: aluno.presente_hoje
                                    ? 'rgba(16, 185, 129, 0.15)'
                                    : 'rgba(244, 63, 94, 0.15)',
                                  border: `1px solid ${
                                    aluno.presente_hoje
                                      ? 'rgba(16, 185, 129, 0.4)'
                                      : 'rgba(244, 63, 94, 0.4)'
                                  }`,
                                  color: aluno.presente_hoje ? '#34d399' : '#fb7185',
                                  padding: '8px 16px',
                                  borderRadius: '20px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  minWidth: '125px',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s',
                                }}
                              >
                                {aluno.presente_hoje ? (
                                  <>
                                    <CheckCircle2 size={16} />
                                    <span>Presente</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={16} />
                                    <span>Ausente</span>
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Frequência Geral */}
                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                  {aluno.presenca_percentual}%
                                </span>
                                <div
                                  style={{
                                    width: '70px',
                                    height: '5px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    marginTop: '4px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${aluno.presenca_percentual}%`,
                                      height: '100%',
                                      backgroundColor:
                                        aluno.presenca_percentual >= 75 ? '#10b981' : '#f43f5e',
                                    }}
                                  />
                                </div>
                              </div>
                            </td>

                            {/* Entrada de Nota */}
                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  value={aluno.nota !== null ? aluno.nota : ''}
                                  placeholder="--"
                                  onChange={(e) => atualizarNota(aluno.matricula, e.target.value)}
                                  style={{
                                    width: '75px',
                                    textAlign: 'center',
                                    padding: '8px 10px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(15, 23, 42, 0.7)',
                                    border: `1px solid ${notaCor}`,
                                    color: notaCor,
                                    fontWeight: 700,
                                    fontSize: '0.95rem',
                                    outline: 'none',
                                  }}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>/10</span>
                              </div>
                            </td>

                            {/* Status Final */}
                            <td style={{ padding: '16px 20px' }}>
                              <select
                                value={aluno.status_final}
                                onChange={(e) => atualizarStatus(aluno.matricula, e.target.value)}
                                style={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                  border: '1px solid var(--border-subtle)',
                                  color: '#cbd5e1',
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  outline: 'none',
                                }}
                              >
                                <option value="Matriculado">Matriculado</option>
                                <option value="Aprovado">Aprovado</option>
                                <option value="Recuperação">Recuperação</option>
                                <option value="Reprovado">Reprovado</option>
                                <option value="Evadido">Evadido</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Rodapé da Tabela */}
                <div
                  style={{
                    padding: '16px 24px',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>
                    Exibindo <strong>{alunosFiltrados.length}</strong> de <strong>{alunos.length}</strong> alunos matriculados nesta turma.
                  </span>
                  <button
                    onClick={salvarLancamentos}
                    disabled={salvando}
                    style={{
                      background: '#10b981',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 18px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Save size={14} />
                    Salvar Dados no Banco
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: VISUALIZAÇÃO DO ESQUEMA SQL E ARQUITETURA DE BANCO DE DADOS
          ========================================================================= */}
      {modalSql && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '32px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={24} color="#818cf8" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Esquema de Banco de Dados SQL (Vercel)</h3>
              </div>
              <button
                onClick={() => setModalSql(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: 1.5 }}>
              Status da Conexão: <strong style={{ color: dbStatus?.connected ? '#34d399' : '#fbbf24' }}>{dbStatus?.mode}</strong>.
              <br />
              Quando a variável <code className="code-badge">POSTGRES_URL</code> estiver configurada na Vercel, o sistema conectará automaticamente no Postgres serverless.
            </div>

            <div
              style={{
                backgroundColor: 'rgba(10, 15, 29, 0.95)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '16px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.8rem',
                color: '#93c5fd',
                overflowX: 'auto',
                lineHeight: 1.6,
              }}
            >
              <pre>{`-- TABELAS PRINCIPAIS CRIADAS
1. docente (nif INT PRIMARY KEY, nome VARCHAR, senha VARCHAR)
2. aluno (matricula INT PRIMARY KEY, nome VARCHAR)
3. turma (codigo INT PRIMARY KEY, nome_curso VARCHAR, quantidade_maxima INT, empresa BOOLEAN, nome_empresa VARCHAR, turno VARCHAR)

-- TABELAS RELACIONAIS (COM CHAVES ESTRANGEIRAS)
4. professor_turma (id INT PRIMARY KEY, codigo_turma INT -> turma, nif_docente INT -> docente)
5. aluno_turma (id INT PRIMARY KEY, codigo_turma_aluno INT -> turma, matricula_aluno INT -> aluno, status_final VARCHAR, nota NUMERIC, presenca_percentual INT)
6. registro_diario (id INT PRIMARY KEY, codigo_turma INT, matricula_aluno INT, data_aula DATE, presente BOOLEAN, nota_aula NUMERIC)`}</pre>
            </div>

            <button
              onClick={() => setModalSql(false)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fechar Visualização
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
