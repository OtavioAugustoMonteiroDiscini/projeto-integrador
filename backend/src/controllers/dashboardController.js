const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dashboard principal com resumo geral
const dashboardPrincipal = async (req, res) => {
  try {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Vendas do mês
    const vendasMes = await prisma.venda.aggregate({
      where: {
        empresaId: req.empresa.id,
        status: 'CONCLUIDA',
        dataVenda: {
          gte: inicioMes,
          lte: fimMes
        }
      },
      _sum: { valorTotal: true },
      _count: true
    });

    // Compras do mês
    const comprasMes = await prisma.compra.aggregate({
      where: {
        empresaId: req.empresa.id,
        status: 'CONCLUIDA',
        dataCompra: {
          gte: inicioMes,
          lte: fimMes
        }
      },
      _sum: { valorTotal: true },
      _count: true
    });

    // Contas a pagar pendentes
    const contasPagarPendentes = await prisma.contaPagar.aggregate({
      where: {
        empresaId: req.empresa.id,
        status: 'PENDENTE'
      },
      _sum: { valor: true },
      _count: true
    });

    // Contas a receber pendentes
    const contasReceberPendentes = await prisma.contaReceber.aggregate({
      where: {
        empresaId: req.empresa.id,
        status: 'PENDENTE'
      },
      _sum: { valor: true },
      _count: true
    });

    // Produtos com estoque baixo (considerando estoque <= 5 como baixo)
    const produtosEstoqueBaixo = await prisma.produto.count({
      where: {
        empresaId: req.empresa.id,
        ativo: true,
        estoque: { lte: 5 }
      }
    });

    // Alertas não lidos
    const alertasNaoLidos = await prisma.alerta.count({
      where: {
        empresaId: req.empresa.id,
        lido: false
      }
    });

    res.json({
      resumo: {
        vendasMes: {
          valor: vendasMes._sum.valorTotal || 0,
          quantidade: vendasMes._count
        },
        comprasMes: {
          valor: comprasMes._sum.valorTotal || 0,
          quantidade: comprasMes._count
        },
        contasPagar: {
          valor: contasPagarPendentes._sum.valor || 0,
          quantidade: contasPagarPendentes._count
        },
        contasReceber: {
          valor: contasReceberPendentes._sum.valor || 0,
          quantidade: contasReceberPendentes._count
        },
        produtosEstoqueBaixo,
        alertasNaoLidos
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Vendas por período (últimos 12 meses)
const vendasPorPeriodo = async (req, res) => {
  try {
    const { meses = 12 } = req.query;
    const hoje = new Date();
    const inicioPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - parseInt(meses), 1);

    const vendas = await prisma.venda.findMany({
      where: {
        empresaId: req.empresa.id,
        status: 'CONCLUIDA',
        dataVenda: {
          gte: inicioPeriodo
        }
      },
      select: {
        dataVenda: true,
        valorTotal: true
      },
      orderBy: { dataVenda: 'asc' }
    });

    // Agrupar por mês
    const vendasPorMes = {};
    vendas.forEach(venda => {
      const mes = venda.dataVenda.toISOString().substring(0, 7); // YYYY-MM
      if (!vendasPorMes[mes]) {
        vendasPorMes[mes] = { valor: 0, quantidade: 0 };
      }
      vendasPorMes[mes].valor += Number(venda.valorTotal);
      vendasPorMes[mes].quantidade += 1;
    });

    // Converter para array ordenado
    const vendasArray = Object.entries(vendasPorMes)
      .map(([mes, dados]) => ({
        mes,
        valor: dados.valor,
        quantidade: dados.quantidade
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    res.json({ vendas: vendasArray });

  } catch (error) {
    console.error('Erro ao buscar vendas por período:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Produtos mais vendidos
const produtosMaisVendidos = async (req, res) => {
  try {
    const { limite = 10, dataInicio, dataFim } = req.query;

    const where = {
      venda: {
        empresaId: req.empresa.id,
        status: 'CONCLUIDA'
      }
    };

    if (dataInicio || dataFim) {
      where.venda.dataVenda = {};
      if (dataInicio) {
        where.venda.dataVenda.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.venda.dataVenda.lte = new Date(dataFim);
      }
    }

    const produtos = await prisma.itemVenda.groupBy({
      by: ['produtoId'],
      where,
      _sum: { 
        quantidade: true,
        subtotal: true
      },
      _count: true,
      orderBy: { _sum: { quantidade: 'desc' } },
      take: parseInt(limite)
    });

    // Buscar nomes dos produtos
    const produtosComNomes = await Promise.all(
      produtos.map(async (item) => {
        const produto = await prisma.produto.findUnique({
          where: { id: item.produtoId },
          select: { nome: true, codigo: true, precoVenda: true }
        });
        return {
          ...item,
          produto
        };
      })
    );

    res.json({ produtos: produtosComNomes });

  } catch (error) {
    console.error('Erro ao buscar produtos mais vendidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Vendas por forma de pagamento
const vendasPorFormaPagamento = async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;

    const where = {
      empresaId: req.empresa.id,
      status: 'CONCLUIDA'
    };

    if (dataInicio || dataFim) {
      where.dataVenda = {};
      if (dataInicio) {
        where.dataVenda.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataVenda.lte = new Date(dataFim);
      }
    }

    const vendasPorPagamento = await prisma.venda.groupBy({
      by: ['formaPagamento'],
      where,
      _sum: { valorTotal: true },
      _count: true,
      orderBy: { _sum: { valorTotal: 'desc' } }
    });

    // Transformar dados para formato mais amigável
    const vendasFormatadas = vendasPorPagamento.map(item => ({
      formaPagamento: item.formaPagamento,
      valorTotal: parseFloat(item._sum.valorTotal || 0),
      quantidade: item._count
    }));

    res.json({ vendasPorPagamento: vendasFormatadas });

  } catch (error) {
    console.error('Erro ao buscar vendas por forma de pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Fluxo de caixa (contas a pagar vs receber)
const fluxoCaixa = async (req, res) => {
  try {
    const { meses = 6 } = req.query;
    const hoje = new Date();
    const inicioPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - parseInt(meses), 1);

    // Contas a pagar por mês
    const contasPagar = await prisma.contaPagar.findMany({
      where: {
        empresaId: req.empresa.id,
        dataVencimento: {
          gte: inicioPeriodo
        }
      },
      select: {
        dataVencimento: true,
        valor: true,
        status: true
      }
    });

    // Contas a receber por mês
    const contasReceber = await prisma.contaReceber.findMany({
      where: {
        empresaId: req.empresa.id,
        dataVencimento: {
          gte: inicioPeriodo
        }
      },
      select: {
        dataVencimento: true,
        valor: true,
        status: true
      }
    });

    // Agrupar por mês
    const fluxoPorMes = {};
    
    contasPagar.forEach(conta => {
      const mes = conta.dataVencimento.toISOString().substring(0, 7);
      if (!fluxoPorMes[mes]) {
        fluxoPorMes[mes] = { pagar: 0, receber: 0 };
      }
      fluxoPorMes[mes].pagar += Number(conta.valor);
    });

    contasReceber.forEach(conta => {
      const mes = conta.dataVencimento.toISOString().substring(0, 7);
      if (!fluxoPorMes[mes]) {
        fluxoPorMes[mes] = { pagar: 0, receber: 0 };
      }
      fluxoPorMes[mes].receber += Number(conta.valor);
    });

    // Converter para array ordenado
    const fluxoArray = Object.entries(fluxoPorMes)
      .map(([mes, dados]) => ({
        mes,
        pagar: dados.pagar,
        receber: dados.receber,
        saldo: dados.receber - dados.pagar
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    res.json({ fluxo: fluxoArray });

  } catch (error) {
    console.error('Erro ao buscar fluxo de caixa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Estatísticas de estoque
const estatisticasEstoque = async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        empresaId: req.empresa.id,
        ativo: true
      },
      select: {
        estoque: true,
        precoCusto: true,
        precoVenda: true
      }
    });

    const totalProdutos = produtos.length;
    const valorTotalEstoque = produtos.reduce((total, produto) => {
      return total + (produto.estoque * Number(produto.precoCusto));
    }, 0);

    const produtosEstoqueBaixo = produtos.filter(produto => 
      produto.estoque <= 5 // Considerando estoque mínimo padrão
    ).length;

    const produtosSemEstoque = produtos.filter(produto => 
      produto.estoque === 0
    ).length;

    res.json({
      totalProdutos,
      valorTotalEstoque,
      produtosEstoqueBaixo,
      produtosSemEstoque,
      produtosComEstoque: totalProdutos - produtosSemEstoque
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de estoque:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Comparativo mensal (vendas vs compras)
const comparativoMensal = async (req, res) => {
  try {
    const { meses = 12 } = req.query;
    const hoje = new Date();
    const inicioPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - parseInt(meses), 1);

    // Vendas por mês
    const vendas = await prisma.venda.findMany({
      where: {
        empresaId: req.empresa.id,
        status: 'CONCLUIDA',
        dataVenda: {
          gte: inicioPeriodo
        }
      },
      select: {
        dataVenda: true,
        valorTotal: true
      }
    });

    // Compras por mês
    const compras = await prisma.compra.findMany({
      where: {
        empresaId: req.empresa.id,
        status: 'CONCLUIDA',
        dataCompra: {
          gte: inicioPeriodo
        }
      },
      select: {
        dataCompra: true,
        valorTotal: true
      }
    });

    // Agrupar por mês
    const comparativoPorMes = {};

    vendas.forEach(venda => {
      const mes = venda.dataVenda.toISOString().substring(0, 7);
      if (!comparativoPorMes[mes]) {
        comparativoPorMes[mes] = { vendas: 0, compras: 0 };
      }
      comparativoPorMes[mes].vendas += Number(venda.valorTotal);
    });

    compras.forEach(compra => {
      const mes = compra.dataCompra.toISOString().substring(0, 7);
      if (!comparativoPorMes[mes]) {
        comparativoPorMes[mes] = { vendas: 0, compras: 0 };
      }
      comparativoPorMes[mes].compras += Number(compra.valorTotal);
    });

    // Converter para array ordenado
    const comparativoArray = Object.entries(comparativoPorMes)
      .map(([mes, dados]) => ({
        mes,
        vendas: dados.vendas,
        compras: dados.compras,
        lucro: dados.vendas - dados.compras
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes));

    res.json({ comparativo: comparativoArray });

  } catch (error) {
    console.error('Erro ao buscar comparativo mensal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Vendas vs Compras por período
const vendasVsCompras = async (req, res) => {
  try {
    const { meses = 6 } = req.query;
    const hoje = new Date();
    const inicioPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - parseInt(meses), 1);

    // Buscar vendas por mês
    const vendasPorMes = await prisma.venda.groupBy({
      by: ['dataVenda'],
      where: {
        empresaId: req.empresa.id,
        status: 'CONCLUIDA',
        dataVenda: { gte: inicioPeriodo }
      },
      _sum: { valorTotal: true },
      _count: true
    });

    // Buscar compras por mês
    const comprasPorMes = await prisma.compra.groupBy({
      by: ['dataCompra'],
      where: {
        empresaId: req.empresa.id,
        status: 'CONCLUIDA',
        dataCompra: { gte: inicioPeriodo }
      },
      _sum: { valorTotal: true },
      _count: true
    });

    // Processar dados por mês
    const dadosPorMes = {};
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Inicializar todos os meses com zero
    for (let i = 0; i < parseInt(meses); i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const mesNome = mesesNomes[data.getMonth()];
      
      dadosPorMes[mesKey] = {
        mes: mesNome,
        vendas: 0,
        compras: 0
      };
    }

    // Adicionar dados de vendas
    vendasPorMes.forEach(venda => {
      const data = new Date(venda.dataVenda);
      const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (dadosPorMes[mesKey]) {
        dadosPorMes[mesKey].vendas = parseFloat(venda._sum.valorTotal || 0);
      }
    });

    // Adicionar dados de compras
    comprasPorMes.forEach(compra => {
      const data = new Date(compra.dataCompra);
      const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (dadosPorMes[mesKey]) {
        dadosPorMes[mesKey].compras = parseFloat(compra._sum.valorTotal || 0);
      }
    });

    // Converter para array e ordenar
    const resultado = Object.values(dadosPorMes).reverse();

    res.json({ dados: resultado });

  } catch (error) {
    console.error('Erro ao buscar dados de vendas vs compras:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Contas a Pagar vs Receber por período
const contasPagarVsReceber = async (req, res) => {
  try {
    const { meses = 6 } = req.query;
    const hoje = new Date();
    const inicioPeriodo = new Date(hoje.getFullYear(), hoje.getMonth() - parseInt(meses), 1);

    // Buscar contas a pagar por mês
    const contasPagarPorMes = await prisma.contaPagar.groupBy({
      by: ['dataVencimento'],
      where: {
        empresaId: req.empresa.id,
        dataVencimento: { gte: inicioPeriodo }
      },
      _sum: { valor: true },
      _count: true
    });

    // Buscar contas a receber por mês
    const contasReceberPorMes = await prisma.contaReceber.groupBy({
      by: ['dataVencimento'],
      where: {
        empresaId: req.empresa.id,
        dataVencimento: { gte: inicioPeriodo }
      },
      _sum: { valor: true },
      _count: true
    });

    // Processar dados por mês
    const dadosPorMes = {};
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    // Inicializar todos os meses com zero
    for (let i = 0; i < parseInt(meses); i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const mesNome = mesesNomes[data.getMonth()];
      
      dadosPorMes[mesKey] = {
        mes: mesNome,
        aPagar: 0,
        aReceber: 0
      };
    }

    // Adicionar dados de contas a pagar
    contasPagarPorMes.forEach(conta => {
      const data = new Date(conta.dataVencimento);
      const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (dadosPorMes[mesKey]) {
        dadosPorMes[mesKey].aPagar = parseFloat(conta._sum.valor || 0);
      }
    });

    // Adicionar dados de contas a receber
    contasReceberPorMes.forEach(conta => {
      const data = new Date(conta.dataVencimento);
      const mesKey = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      if (dadosPorMes[mesKey]) {
        dadosPorMes[mesKey].aReceber = parseFloat(conta._sum.valor || 0);
      }
    });

    // Converter para array e ordenar
    const resultado = Object.values(dadosPorMes).reverse();

    res.json({ dados: resultado });

  } catch (error) {
    console.error('Erro ao buscar dados de contas a pagar vs receber:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  dashboardPrincipal,
  vendasPorPeriodo,
  produtosMaisVendidos,
  vendasPorFormaPagamento,
  fluxoCaixa,
  estatisticasEstoque,
  comparativoMensal,
  vendasVsCompras,
  contasPagarVsReceber
};

