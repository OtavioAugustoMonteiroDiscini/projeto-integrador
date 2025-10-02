const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');
    
    // Listar todas as empresas
    const empresas = await prisma.empresa.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        cnpj: true,
        _count: {
          select: {
            produtos: true
          }
        }
      }
    });
    
    console.log(`\n📊 Empresas encontradas: ${empresas.length}`);
    empresas.forEach(empresa => {
      console.log(`- ${empresa.nome} (${empresa.email}) - ${empresa._count.produtos} produtos`);
    });
    
    // Listar todos os produtos
    const produtos = await prisma.produto.findMany({
      select: {
        id: true,
        nome: true,
        codigo: true,
        precoVenda: true,
        estoque: true,
        empresa: {
          select: {
            nome: true
          }
        }
      }
    });
    
    console.log(`\n📦 Produtos encontrados: ${produtos.length}`);
    produtos.forEach(produto => {
      console.log(`- ${produto.nome} (${produto.codigo}) - R$ ${produto.precoVenda} - Estoque: ${produto.estoque} - Empresa: ${produto.empresa.nome}`);
    });
    
    // Testar consulta específica (como o frontend faz)
    if (empresas.length > 0) {
      const empresaId = empresas[0].id;
      console.log(`\n🔍 Testando consulta para empresa: ${empresas[0].nome}`);
      
      const produtosEmpresa = await prisma.produto.findMany({
        where: {
          empresaId: empresaId
        },
        orderBy: { nome: 'asc' }
      });
      
      console.log(`Produtos da empresa: ${produtosEmpresa.length}`);
      produtosEmpresa.forEach(produto => {
        console.log(`- ${produto.nome} (${produto.codigo})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
