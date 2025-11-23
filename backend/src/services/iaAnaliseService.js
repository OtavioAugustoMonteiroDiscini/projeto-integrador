const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Calcula a data de início e fim da semana atual
 */
const getSemanaAtual = () => {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0 = Domingo, 6 = Sábado
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - diaSemana);
  inicioSemana.setHours(0, 0, 0, 0);
  
  const fimSemana = new Date(inicioSemana);
  fimSemana.setDate(inicioSemana.getDate() + 6);
  fimSemana.setHours(23, 59, 59, 999);
  
  return { inicioSemana, fimSemana };
};

/**
 * Busca produtos mais vendidos da semana
 */
const buscarProdutosMaisVendidos = async (empresaId, inicioSemana, fimSemana) => {
  const produtos = await prisma.itemVenda.groupBy({
    by: ['produtoId'],
    where: {
      venda: {
        empresaId,
        status: 'CONCLUIDA',
        dataVenda: {
          gte: inicioSemana,
          lte: fimSemana
        }
      }
    },
    _sum: {
      quantidade: true,
      subtotal: true
    },
    _count: {
      vendaId: true
    },
    orderBy: {
      _sum: {
        quantidade: 'desc'
      }
    },
    take: 10
  });

  // Buscar informações completas dos produtos
  const produtosCompletos = await Promise.all(
    produtos.map(async (item) => {
      const produto = await prisma.produto.findUnique({
        where: { id: item.produtoId },
        select: {
          id: true,
          nome: true,
          codigo: true,
          precoVenda: true,
          precoCusto: true,
          estoque: true,
          categoria: true
        }
      });

      if (!produto) return null;

      const quantidadeVendida = Number(item._sum.quantidade || 0);
      const receitaTotal = Number(item._sum.subtotal || 0);
      const numeroVendas = item._count.vendaId || 0;
      const margemLucro = Number(produto.precoVenda) - Number(produto.precoCusto);
      const margemPercentual = Number(produto.precoCusto) > 0 
        ? ((margemLucro / Number(produto.precoCusto)) * 100).toFixed(2)
        : 0;

      return {
        produto: {
          id: produto.id,
          nome: produto.nome,
          codigo: produto.codigo,
          precoVenda: Number(produto.precoVenda),
          precoCusto: Number(produto.precoCusto),
          estoque: produto.estoque,
          categoria: produto.categoria
        },
        quantidadeVendida,
        receitaTotal,
        numeroVendas,
        margemLucro,
        margemPercentual: parseFloat(margemPercentual)
      };
    })
  );

  return produtosCompletos.filter(p => p !== null);
};

/**
 * Busca produtos menos vendidos da semana
 */
const buscarProdutosMenosVendidos = async (empresaId, inicioSemana, fimSemana) => {
  // Buscar todos os produtos ativos da empresa
  const todosProdutos = await prisma.produto.findMany({
    where: {
      empresaId,
      ativo: true
    },
    select: {
      id: true,
      nome: true,
      codigo: true,
      precoVenda: true,
      precoCusto: true,
      estoque: true,
      categoria: true
    }
  });

  // Buscar vendas da semana por produto
  const vendasPorProduto = await prisma.itemVenda.groupBy({
    by: ['produtoId'],
    where: {
      venda: {
        empresaId,
        status: 'CONCLUIDA',
        dataVenda: {
          gte: inicioSemana,
          lte: fimSemana
        }
      }
    },
    _sum: {
      quantidade: true,
      subtotal: true
    },
    _count: {
      vendaId: true
    }
  });

  // Criar mapa de vendas
  const vendasMap = new Map();
  vendasPorProduto.forEach(item => {
    vendasMap.set(item.produtoId, {
      quantidade: Number(item._sum.quantidade || 0),
      receita: Number(item._sum.subtotal || 0),
      numeroVendas: item._count.vendaId || 0
    });
  });

  // Mapear produtos com suas vendas (0 se não vendeu)
  const produtosComVendas = todosProdutos.map(produto => {
    const vendas = vendasMap.get(produto.id) || {
      quantidade: 0,
      receita: 0,
      numeroVendas: 0
    };

    const margemLucro = Number(produto.precoVenda) - Number(produto.precoCusto);
    const margemPercentual = Number(produto.precoCusto) > 0 
      ? ((margemLucro / Number(produto.precoCusto)) * 100).toFixed(2)
      : 0;

    return {
      produto: {
        id: produto.id,
        nome: produto.nome,
        codigo: produto.codigo,
        precoVenda: Number(produto.precoVenda),
        precoCusto: Number(produto.precoCusto),
        estoque: produto.estoque,
        categoria: produto.categoria
      },
      quantidadeVendida: vendas.quantidade,
      receitaTotal: vendas.receita,
      numeroVendas: vendas.numeroVendas,
      margemLucro,
      margemPercentual: parseFloat(margemPercentual)
    };
  });

  // Ordenar por quantidade vendida (menor primeiro) e pegar os 10 primeiros
  return produtosComVendas
    .sort((a, b) => a.quantidadeVendida - b.quantidadeVendida)
    .slice(0, 10);
};

