-- Seeder SQL para criar usuário administrador
-- Execute este script diretamente no seu banco de dados PostgreSQL

-- Inserir usuário administrador
INSERT INTO empresas (
    id,
    nome,
    cnpj,
    email,
    telefone,
    endereco,
    cidade,
    estado,
    cep,
    senha,
    tipo,
    ativo,
    "createdAt",
    "updatedAt"
) VALUES (
    'admin_' || substr(md5(random()::text), 1, 25), -- ID único
    'Administrador do Sistema',
    '00.000.000/0001-00',
    'admin@sistemagestao.com',
    '(11) 99999-9999',
    'Rua do Administrador, 123',
    'São Paulo',
    'SP',
    '01234-567',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: admin123
    'ADMIN',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Verificar se o admin foi criado
SELECT 
    id,
    nome,
    email,
    tipo,
    ativo,
    "createdAt"
FROM empresas 
WHERE tipo = 'ADMIN' 
ORDER BY "createdAt" DESC 
LIMIT 1;

-- Mensagem de sucesso
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM empresas WHERE tipo = 'ADMIN') THEN
        RAISE NOTICE '✅ Usuário administrador criado com sucesso!';
        RAISE NOTICE '📧 Email: admin@sistemagestao.com';
        RAISE NOTICE '🔐 Senha: admin123';
        RAISE NOTICE '⚠️  IMPORTANTE: Altere a senha após o primeiro login!';
    ELSE
        RAISE NOTICE '❌ Erro ao criar usuário administrador';
    END IF;
END $$;
