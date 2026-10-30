-- ==============================================================================
-- DADOS DE EXEMPLO (SEED) PARA TESTE DO SISTEMA ESCOLAR NO VERCEL POSTGRES
-- ==============================================================================

-- 1. Inserindo Docentes (NIF como identificador inteiro)
INSERT INTO docente (nif, nome) VALUES 
(1001, 'Prof. Carlos Eduardo'),
(1002, 'Profa. Mariana Costa')
ON CONFLICT (nif) DO NOTHING;

-- 2. Inserindo Alunos (Matrícula como identificador inteiro)
INSERT INTO aluno (matricula, nome) VALUES 
(202401, 'Lucas Silva'),
(202402, 'Beatriz Souza'),
(202403, 'Gabriel Lima')
ON CONFLICT (matricula) DO NOTHING;

-- 3. Inserindo Turmas (Código como identificador inteiro)
INSERT INTO turma (codigo, nome_curso, quantidade_maxima, empresa, nome_empresa, turno) VALUES 
(501, 'Técnico em Desenvolvimento de Sistemas', 30, FALSE, NULL, 'Matutino'),
(502, 'Capacitação Corporativa em TI', 20, TRUE, 'Tech Soluções Ltda', 'Noturno')
ON CONFLICT (codigo) DO NOTHING;

-- 4. Associando Docentes às Turmas (professor_turma)
INSERT INTO professor_turma (codigo_turma, nif_docente) VALUES 
(501, 1001),
(502, 1002)
ON CONFLICT (codigo_turma, nif_docente) DO NOTHING;

-- 5. Associando Alunos às Turmas (aluno_turma)
INSERT INTO aluno_turma (codigo_turma_aluno, matricula_aluno, status_final) VALUES 
(501, 202401, 'Matriculado'),
(501, 202402, 'Matriculado'),
(502, 202403, 'Matriculado')
ON CONFLICT (codigo_turma_aluno, matricula_aluno) DO NOTHING;

-- ==============================================================================
-- CONSULTAS DE VALIDAÇÃO
-- ==============================================================================
-- Consulta 1: Listar Turmas com seus Professores
SELECT 
    t.codigo AS codigo_turma,
    t.nome_curso,
    t.turno,
    d.nif AS nif_docente,
    d.nome AS nome_docente
FROM turma t
JOIN professor_turma pt ON t.codigo = pt.codigo_turma
JOIN docente d ON pt.nif_docente = d.nif;

-- Consulta 2: Listar Turmas com Alunos e Status
SELECT 
    t.codigo AS codigo_turma,
    t.nome_curso,
    a.matricula AS matricula_aluno,
    a.nome AS nome_aluno,
    at.status_final
FROM turma t
JOIN aluno_turma at ON t.codigo = at.codigo_turma_aluno
JOIN aluno a ON at.matricula_aluno = a.matricula;
