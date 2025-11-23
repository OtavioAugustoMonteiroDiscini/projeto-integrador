import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  RefreshCw,
  Package,
  AlertCircle,
  Languages
} from 'lucide-react';
import { iaAnaliseService } from '../services/iaAnaliseService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
// Carregar módulos dinamicamente para evitar problemas de build
const loadPDFLibraries = async () => {
  try {
    const [jspdfModule, html2canvasModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]);
    
    // jsPDF pode ser exportado de diferentes formas dependendo da versão
    let jsPDF;
    
    // Tentar diferentes formas de acesso ao jsPDF
    if (jspdfModule.jsPDF) {
      jsPDF = jspdfModule.jsPDF;
    } else if (jspdfModule.default) {
      if (typeof jspdfModule.default === 'function') {
        jsPDF = jspdfModule.default;
      } else if (jspdfModule.default.jsPDF) {
        jsPDF = jspdfModule.default.jsPDF;
      } else {
        jsPDF = jspdfModule.default;
      }
    } else if (typeof jspdfModule === 'function') {
      jsPDF = jspdfModule;
    } else {
      // Última tentativa - acessar diretamente
      jsPDF = jspdfModule;
    }
    
    // html2canvas
    let html2canvas;
    if (html2canvasModule.default) {
      html2canvas = html2canvasModule.default;
    } else if (typeof html2canvasModule === 'function') {
      html2canvas = html2canvasModule;
    } else {
      html2canvas = html2canvasModule;
    }
    
    if (!jsPDF) {
      console.error('jsPDF não encontrado:', jspdfModule);
      throw new Error('jsPDF não foi carregado corretamente');
    }
    
    if (!html2canvas) {
      console.error('html2canvas não encontrado:', html2canvasModule);
      throw new Error('html2canvas não foi carregado corretamente');
    }
    
    return { jsPDF, html2canvas };
  } catch (error) {
    console.error('Erro ao carregar bibliotecas PDF:', error);
    const errorMessage = error.message || 'Erro desconhecido';
    if (errorMessage.includes('Cannot find module')) {
      throw new Error(
        `Bibliotecas de PDF não instaladas. Por favor, execute no terminal:\n` +
        `cd frontend\n` +
        `npm install jspdf html2canvas\n` +
        `Depois, reinicie o servidor de desenvolvimento.`
      );
    }
    throw new Error(`Erro ao carregar bibliotecas PDF: ${errorMessage}`);
  }
};

