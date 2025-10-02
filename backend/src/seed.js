const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  try {
    // Criar empresa de exemplo
    const senhaHash = await bcrypt.hash('123456', 12);
    
    const empresa = await prisma.empresa.upsert({
      where: { email: 'empresa@exemplo.com' },
      update: {},
      create: {
        nome: 'Empresa Exemplo Ltda',
        cnpj: '12.345.678/0001-90',
        email: 'empresa@exemplo.com',
        telefone: '(11) 99999-9999',
        endereco: 'Rua das Flores, 123',
        cidade: 'São Paulo',
        estado: 'SP',
        cep: '01234-567',
        senha: senhaHash
      }
    });

    console.log('✅ Empresa criada:', empresa.nome);

    // Criar produtos de exemplo
    const produtos = [
      {
        nome: 'Produto A',
        descricao: 'Descrição do produto A',
        codigo: 'PROD001',
        precoVenda: 29.90,
        precoCusto: 15.00,
        estoque: 50,
        estoqueMin: 10,
        categoria: 'Categoria 1',
        marca: 'Marca A'
      },
      {
        nome: 'Produto B',
        descricao: 'Descrição do produto B',
        codigo: 'PROD002',
        precoVenda: 49.90,
        precoCusto: 25.00,
        estoque: 30,
        estoqueMin: 5,
        categoria: 'Categoria 1',
        marca: 'Marca B'
      },
      {
        nome: 'Produto C',
        descricao: 'Descrição do produto C',
        codigo: 'PROD003',
        precoVenda: 19.90,
        precoCusto: 10.00,
        estoque: 2, // Estoque baixo para gerar alerta
        estoqueMin: 5,
        categoria: 'Categoria 2',
        marca: 'Marca C'
      }
    ];

    for (const produtoData of produtos) {
      const produto = await prisma.produto.upsert({
        where: { 
          codigo_empresaId: {
            codigo: produtoData.codigo,
            empresaId: empresa.id
          }
        },
        update: {},
        create: {
          ...produtoData,
          empresaId: empresa.id
        }
      });
      console.log('✅ Produto criado:', produto.nome);
    }

    // Criar algumas vendas de exemplo
    const venda1 = await prisma.venda.create({
      data: {
        numero: '000001',
        cliente: 'Cliente Exemplo 1',
        valorTotal: 59.80,
        desconto: 0,
        formaPagamento: 'DINHEIRO',
        status: 'CONCLUIDA',
        empresaId: empresa.id
      }
    });

    // Itens da venda 1
    await prisma.itemVenda.create({
      data: {
        quantidade: 2,
        precoUnitario: 29.90,
        subtotal: 59.80,
        vendaId: venda1.id,
        produtoId: (await prisma.produto.findFirst({ where: { codigo: 'PROD001' } })).id
      }
    });

    console.log('✅ Venda criada:', venda1.numero);

    // Criar algumas compras de exemplo
    const compra1 = await prisma.compra.create({
      data: {
        numero: '000001',
        fornecedor: 'Fornecedor Exemplo',
        valorTotal: 100.00,
        status: 'CONCLUIDA',
        empresaId: empresa.id
      }
    });

    // Itens da compra 1
    await prisma.itemCompra.create({
      data: {
        quantidade: 10,
        precoUnitario: 10.00,
        subtotal: 100.00,
        compraId: compra1.id,
        produtoId: (await prisma.produto.findFirst({ where: { codigo: 'PROD003' } })).id
      }
    });

    console.log('✅ Compra criada:', compra1.numero);

    // Criar contas a pagar de exemplo
    const contasPagar = [
      {
        descricao: 'Aluguel do mês',
        valor: 2000.00,
        dataVencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        categoria: 'ALUGUEL',
        status: 'PENDENTE'
      },
      {
        descricao: 'Conta de luz',
        valor: 150.00,
        dataVencimento: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás (vencida)
        categoria: 'UTILIDADES',
        status: 'VENCIDO'
      }
    ];

    for (const contaData of contasPagar) {
      const conta = await prisma.contaPagar.create({
        data: {
          ...contaData,
          empresaId: empresa.id
        }
      });
      console.log('✅ Conta a pagar criada:', conta.descricao);
    }

    // Criar contas a receber de exemplo
    const contasReceber = [
      {
        descricao: 'Venda a prazo - Cliente X',
        valor: 500.00,
        dataVencimento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
        cliente: 'Cliente X',
        categoria: 'VENDA',
        status: 'PENDENTE'
      },
      {
        descricao: 'Serviço prestado',
        valor: 300.00,
        dataVencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás (vencida)
        cliente: 'Cliente Y',
        categoria: 'SERVICO',
        status: 'VENCIDO'
      }
    ];

    for (const contaData of contasReceber) {
      const conta = await prisma.contaReceber.create({
        data: {
          ...contaData,
          empresaId: empresa.id
        }
      });
      console.log('✅ Conta a receber criada:', conta.descricao);
    }

    // Criar alertas de exemplo
    const alertas = [
      {
        tipo: 'ESTOQUE_BAIXO',
        titulo: 'Estoque Baixo',
        mensagem: 'Produto C está com estoque baixo (2 unidades). Estoque mínimo: 5',
        prioridade: 'MEDIA',
        lido: false
      },
      {
        tipo: 'VENCIMENTO',
        titulo: 'Conta Vencida',
        mensagem: 'Conta de luz está vencida há 2 dias (R$ 150,00)',
        prioridade: 'ALTA',
        lido: false
      }
    ];

    for (const alertaData of alertas) {
      const alerta = await prisma.alerta.create({
        data: {
          ...alertaData,
          empresaId: empresa.id
        }
      });
      console.log('✅ Alerta criado:', alerta.titulo);
    }

    console.log('🎉 Seed concluído com sucesso!');
    console.log('\n📋 Dados de acesso:');
    console.log('Email: empresa@exemplo.com');
    console.log('Senha: 123456');

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