/**
 * Analisa um produto e sugere alteração de preço (para produtos mais vendidos - AUMENTO)
 */
const analisarProdutoParaAumento = async (itemProduto, empresaId, inicioSemana, fimSemana) => {
  if (!itemProduto) {
    return null;
  }

  const { produto, quantidadeVendida, receitaTotal, margemLucro, margemPercentual } = itemProduto;

  // Buscar histórico de vendas do produto nas últimas 4 semanas para comparação
  const quatroSemanasAtras = new Date(inicioSemana);
  quatroSemanasAtras.setDate(quatroSemanasAtras.getDate() - 28);

  const vendasHistorico = await prisma.itemVenda.groupBy({
    by: ['produtoId'],
    where: {
      produtoId: produto.id,
      venda: {
        empresaId,
        status: 'CONCLUIDA',
        dataVenda: {
          gte: quatroSemanasAtras,
          lt: inicioSemana
        }
      }
    },
    _sum: {
      quantidade: true
    }
  });

  const quantidadeMediaSemanal = vendasHistorico.length > 0 && vendasHistorico[0]._sum.quantidade
    ? Number(vendasHistorico[0]._sum.quantidade || 0) / 4
    : quantidadeVendida / 7; // Se não há histórico, usa a média do período atual

  // Análise de tendência
  const crescimento = quantidadeMediaSemanal > 0
    ? ((quantidadeVendida - quantidadeMediaSemanal) / quantidadeMediaSemanal) * 100
    : 100; // Se não há histórico, assume crescimento

  // Análise de estoque
  const estoqueDisponivel = produto.estoque;
  const diasEstoque = quantidadeVendida > 0 
    ? Math.floor(estoqueDisponivel / (quantidadeVendida / 7))
    : Infinity;

  // Análise de margem
  const margemAdequada = margemPercentual >= 20; // Margem mínima para considerar aumento
  const margemAlta = margemPercentual >= 40;

  // Lógica de recomendação de AUMENTO de preço
  let recomendacao = null;
  let percentualAlteracao = null;
  let novoPreco = null;
  let razao = '';

  // Produto com alta frequência de venda - AUMENTAR
  if (quantidadeVendida > 0 && margemAdequada) {
    // Calcular aumento baseado na frequência e margem
    if (quantidadeVendida >= 10 && margemAlta) {
      // Alta frequência e margem alta - aumento maior
      percentualAlteracao = 8;
      novoPreco = Number(produto.precoVenda) * 1.08;
      razao = `Alta frequência de vendas (${quantidadeVendida} unidades) com margem alta (${margemPercentual.toFixed(1)}%). Aumento de preço pode otimizar receita.`;
    } else if (quantidadeVendida >= 5 && margemAdequada) {
      // Frequência média-alta - aumento moderado
      percentualAlteracao = 5;
      novoPreco = Number(produto.precoVenda) * 1.05;
      razao = `Boa frequência de vendas (${quantidadeVendida} unidades) com margem adequada (${margemPercentual.toFixed(1)}%). Pequeno aumento pode melhorar rentabilidade.`;
    } else if (quantidadeVendida >= 3 && margemAdequada && diasEstoque < 21) {
      // Frequência moderada com estoque baixo
      percentualAlteracao = 3;
      novoPreco = Number(produto.precoVenda) * 1.03;
      razao = `Frequência de vendas moderada (${quantidadeVendida} unidades) com estoque limitado. Aumento leve pode otimizar receita.`;
    } else if (crescimento > 30 && margemAdequada) {
      // Crescimento alto
      percentualAlteracao = 4;
      novoPreco = Number(produto.precoVenda) * 1.04;
      razao = `Crescimento de ${crescimento.toFixed(1)}% detectado. Aumento de preço pode capitalizar a demanda crescente.`;
    }
  }

  if (percentualAlteracao && novoPreco) {
    recomendacao = {
      tipo: 'ACRESCIMO',
      precoAtual: Number(produto.precoVenda),
      novoPreco: parseFloat(novoPreco.toFixed(2)),
      percentualAlteracao,
      razao,
      impactoEsperado: {
        receitaAtual: receitaTotal,
        receitaEstimada: receitaTotal * (1 + percentualAlteracao / 100) * 0.95, // Assume 5% redução em quantidade
        quantidadeAtual: quantidadeVendida,
        quantidadeEstimada: Math.floor(quantidadeVendida * 0.95)
      }
    };
  }

  return {
    produto: itemProduto.produto,
    quantidadeVendida,
    receitaTotal,
    margemPercentual,
    recomendacao
  };
};

