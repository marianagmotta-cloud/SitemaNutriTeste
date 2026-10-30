-- ==============================================================================
-- SISTEMA DE GESTÃO ESCOLAR - ESQUEMA DE BANCO DE DADOS (SQL / Vercel Postgres)
-- Adaptado para o Diário Escolar Eletrônico (Login, Notas e Frequência)
-- ==============================================================================

-- 1. TABELA DOCENTE (Com Senha para Autenticação)
CREATE TABLE IF NOT EXISTS docente (
    nif INT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    senha VARCHAR(255) NOT NULL DEFAULT '123456'
);

-- 2. TABELA ALUNO
CREATE TABLE IF NOT EXISTS aluno (
    matricula INT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL
);

-- 3. TABELA TURMA
CREATE TABLE IF NOT EXISTS turma (
    codigo INT PRIMARY KEY,
    nome_curso VARCHAR(150) NOT NULL,
    quantidade_maxima INT NOT NULL CHECK (quantidade_maxima > 0),
    empresa BOOLEAN NOT NULL DEFAULT FALSE,
    nome_empresa VARCHAR(150),
    turno VARCHAR(50) NOT NULL
);

-- 4. TABELA RELACIONAL: PROFESSOR_TURMA (TURMA_DOCENTE)
-- Relaciona Docente e Turma
CREATE TABLE IF NOT EXISTS professor_turma (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_turma INT NOT NULL,
    nif_docente INT NOT NULL,
    CONSTRAINT fk_prof_turma_turma FOREIGN KEY (codigo_turma) 
        REFERENCES turma(codigo) ON DELETE CASCADE,
    CONSTRAINT fk_prof_turma_docente FOREIGN KEY (nif_docente) 
        REFERENCES docente(nif) ON DELETE CASCADE,
    CONSTRAINT uq_professor_turma UNIQUE (codigo_turma, nif_docente)
);

-- 5. TABELA RELACIONAL: ALUNO_TURMA (TURMA_ALUNO)
-- Relaciona Aluno e Turma, guardando também a Nota Final e Percentual de Presença
CREATE TABLE IF NOT EXISTS aluno_turma (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_turma_aluno INT NOT NULL,
    matricula_aluno INT NOT NULL,
    status_final VARCHAR(50) NOT NULL DEFAULT 'Matriculado',
    nota NUMERIC(4,2) DEFAULT NULL,
    presenca_percentual INT NOT NULL DEFAULT 100,
    CONSTRAINT fk_aluno_turma_turma FOREIGN KEY (codigo_turma_aluno) 
        REFERENCES turma(codigo) ON DELETE CASCADE,
    CONSTRAINT fk_aluno_turma_aluno FOREIGN KEY (matricula_aluno) 
        REFERENCES aluno(matricula) ON DELETE CASCADE,
    CONSTRAINT uq_aluno_turma UNIQUE (codigo_turma_aluno, matricula_aluno)
);

-- 6. TABELA HISTÓRICO DO DIÁRIO: REGISTRO DIÁRIO DE AULAS (FREQUÊNCIA E NOTAS DIÁRIAS)
CREATE TABLE IF NOT EXISTS registro_diario (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_turma INT NOT NULL,
    matricula_aluno INT NOT NULL,
    data_aula DATE NOT NULL DEFAULT CURRENT_DATE,
    presente BOOLEAN NOT NULL DEFAULT TRUE,
    nota_aula NUMERIC(4,2) DEFAULT NULL,
    observacao VARCHAR(255),
    CONSTRAINT fk_registro_turma FOREIGN KEY (codigo_turma) 
        REFERENCES turma(codigo) ON DELETE CASCADE,
    CONSTRAINT fk_registro_aluno FOREIGN KEY (matricula_aluno) 
        REFERENCES aluno(matricula) ON DELETE CASCADE
);

-- ==============================================================================
-- VIEWS DE COMPATIBILIDADE / ALIASES
-- ==============================================================================
CREATE OR REPLACE VIEW turma_docente AS 
SELECT id, codigo_turma, nif_docente FROM professor_turma;

CREATE OR REPLACE VIEW turma_aluno AS 
SELECT id, codigo_turma_aluno AS codigo_turma, matricula_aluno, status_final, nota, presenca_percentual 
FROM aluno_turma;

-- ==============================================================================
-- ÍNDICES PARA OTIMIZAÇÃO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_prof_turma_turma ON professor_turma(codigo_turma);
CREATE INDEX IF NOT EXISTS idx_prof_turma_docente ON professor_turma(nif_docente);
CREATE INDEX IF NOT EXISTS idx_aluno_turma_turma ON aluno_turma(codigo_turma_aluno);
CREATE INDEX IF NOT EXISTS idx_aluno_turma_aluno ON aluno_turma(matricula_aluno);
CREATE INDEX IF NOT EXISTS idx_registro_diario_turma_data ON registro_diario(codigo_turma, data_aula);
