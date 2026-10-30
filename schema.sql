-- ==============================================================================
-- SISTEMA DE GESTÃO ESCOLAR - ESQUEMA DE BANCO DE DADOS (SQL / Vercel Postgres)
-- ==============================================================================

-- 1. TABELA DOCENTE
CREATE TABLE IF NOT EXISTS docente (
    nif INT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL
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
-- Relaciona as tabelas 'docente' e 'turma'
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
-- Relaciona as tabelas 'aluno' e 'turma'
CREATE TABLE IF NOT EXISTS aluno_turma (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_turma_aluno INT NOT NULL,
    matricula_aluno INT NOT NULL,
    status_final VARCHAR(50) NOT NULL DEFAULT 'Matriculado',
    CONSTRAINT fk_aluno_turma_turma FOREIGN KEY (codigo_turma_aluno) 
        REFERENCES turma(codigo) ON DELETE CASCADE,
    CONSTRAINT fk_aluno_turma_aluno FOREIGN KEY (matricula_aluno) 
        REFERENCES aluno(matricula) ON DELETE CASCADE,
    CONSTRAINT uq_aluno_turma UNIQUE (codigo_turma_aluno, matricula_aluno)
);

-- ==============================================================================
-- VIEWS DE COMPATIBILIDADE / ALIASES
-- Permite consultar usando os nomes citados no enunciado alternativamente
-- ==============================================================================
CREATE OR REPLACE VIEW turma_docente AS 
SELECT id, codigo_turma, nif_docente FROM professor_turma;

CREATE OR REPLACE VIEW turma_aluno AS 
SELECT id, codigo_turma_aluno AS codigo_turma, matricula_aluno, status_final FROM aluno_turma;

-- ==============================================================================
-- ÍNDICES PARA OTIMIZAÇÃO DE BUSCA E CHAVES ESTRANGEIRAS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_prof_turma_turma ON professor_turma(codigo_turma);
CREATE INDEX IF NOT EXISTS idx_prof_turma_docente ON professor_turma(nif_docente);
CREATE INDEX IF NOT EXISTS idx_aluno_turma_turma ON aluno_turma(codigo_turma_aluno);
CREATE INDEX IF NOT EXISTS idx_aluno_turma_aluno ON aluno_turma(matricula_aluno);
