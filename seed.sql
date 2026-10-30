-- ==============================================================================
-- DADOS DE EXEMPLO (SEED) PARA O DIÁRIO ESCOLAR ELETRÔNICO
-- ==============================================================================

-- 1. Inserindo Docentes com NIF e Senha (senha padrão de teste: '123456')
INSERT INTO docente (nif, nome, senha) VALUES 
(1001, 'Prof. Carlos Eduardo', '123456'),
(1002, 'Profa. Mariana Costa', '123456'),
(1003, 'Prof. Roberto Mendes', '123456')
ON CONFLICT (nif) DO UPDATE SET senha = EXCLUDED.senha;

-- 2. Inserindo Alunos
INSERT INTO aluno (matricula, nome) VALUES 
(202401, 'Lucas Silva'),
(202402, 'Beatriz Souza'),
(202403, 'Gabriel Lima'),
(202404, 'Juliana Mendes'),
(202405, 'Felipe Oliveira'),
(202406, 'Camila Rocha')
ON CONFLICT (matricula) DO NOTHING;

-- 3. Inserindo Turmas
INSERT INTO turma (codigo, nome_curso, quantidade_maxima, empresa, nome_empresa, turno) VALUES 
(501, 'Técnico em Desenvolvimento de Sistemas', 30, FALSE, NULL, 'Matutino'),
(502, 'Capacitação Corporativa em TI', 20, TRUE, 'Tech Soluções Ltda', 'Noturno'),
(503, 'Engenharia de Software Aplicada', 25, FALSE, NULL, 'Vespertino')
ON CONFLICT (codigo) DO NOTHING;

-- 4. Associando Docente às Turmas (Carlos Eduardo leciona nas turmas 501 e 502)
INSERT INTO professor_turma (codigo_turma, nif_docente) VALUES 
(501, 1001),
(502, 1001),
(503, 1002)
ON CONFLICT (codigo_turma, nif_docente) DO NOTHING;

-- 5. Associando Alunos às Turmas com notas e presenças iniciais
INSERT INTO aluno_turma (codigo_turma_aluno, matricula_aluno, status_final, nota, presenca_percentual) VALUES 
(501, 202401, 'Matriculado', 8.5, 95),
(501, 202402, 'Matriculado', 9.0, 100),
(501, 202403, 'Matriculado', 6.0, 80),
(501, 202404, 'Matriculado', 7.5, 90),
(502, 202405, 'Matriculado', 8.0, 100),
(502, 202406, 'Matriculado', 5.5, 75)
ON CONFLICT (codigo_turma_aluno, matricula_aluno) DO NOTHING;