// Traduções
const translations = {
  pt: {
    title: 'Análise Semanal de IA',
    subtitle: 'Análise inteligente de produtos mais e menos vendidos',
    refresh: 'Atualizar Análise',
    exportPdf: 'Exportar PDF',
    period: 'Período',
    selectPeriod: 'Selecionar Período',
    startDate: 'Data Início',
    endDate: 'Data Fim',
    applyPeriod: 'Aplicar Período',
    resetPeriod: 'Semana Atual',
    topSelling: 'Produtos Mais Vendidos',
    leastSelling: 'Produtos Menos Vendidos',
    productAnalysis: 'Análise do Produto Mais Vendido',
    recommendation: 'Recomendação',
    promotion: 'Promoção',
    increase: 'Acréscimo',
    currentPrice: 'Preço Atual',
    newPrice: 'Novo Preço',
    changePercent: 'Alteração',
    reason: 'Razão',
    statistics: 'Estatísticas',
    quantitySold: 'Quantidade Vendida',
    totalRevenue: 'Receita Total',
    profitMargin: 'Margem de Lucro',
    avgWeekly: 'Média Semanal',
    growth: 'Crescimento',
    stockDays: 'Dias de Estoque',
    expectedImpact: 'Impacto Esperado',
    currentRevenue: 'Receita Atual',
    estimatedRevenue: 'Receita Estimada',
    currentQuantity: 'Quantidade Atual',
    estimatedQuantity: 'Quantidade Estimada',
    summary: 'Resumo',
    totalProductsSold: 'Total de Produtos Vendidos',
    productsNoSales: 'Produtos Sem Venda',
    totalWeekRevenue: 'Receita Total da Semana',
    noData: 'Nenhum dado disponível para análise',
    loading: 'Carregando análise...',
    error: 'Erro ao carregar análise',
    product: 'Produto',
    code: 'Código',
    price: 'Preço',
    stock: 'Estoque',
    category: 'Categoria',
    quantity: 'Quantidade',
    revenue: 'Receita',
    margin: 'Margem',
    noRecommendation: 'Nenhuma recomendação disponível no momento',
    priceRecommendations: 'Recomendações de Preço',
    increaseRecommendations: 'Produtos para Aumentar Preço',
    decreaseRecommendations: 'Produtos para Reduzir Preço',
    newMargin: 'Nova Margem',
    minMargin: 'Margem Mínima',
    applyRecommendation: 'Aplicar Recomendação'
  },
  en: {
    title: 'Weekly AI Analysis',
    subtitle: 'Intelligent analysis of best and least selling products',
    refresh: 'Refresh Analysis',
    exportPdf: 'Export PDF',
    period: 'Period',
    selectPeriod: 'Select Period',
    startDate: 'Start Date',
    endDate: 'End Date',
    applyPeriod: 'Apply Period',
    resetPeriod: 'Current Week',
    topSelling: 'Top Selling Products',
    leastSelling: 'Least Selling Products',
    productAnalysis: 'Top Product Analysis',
    recommendation: 'Recommendation',
    promotion: 'Promotion',
    increase: 'Price Increase',
    currentPrice: 'Current Price',
    newPrice: 'New Price',
    changePercent: 'Change',
    reason: 'Reason',
    statistics: 'Statistics',
    quantitySold: 'Quantity Sold',
    totalRevenue: 'Total Revenue',
    profitMargin: 'Profit Margin',
    avgWeekly: 'Weekly Average',
    growth: 'Growth',
    stockDays: 'Stock Days',
    expectedImpact: 'Expected Impact',
    currentRevenue: 'Current Revenue',
    estimatedRevenue: 'Estimated Revenue',
    currentQuantity: 'Current Quantity',
    estimatedQuantity: 'Estimated Quantity',
    summary: 'Summary',
    totalProductsSold: 'Total Products Sold',
    productsNoSales: 'Products with No Sales',
    totalWeekRevenue: 'Total Week Revenue',
    noData: 'No data available for analysis',
    loading: 'Loading analysis...',
    error: 'Error loading analysis',
    product: 'Product',
    code: 'Code',
    price: 'Price',
    stock: 'Stock',
    category: 'Category',
    quantity: 'Quantity',
    revenue: 'Revenue',
    margin: 'Margin',
    noRecommendation: 'No recommendation available at this time',
    priceRecommendations: 'Price Recommendations',
    increaseRecommendations: 'Products to Increase Price',
    decreaseRecommendations: 'Products to Decrease Price',
    newMargin: 'New Margin',
    minMargin: 'Minimum Margin',
    applyRecommendation: 'Apply Recommendation'
  }
};