/**
 * Analisa um produto e sugere alteração de preço (para produtos menos vendidos - REDUÇÃO)
 */
const analisarProdutoParaReducao = async (itemProduto, empresaId, inicioSemana, fimSemana) => {
  if (!itemProduto) {
    return null;
  }

  const { produto, quantidadeVendida, receitaTotal, margemLucro, margemPercentual } = itemProduto;

  // Buscar histórico de vendas
  const quatroSemanasAtras = new Date(inicioSemana);
  quatroSemanasAtras.setDate(quatroSemanasAtras.getDate() - 28);

  const vendasHistorico = await prisma.itemVenda.groupBy({
    by: ['produtoId'],
    where: {
      produtoId: produto.id,
      venda: {
        empresaId,
        status: 'CONCLUIDA',
        dataVenda: {
          gte: quatroSemanasAtras,
          lt: inicioSemana
        }
      }
    },
    _sum: {
      quantidade: true
    }
  });

  const quantidadeMediaSemanal = vendasHistorico.length > 0 && vendasHistorico[0]._sum.quantidade
    ? Number(vendasHistorico[0]._sum.quantidade || 0) / 4
    : 0;

  // Análise de estoque
  const estoqueDisponivel = produto.estoque;
  const precoCusto = Number(produto.precoCusto);
  const precoVenda = Number(produto.precoVenda);

  // Lógica de recomendação de REDUÇÃO de preço (sem afetar lucro)
  let recomendacao = null;
  let percentualAlteracao = null;
  let novoPreco = null;
  let razao = '';

  // Calcular margem mínima aceitável (15% de margem mínima para garantir lucro)
  const margemMinima = precoCusto * 1.15; // 15% sobre o custo
  const margemAtual = margemPercentual;

  // Produto com baixa frequência de venda - REDUZIR (mas respeitando margem mínima)
  if (quantidadeVendida <= 2 && estoqueDisponivel > 0) {
    // Calcular redução máxima possível sem perder lucro
    const reducaoMaxima = (precoVenda - margemMinima) / precoVenda * 100;
    
    if (reducaoMaxima > 5 && margemAtual > 15) {
      // Pode reduzir sem perder lucro
      if (margemAtual > 50) {
        // Margem muito alta - pode reduzir mais
        percentualAlteracao = -15;
        novoPreco = Math.max(precoVenda * 0.85, margemMinima);
        razao = `Baixa frequência de vendas (${quantidadeVendida} unidades) com margem alta (${margemPercentual.toFixed(1)}%). Redução pode aumentar rotatividade mantendo lucro.`;
      } else if (margemAtual > 30) {
        // Margem alta - redução moderada
        percentualAlteracao = -10;
        novoPreco = Math.max(precoVenda * 0.9, margemMinima);
        razao = `Baixa frequência de vendas (${quantidadeVendida} unidades) com margem adequada (${margemPercentual.toFixed(1)}%). Redução pode estimular vendas.`;
      } else if (margemAtual > 20) {
        // Margem moderada - redução leve
        percentualAlteracao = -5;
        novoPreco = Math.max(precoVenda * 0.95, margemMinima);
        razao = `Baixa frequência de vendas (${quantidadeVendida} unidades). Redução leve pode aumentar atratividade sem comprometer lucro.`;
      }
    } else if (estoqueDisponivel > 20 && margemAtual > 15) {
      // Estoque alto - pode reduzir um pouco
      percentualAlteracao = -8;
      novoPreco = Math.max(precoVenda * 0.92, margemMinima);
      razao = `Estoque elevado (${estoqueDisponivel} unidades) e baixa rotatividade. Redução pode acelerar vendas.`;
    }
  } else if (quantidadeVendida === 0 && estoqueDisponivel > 0 && margemAtual > 20) {
    // Produto sem vendas - redução mais agressiva
    const reducaoMaxima = (precoVenda - margemMinima) / precoVenda * 100;
    if (reducaoMaxima > 10) {
      percentualAlteracao = -20;
      novoPreco = Math.max(precoVenda * 0.8, margemMinima);
      razao = `Produto sem vendas no período com estoque disponível (${estoqueDisponivel} unidades). Redução significativa pode despertar interesse mantendo margem mínima de 15%.`;
    }
  }

  if (percentualAlteracao && novoPreco && novoPreco >= margemMinima) {
    // Recalcular percentual real baseado no novo preço
    const percentualReal = ((novoPreco - precoVenda) / precoVenda) * 100;
    
    recomendacao = {
      tipo: 'REDUCAO',
      precoAtual: precoVenda,
      novoPreco: parseFloat(novoPreco.toFixed(2)),
      percentualAlteracao: parseFloat(percentualReal.toFixed(1)),
      razao,
      margemMinima: parseFloat(margemMinima.toFixed(2)),
      novaMargem: parseFloat((((novoPreco - precoCusto) / precoCusto) * 100).toFixed(1)),
      impactoEsperado: {
        receitaAtual: receitaTotal,
        receitaEstimada: novoPreco * Math.max(quantidadeVendida * 1.5, 1), // Espera-se 50% mais vendas
        quantidadeAtual: quantidadeVendida,
        quantidadeEstimada: Math.max(Math.floor(quantidadeVendida * 1.5), 1)
      }
    };
  }

  return {
    produto: itemProduto.produto,
    quantidadeVendida,
    receitaTotal,
    margemPercentual,
    recomendacao
  };
};

