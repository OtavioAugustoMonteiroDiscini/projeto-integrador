const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    console.log('🌱 Iniciando seeder para criar usuário administrador...');

    // Verificar se já existe um admin
    const existingAdmin = await prisma.empresa.findFirst({
      where: {
        tipo: 'ADMIN'
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Já existe um usuário administrador no sistema.');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.nome}`);
      return;
    }

    // Dados do administrador
    const adminData = {
      nome: 'Administrador do Sistema',
      cnpj: '00.000.000/0001-00',
      email: 'admin@sistemagestao.com',
      telefone: '(11) 99999-9999',
      endereco: 'Rua do Administrador, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
      senha: 'admin123', // Senha padrão
      tipo: 'ADMIN',
      ativo: true
    };

    // Criptografar senha
    const senhaHash = await bcrypt.hash(adminData.senha, 10);

    // Criar o administrador
    const admin = await prisma.empresa.create({
      data: {
        ...adminData,
        senha: senhaHash
      }
    });

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log('📋 Dados do administrador:');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Nome: ${admin.nome}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   CNPJ: ${admin.cnpj}`);
    console.log(`   Tipo: ${admin.tipo}`);
    console.log(`   Ativo: ${admin.ativo ? 'Sim' : 'Não'}`);
    console.log('');
    console.log('🔐 Credenciais de acesso:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Senha: ${adminData.senha}`);
    console.log('');
    console.log('⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedAdmin();
  } catch (error) {
    console.error('❌ Erro no seeder:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { seedAdmin };