const IAAnalise = () => {
  const [language, setLanguage] = useState('pt');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [erroData, setErroData] = useState('');
  const t = translations[language];

  // Calcular semana atual por padrão
  const getSemanaAtual = () => {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diaSemana);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);
    
    return {
      inicio: inicioSemana.toISOString().split('T')[0],
      fim: fimSemana.toISOString().split('T')[0]
    };
  };

  // Inicializar com semana atual
  useEffect(() => {
    if (!dataInicio && !dataFim) {
      const semana = getSemanaAtual();
      setDataInicio(semana.inicio);
      setDataFim(semana.fim);
    }
  }, [dataInicio, dataFim]);

  const { data: analise, isLoading, error, refetch } = useQuery(
    ['ia-analise-semanal', dataInicio, dataFim],
    () => iaAnaliseService.getAnaliseSemanal({ 
      dataInicio: dataInicio || undefined, 
      dataFim: dataFim || undefined 
    }),
    {
      enabled: !!dataInicio && !!dataFim,
      onError: (error) => {
        console.error('Erro ao carregar análise:', error);
        toast.error(t.error);
      },
      refetchOnWindowFocus: false
    }
  );

  const validarDatas = (inicio, fim) => {
    if (!inicio || !fim) {
      return { valido: false, mensagem: language === 'pt' ? 'Selecione as datas de início e fim' : 'Select start and end dates' };
    }

    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999); // Fim do dia de hoje
    
    const dataInicioObj = new Date(inicio);
    const dataFimObj = new Date(fim);

    // Verificar se alguma data está no futuro
    if (dataInicioObj > hoje) {
      return { valido: false, mensagem: language === 'pt' ? 'A data de início não pode estar no futuro' : 'Start date cannot be in the future' };
    }

    if (dataFimObj > hoje) {
      return { valido: false, mensagem: language === 'pt' ? 'A data de fim não pode estar no futuro' : 'End date cannot be in the future' };
    }

    // Verificar se data de início é maior que data de fim
    if (dataInicioObj > dataFimObj) {
      return { valido: false, mensagem: language === 'pt' ? 'A data de início não pode ser maior que a data de fim' : 'Start date cannot be greater than end date' };
    }

    return { valido: true, mensagem: '' };
  };

  const handleDataInicioChange = (e) => {
    const novaDataInicio = e.target.value;
    setDataInicio(novaDataInicio);
    
    if (novaDataInicio && dataFim) {
      const validacao = validarDatas(novaDataInicio, dataFim);
      setErroData(validacao.mensagem);
    } else {
      setErroData('');
    }
  };

  const handleDataFimChange = (e) => {
    const novaDataFim = e.target.value;
    setDataFim(novaDataFim);
    
    if (dataInicio && novaDataFim) {
      const validacao = validarDatas(dataInicio, novaDataFim);
      setErroData(validacao.mensagem);
    } else {
      setErroData('');
    }
  };

  const handleRefresh = () => {
    const validacao = validarDatas(dataInicio, dataFim);
    
    if (!validacao.valido) {
      toast.error(validacao.mensagem);
      setErroData(validacao.mensagem);
      return;
    }

    setErroData('');
    refetch();
    toast.success(language === 'pt' ? 'Análise atualizada!' : 'Analysis refreshed!');
  };

  const handleResetPeriod = () => {
    const semana = getSemanaAtual();
    setDataInicio(semana.inicio);
    setDataFim(semana.fim);
  };

  const handleExportPDF = async () => {
    try {
      toast.loading(language === 'pt' ? 'Gerando PDF...' : 'Generating PDF...');
      
      // Verificar se o elemento existe
      const element = document.getElementById('analise-content');
      if (!element) {
        toast.dismiss();
        toast.error(language === 'pt' ? 'Conteúdo não encontrado para exportação' : 'Content not found for export');
        return;
      }

      // Verificar se o elemento está visível
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        toast.dismiss();
        toast.error(language === 'pt' ? 'Conteúdo não está visível' : 'Content is not visible');
        return;
      }

      // Scroll para o elemento para garantir que está visível
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      await new Promise(resolve => setTimeout(resolve, 300));

      // Carregar bibliotecas dinamicamente
      const { jsPDF: PDF, html2canvas: html2canvasLib } = await loadPDFLibraries();
      
      // Verificar se as bibliotecas foram carregadas corretamente
      if (!PDF || !html2canvasLib) {
        toast.dismiss();
        toast.error(language === 'pt' ? 'Erro ao carregar bibliotecas de PDF' : 'Error loading PDF libraries');
        return;
      }

      // Aguardar um pouco para garantir que o conteúdo está renderizado
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capturar o elemento como imagem
      const canvas = await html2canvasLib(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      if (!canvas) {
        toast.dismiss();
        toast.error(language === 'pt' ? 'Erro ao capturar imagem' : 'Error capturing image');
        return;
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      
      if (!imgData || imgData === 'data:,') {
        toast.dismiss();
        toast.error(language === 'pt' ? 'Erro ao gerar imagem do conteúdo' : 'Error generating content image');
        return;
      }
      
      // Criar PDF - tentar diferentes formas de inicialização
      let pdf;
      try {
        // Tentar forma moderna (versão 2.x)
        if (PDF && typeof PDF === 'function') {
          try {
            pdf = new PDF({
              orientation: 'portrait',
              unit: 'mm',
              format: 'a4'
            });
          } catch (e) {
            // Fallback para forma antiga
            pdf = new PDF('p', 'mm', 'a4');
          }
        } else {
          throw new Error('PDF não é uma função válida');
        }
      } catch (error) {
        console.error('Erro ao criar PDF:', error);
        toast.dismiss();
        toast.error(language === 'pt' ? 'Erro ao criar documento PDF' : 'Error creating PDF document');
        return;
      }
      
      const pdfWidth = 210; // Largura A4 em mm
      const pdfHeight = 297; // Altura A4 em mm
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Adicionar primeira página
      try {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } catch (error) {
        // Tentar forma alternativa
        console.warn('Tentando forma alternativa de addImage:', error);
        pdf.addImage(imgData, 0, 0, imgWidth, imgHeight);
      }
      
      // Adicionar páginas adicionais se necessário
      let heightLeft = imgHeight;
      let position = 0;
      
      while (heightLeft >= pdfHeight) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        try {
          pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
        } catch (error) {
          pdf.addImage(imgData, 0, -position, imgWidth, imgHeight);
        }
        heightLeft -= pdfHeight;
      }

      const fileName = language === 'pt' 
        ? `analise-ia-${new Date().toISOString().split('T')[0]}.pdf`
        : `ai-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Salvar PDF
      try {
        if (typeof pdf.save === 'function') {
          pdf.save(fileName);
        } else if (typeof pdf.output === 'function') {
          // Fallback - usar output para gerar blob
          try {
            const pdfBlob = pdf.output('blob');
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }, 100);
          } catch (outputError) {
            // Último fallback - usar data URI
            const pdfDataUri = pdf.output('datauristring');
            const link = document.createElement('a');
            link.href = pdfDataUri;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              document.body.removeChild(link);
            }, 100);
          }
        } else {
          throw new Error('Métodos save e output não disponíveis');
        }
        toast.dismiss();
        toast.success(language === 'pt' ? 'PDF exportado com sucesso!' : 'PDF exported successfully!');
      } catch (saveError) {
        console.error('Erro ao salvar PDF:', saveError);
        toast.dismiss();
        toast.error(language === 'pt' ? `Erro ao salvar PDF: ${saveError.message}` : `Error saving PDF: ${saveError.message}`);
      }
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.dismiss();
      
      let errorMessage = error.message || 'Erro desconhecido';
      
      // Mensagem mais amigável se for erro de módulo não encontrado
      if (errorMessage.includes('Cannot find module') || errorMessage.includes('não instaladas')) {
        errorMessage = language === 'pt'
          ? 'Bibliotecas de PDF não instaladas. Execute: cd frontend && npm install jspdf html2canvas'
          : 'PDF libraries not installed. Run: cd frontend && npm install jspdf html2canvas';
      }
      
      toast.error(
        language === 'pt' 
          ? `Erro ao exportar PDF: ${errorMessage}` 
          : `Error exporting PDF: ${errorMessage}`
      );
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !analise) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
          {t.error}
        </h3>
        <button
          onClick={handleRefresh}
          className="mt-4 btn btn-primary"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t.refresh}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary-600" />
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
            className="btn btn-secondary flex items-center gap-2"
            title={language === 'pt' ? 'Switch to English' : 'Mudar para Português'}
          >
            <Languages className="h-4 w-4" />
            {language === 'pt' ? 'EN' : 'PT'}
          </button>
          <button
            onClick={handleRefresh}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t.refresh}
          </button>
          <button
            onClick={handleExportPDF}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t.exportPdf}
          </button>
        </div>
      </div>

      {/* Seletor de Período */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {t.selectPeriod}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.startDate}
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={handleDataInicioChange}
              max={new Date().toISOString().split('T')[0]}
              className={`input ${erroData ? 'border-red-500' : ''}`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.endDate}
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={handleDataFimChange}
              max={new Date().toISOString().split('T')[0]}
              className={`input ${erroData ? 'border-red-500' : ''}`}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleRefresh}
              className="btn btn-primary w-full"
              disabled={!dataInicio || !dataFim || !!erroData}
            >
              {t.applyPeriod}
            </button>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleResetPeriod}
              className="btn btn-secondary w-full"
            >
              {t.resetPeriod}
            </button>
          </div>
        </div>
        {erroData && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400">
            {erroData}
          </div>
        )}
      </div>

      {/* Content for PDF export */}
      <div 
        id="analise-content" 
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6"
        style={{ minHeight: '100px' }}
      >
        {/* Period */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t.period}: {analise.periodo?.descricao || `${formatDate(analise.periodo?.inicio)} - ${formatDate(analise.periodo?.fim)}`}
          </h2>
        </div>

        {/* Summary */}
        {analise.resumo && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.totalProductsSold}</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analise.resumo.totalProdutosVendidos}
              </p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.productsNoSales}</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {analise.resumo.totalProdutosSemVenda}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">{t.totalWeekRevenue}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(analise.resumo.receitaTotalSemana)}
              </p>
            </div>
          </div>
        )}

        {/* Top Selling Products */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            {t.topSelling}
          </h2>
          {analise.produtosMaisVendidos && analise.produtosMaisVendidos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.product}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.code}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.quantity}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.revenue}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.margin}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {analise.produtosMaisVendidos.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.produto?.nome}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.produto?.codigo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.quantidadeVendida}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.receitaTotal)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.margemPercentual.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'pt' 
                  ? 'Nenhum produto vendido no período selecionado' 
                  : 'No products sold in the selected period'}
              </p>
            </div>
          )}
        </div>

        {/* Least Selling Products */}
        {analise.produtosMenosVendidos && analise.produtosMenosVendidos.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              {t.leastSelling}
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.product}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.code}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.quantity}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.stock}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {t.price}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {analise.produtosMenosVendidos.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.produto?.nome}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.produto?.codigo}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.quantidadeVendida}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {item.produto?.estoque}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(item.produto?.precoVenda)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Analysis */}
        {analise.analiseProdutoMaisVendido && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary-600" />
              {t.productAnalysis}
            </h2>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {analise.analiseProdutoMaisVendido.produto?.nome}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.code}: {analise.analiseProdutoMaisVendido.produto?.codigo}
              </p>
            </div>

            {/* Statistics */}
            {analise.analiseProdutoMaisVendido.estatisticas && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.quantitySold}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {analise.analiseProdutoMaisVendido.estatisticas.quantidadeVendida}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.totalRevenue}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatCurrency(analise.analiseProdutoMaisVendido.estatisticas.receitaTotal)}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.profitMargin}</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {analise.analiseProdutoMaisVendido.estatisticas.margemPercentual.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.growth}</p>
                  <p className={`text-lg font-semibold ${
                    analise.analiseProdutoMaisVendido.estatisticas.crescimento > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {analise.analiseProdutoMaisVendido.estatisticas.crescimento.toFixed(1)}%
                  </p>
                </div>
              </div>
            )}

            {/* Recommendation */}
            {analise.analiseProdutoMaisVendido.recomendacao ? (
              <div className={`p-4 rounded-lg border-2 ${
                analise.analiseProdutoMaisVendido.recomendacao.tipo === 'PROMOCAO'
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  {analise.analiseProdutoMaisVendido.recomendacao.tipo === 'PROMOCAO' ? (
                    <TrendingDown className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  )}
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {t.recommendation}: {analise.analiseProdutoMaisVendido.recomendacao.tipo === 'PROMOCAO' ? t.promotion : t.increase}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t.currentPrice}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(analise.analiseProdutoMaisVendido.recomendacao.precoAtual)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{t.newPrice}</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(analise.analiseProdutoMaisVendido.recomendacao.novoPreco)}
                    </p>
                    <p className={`text-sm font-medium ${
                      analise.analiseProdutoMaisVendido.recomendacao.percentualAlteracao > 0
                        ? 'text-blue-600'
                        : 'text-green-600'
                    }`}>
                      {analise.analiseProdutoMaisVendido.recomendacao.percentualAlteracao > 0 ? '+' : ''}
                      {analise.analiseProdutoMaisVendido.recomendacao.percentualAlteracao}%
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.reason}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {analise.analiseProdutoMaisVendido.recomendacao.razao}
                  </p>
                </div>

                {analise.analiseProdutoMaisVendido.recomendacao.impactoEsperado && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.expectedImpact}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.currentRevenue}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(analise.analiseProdutoMaisVendido.recomendacao.impactoEsperado.receitaAtual)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.estimatedRevenue}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(analise.analiseProdutoMaisVendido.recomendacao.impactoEsperado.receitaEstimada)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">{t.noRecommendation}</p>
              </div>
            )}
          </div>
        )}

        {/* Recomendações de Aumento de Preço */}
        {analise.recomendacoesAumento && analise.recomendacoesAumento.length > 0 && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {t.increaseRecommendations}
            </h2>
            <div className="space-y-4">
              {analise.recomendacoesAumento.map((item, index) => (
                <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {item.produto?.nome}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t.code}: {item.produto?.codigo} | {t.quantity}: {item.quantidadeVendida} | {t.margin}: {item.margemPercentual.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {item.recomendacao && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.currentPrice}</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(item.recomendacao.precoAtual)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.newPrice}</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatCurrency(item.recomendacao.novoPreco)}
                        </p>
                        <p className="text-sm font-medium text-blue-600">
                          +{item.recomendacao.percentualAlteracao}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.estimatedRevenue}</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(item.recomendacao.impactoEsperado.receitaEstimada)}
                        </p>
                      </div>
                    </div>
                  )}
                  {item.recomendacao && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                      {item.recomendacao.razao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recomendações de Redução de Preço */}
        {analise.recomendacoesReducao && analise.recomendacoesReducao.length > 0 && (
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-green-600" />
              {t.decreaseRecommendations}
            </h2>
            <div className="space-y-4">
              {analise.recomendacoesReducao.map((item, index) => (
                <div key={index} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {item.produto?.nome}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t.code}: {item.produto?.codigo} | {t.quantity}: {item.quantidadeVendida} | {t.margin}: {item.margemPercentual.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {item.recomendacao && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.currentPrice}</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.recomendacao.precoAtual)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.newPrice}</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(item.recomendacao.novoPreco)}
                          </p>
                          <p className="text-sm font-medium text-green-600">
                            {item.recomendacao.percentualAlteracao}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.newMargin}</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {item.recomendacao.novaMargem}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t.estimatedRevenue}</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(item.recomendacao.impactoEsperado.receitaEstimada)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {item.recomendacao.razao}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IAAnalise;