/**
 * Analisa o produto mais vendido e sugere alterações de preço
 */
const analisarProdutoMaisVendido = async (produtoMaisVendido, empresaId) => {
  if (!produtoMaisVendido) {
    return null;
  }

  const { produto, quantidadeVendida, receitaTotal, margemLucro, margemPercentual } = produtoMaisVendido;

  // Buscar histórico de vendas do produto nas últimas 4 semanas para comparação
  const quatroSemanasAtras = new Date();
  quatroSemanasAtras.setDate(quatroSemanasAtras.getDate() - 28);

  const vendasHistorico = await prisma.itemVenda.groupBy({
    by: ['produtoId'],
    where: {
      produtoId: produto.id,
      venda: {
        empresaId,
        status: 'CONCLUIDA',
        dataVenda: {
          gte: quatroSemanasAtras
        }
      }
    },
    _sum: {
      quantidade: true
    }
  });

  const quantidadeMediaSemanal = vendasHistorico.length > 0
    ? Number(vendasHistorico[0]._sum.quantidade || 0) / 4
    : 0;

  // Análise de tendência
  const crescimento = quantidadeMediaSemanal > 0
    ? ((quantidadeVendida - quantidadeMediaSemanal) / quantidadeMediaSemanal) * 100
    : 0;

  // Análise de estoque
  const estoqueDisponivel = produto.estoque;
  const diasEstoque = quantidadeVendida > 0 
    ? Math.floor(estoqueDisponivel / (quantidadeVendida / 7))
    : Infinity;

  // Análise de margem
  const margemAdequada = margemPercentual >= 30; // Margem mínima considerada adequada
  const margemAlta = margemPercentual >= 50;

  // Lógica de recomendação de preço
  let recomendacao = null;
  let tipoRecomendacao = null; // 'PROMOCAO' ou 'ACRESCIMO'
  let novoPreco = null;
  let percentualAlteracao = null;
  let razao = '';

  // Cenário 1: Produto com alta demanda e estoque baixo - ACRÉSCIMO
  if (quantidadeVendida > quantidadeMediaSemanal * 1.5 && diasEstoque < 14 && margemAdequada) {
    tipoRecomendacao = 'ACRESCIMO';
    percentualAlteracao = 5; // Aumento de 5%
    novoPreco = Number(produto.precoVenda) * 1.05;
    razao = `Alta demanda detectada (${crescimento.toFixed(1)}% acima da média) e estoque limitado (${diasEstoque} dias). Aumento de preço pode otimizar receita sem afetar significativamente as vendas.`;
  }
  // Cenário 2: Produto com alta demanda e margem baixa - ACRÉSCIMO
  else if (quantidadeVendida > quantidadeMediaSemanal * 1.3 && !margemAdequada && margemPercentual > 10) {
    tipoRecomendacao = 'ACRESCIMO';
    percentualAlteracao = 3; // Aumento de 3%
    novoPreco = Number(produto.precoVenda) * 1.03;
    razao = `Alta demanda com margem abaixo do ideal (${margemPercentual.toFixed(1)}%). Pequeno aumento pode melhorar a rentabilidade.`;
  }
  // Cenário 3: Produto com demanda estável e margem alta - PROMOÇÃO
  else if (quantidadeVendida <= quantidadeMediaSemanal * 1.1 && margemAlta && estoqueDisponivel > 20) {
    tipoRecomendacao = 'PROMOCAO';
    percentualAlteracao = -10; // Desconto de 10%
    novoPreco = Number(produto.precoVenda) * 0.9;
    razao = `Demanda estável com margem alta (${margemPercentual.toFixed(1)}%) e estoque suficiente. Promoção pode aumentar volume de vendas e rotatividade.`;
  }
  // Cenário 4: Produto com estoque alto e demanda moderada - PROMOÇÃO
  else if (estoqueDisponivel > 30 && quantidadeVendida < quantidadeMediaSemanal * 0.8 && margemAdequada) {
    tipoRecomendacao = 'PROMOCAO';
    percentualAlteracao = -15; // Desconto de 15%
    novoPreco = Number(produto.precoVenda) * 0.85;
    razao = `Estoque elevado (${estoqueDisponivel} unidades) e demanda abaixo da média. Promoção pode acelerar rotatividade e liberar capital.`;
  }
  // Cenário 5: Produto com margem muito alta e demanda crescente - ACRÉSCIMO MODERADO
  else if (margemPercentual > 60 && crescimento > 20) {
    tipoRecomendacao = 'ACRESCIMO';
    percentualAlteracao = 7; // Aumento de 7%
    novoPreco = Number(produto.precoVenda) * 1.07;
    razao = `Margem muito alta (${margemPercentual.toFixed(1)}%) e crescimento de ${crescimento.toFixed(1)}%. Há espaço para aumentar preço sem perder competitividade.`;
  }

  if (tipoRecomendacao) {
    recomendacao = {
      tipo: tipoRecomendacao,
      precoAtual: Number(produto.precoVenda),
      novoPreco: parseFloat(novoPreco.toFixed(2)),
      percentualAlteracao,
      razao,
      impactoEsperado: {
        receitaAtual: receitaTotal,
        receitaEstimada: tipoRecomendacao === 'PROMOCAO'
          ? receitaTotal * 1.2 // Espera-se 20% mais vendas com promoção
          : receitaTotal * 0.95, // Espera-se 5% menos vendas com acréscimo
        quantidadeAtual: quantidadeVendida,
        quantidadeEstimada: tipoRecomendacao === 'PROMOCAO'
          ? Math.floor(quantidadeVendida * 1.2)
          : Math.floor(quantidadeVendida * 0.95)
      }
    };
  }

  return {
    produto: produtoMaisVendido.produto,
    estatisticas: {
      quantidadeVendida,
      receitaTotal,
      margemLucro,
      margemPercentual,
      quantidadeMediaSemanal: parseFloat(quantidadeMediaSemanal.toFixed(2)),
      crescimento: parseFloat(crescimento.toFixed(2)),
      diasEstoque: diasEstoque === Infinity ? null : diasEstoque
    },
    recomendacao
  };
};

/**
 * Executa análise completa semanal de produtos
 */
const executarAnaliseSemanal = async (empresaId, dataInicio = null, dataFim = null) => {
  try {
    let inicioSemana, fimSemana;
    
    if (dataInicio && dataFim) {
      // Usar datas fornecidas
      inicioSemana = new Date(dataInicio);
      inicioSemana.setHours(0, 0, 0, 0);
      fimSemana = new Date(dataFim);
      fimSemana.setHours(23, 59, 59, 999);
    } else {
      // Usar semana atual
      const semana = getSemanaAtual();
      inicioSemana = semana.inicioSemana;
      fimSemana = semana.fimSemana;
    }

    // Buscar produtos mais e menos vendidos
    const [produtosMaisVendidos, produtosMenosVendidos] = await Promise.all([
      buscarProdutosMaisVendidos(empresaId, inicioSemana, fimSemana),
      buscarProdutosMenosVendidos(empresaId, inicioSemana, fimSemana)
    ]);

    // Analisar TODOS os produtos mais vendidos para propor aumentos
    const analisesProdutosMaisVendidos = await Promise.all(
      produtosMaisVendidos.slice(0, 10).map(item => 
        analisarProdutoParaAumento(item, empresaId, inicioSemana, fimSemana)
      )
    );

    // Analisar TODOS os produtos menos vendidos para propor reduções
    const analisesProdutosMenosVendidos = await Promise.all(
      produtosMenosVendidos.slice(0, 10).map(item => 
        analisarProdutoParaReducao(item, empresaId, inicioSemana, fimSemana)
      )
    );

    // Filtrar apenas os que têm recomendações
    const produtosComRecomendacaoAumento = analisesProdutosMaisVendidos.filter(a => a && a.recomendacao);
    const produtosComRecomendacaoReducao = analisesProdutosMenosVendidos.filter(a => a && a.recomendacao);

    // Analisar o produto mais vendido (para manter compatibilidade)
    const produtoMaisVendido = produtosMaisVendidos.length > 0 
      ? produtosMaisVendidos[0] 
      : null;
    
    const analiseProdutoMaisVendido = await analisarProdutoMaisVendido(
      produtoMaisVendido,
      empresaId
    );

    // Criar descrição do período
    const descricaoPeriodo = dataInicio && dataFim
      ? `Período de ${inicioSemana.toLocaleDateString('pt-BR')} a ${fimSemana.toLocaleDateString('pt-BR')}`
      : `Semana de ${inicioSemana.toLocaleDateString('pt-BR')} a ${fimSemana.toLocaleDateString('pt-BR')}`;

    return {
      periodo: {
        inicio: inicioSemana,
        fim: fimSemana,
        descricao: descricaoPeriodo
      },
      produtosMaisVendidos: produtosMaisVendidos.slice(0, 5), // Top 5
      produtosMenosVendidos: produtosMenosVendidos.slice(0, 5), // Top 5 menos vendidos
      analiseProdutoMaisVendido,
      recomendacoesAumento: produtosComRecomendacaoAumento, // Produtos para aumentar preço
      recomendacoesReducao: produtosComRecomendacaoReducao, // Produtos para reduzir preço
      resumo: {
        totalProdutosVendidos: produtosMaisVendidos.length,
        totalProdutosSemVenda: produtosMenosVendidos.filter(p => p.quantidadeVendida === 0).length,
        receitaTotalSemana: produtosMaisVendidos.reduce((sum, p) => sum + p.receitaTotal, 0),
        totalRecomendacoesAumento: produtosComRecomendacaoAumento.length,
        totalRecomendacoesReducao: produtosComRecomendacaoReducao.length
      }
    };
  } catch (error) {
    console.error('Erro ao executar análise semanal:', error);
    throw error;
  }
};

module.exports = {
  executarAnaliseSemanal,
  getSemanaAtual,
  buscarProdutosMaisVendidos,
  buscarProdutosMenosVendidos,
  analisarProdutoMaisVendido,
  analisarProdutoParaAumento,
  analisarProdutoParaReducao
};

