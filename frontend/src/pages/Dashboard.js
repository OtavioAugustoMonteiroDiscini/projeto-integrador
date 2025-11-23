import React from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Bell, 
  DollarSign, 
  CreditCard,
  AlertTriangle,
  ShoppingCart,
  ShoppingBag
} from 'lucide-react';
import { dashboardService } from '../services/dashboardService';
import { alertaService } from '../services/alertaService';
import LoadingSpinner from '../components/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const queryClient = useQueryClient();
  
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    'dashboard',
    dashboardService.getDashboard,
    {
      onError: (error) => {
        console.error('Erro ao carregar dashboard:', error);
      }
    }
  );

  const { data: vendasData, isLoading: vendasLoading, error: vendasError } = useQuery(
    'vendas-periodo',
    () => dashboardService.getVendasPorPeriodo({ meses: 6 }),
    {
      onError: (error) => {
        console.error('Erro ao carregar vendas por período:', error);
      }
    }
  );

  const { data: produtosData, isLoading: produtosLoading, error: produtosError } = useQuery(
    'produtos-mais-vendidos',
    () => dashboardService.getProdutosMaisVendidos({ limite: 5 }),
    {
      onError: (error) => {
        console.error('Erro ao carregar produtos mais vendidos:', error);
      }
    }
  );

  const { data: pagamentoData, isLoading: pagamentoLoading, error: pagamentoError } = useQuery(
    'vendas-forma-pagamento',
    dashboardService.getVendasPorFormaPagamento,
    {
      onError: (error) => {
        console.error('Erro ao carregar vendas por forma de pagamento:', error);
      }
    }
  );

  const { data: vendasVsComprasData, isLoading: vendasVsComprasLoading } = useQuery(
    'vendas-vs-compras',
    () => dashboardService.getVendasVsCompras({ meses: 6 }),
    {
      onError: (error) => {
        console.error('Erro ao carregar dados de vendas vs compras:', error);
      }
    }
  );

  const { data: contasPagarVsReceberData, isLoading: contasPagarVsReceberLoading } = useQuery(
    'contas-pagar-vs-receber',
    () => dashboardService.getContasPagarVsReceber({ meses: 6 }),
    {
      onError: (error) => {
        console.error('Erro ao carregar dados de contas a pagar vs receber:', error);
      }
    }
  );

  // Função para verificar alertas
  const handleVerificarAlertas = async () => {
    try {
      const response = await alertaService.verificar();
      const alertasMarcados = response?.alertasMarcadosComoLidos || 0;
      
      if (alertasMarcados > 0) {
        toast.success(`${alertasMarcados} alerta(s) marcado(s) como lido(s) e verificação concluída!`);
      } else {
        toast.success('Verificação de alertas concluída!');
      }
      
      // Invalidar queries para atualizar o dashboard
      queryClient.invalidateQueries('dashboard');
      queryClient.invalidateQueries('alertas');
    } catch (error) {
      toast.error('Erro ao verificar alertas');
      console.error('Erro ao verificar alertas:', error);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const resumo = dashboardData?.resumo;

  const stats = [
    {
      name: 'Vendas do Mês',
      value: `R$ ${resumo?.vendasMes?.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      change: resumo?.vendasMes?.quantidade || 0,
      changeType: 'positive',
      icon: ShoppingCart,
      link: '/vendas',
    },
    {
      name: 'Compras do Mês',
      value: `R$ ${resumo?.comprasMes?.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      change: resumo?.comprasMes?.quantidade || 0,
      changeType: 'negative',
      icon: ShoppingBag,
      link: '/compras',
    },
    {
      name: 'Contas a Pagar',
      value: `R$ ${resumo?.contasPagar?.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      change: resumo?.contasPagar?.quantidade || 0,
      changeType: 'negative',
      icon: CreditCard,
      link: '/contas-pagar',
    },
    {
      name: 'Contas a Receber',
      value: `R$ ${resumo?.contasReceber?.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
      change: resumo?.contasReceber?.quantidade || 0,
      changeType: 'positive',
      icon: DollarSign,
      link: '/contas-receber',
    },
    {
      name: 'Produtos Estoque Baixo',
      value: resumo?.produtosEstoqueBaixo || 0,
      change: 0,
      changeType: 'warning',
      icon: Package,
      link: '/produtos',
    },
    {
      name: 'Alertas Não Lidos',
      value: resumo?.alertasNaoLidos || 0,
      change: 0,
      changeType: 'warning',
      icon: Bell,
      link: '/alertas',
    },
  ];

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark">Dashboard</h1>
          <p className="text-dark-secondary">Visão geral do seu negócio</p>
        </div>
        <button
          onClick={handleVerificarAlertas}
          className="btn btn-primary flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Verificar Alertas
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.name} to={stat.link} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="card-body">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-8 w-8 ${
                      stat.changeType === 'positive' ? 'text-success-600' :
                      stat.changeType === 'negative' ? 'text-danger-600' :
                      'text-warning-600'
                    }`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-dark-muted truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-dark">
                        {stat.value}
                      </dd>
                      {stat.change > 0 && (
                        <dd className="text-sm text-dark-muted">
                          {stat.change} {stat.change === 1 ? 'item' : 'itens'}
                        </dd>
                      )}
                    </dl>
                  </div>
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Período */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-dark">Vendas dos Últimos 6 Meses</h3>
          </div>
          <div className="card-body">
            {vendasLoading ? (
              <LoadingSpinner />
            ) : vendasError ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Erro ao carregar dados de vendas</p>
              </div>
            ) : (!vendasData?.vendas || vendasData.vendas.length === 0) ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Nenhuma venda encontrada no período</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={vendasData.vendas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Vendas']}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Vendas por Forma de Pagamento */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-dark">Vendas por Forma de Pagamento</h3>
          </div>
          <div className="card-body">
            {pagamentoLoading ? (
              <LoadingSpinner />
            ) : pagamentoError ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Erro ao carregar dados de pagamento</p>
              </div>
            ) : (!pagamentoData?.vendasPorPagamento || pagamentoData.vendasPorPagamento.length === 0) ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Nenhuma venda encontrada</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pagamentoData.vendasPorPagamento}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ formaPagamento, _sum }) => `${formaPagamento}: R$ ${_sum.valorTotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="_sum.valorTotal"
                  >
                    {pagamentoData.vendasPorPagamento.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Produtos Mais Vendidos */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Produtos Mais Vendidos</h3>
        </div>
        <div className="card-body">
          {produtosLoading ? (
            <LoadingSpinner />
          ) : produtosError ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>Erro ao carregar produtos mais vendidos</p>
            </div>
          ) : (!produtosData?.produtos || produtosData.produtos.length === 0) ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>Nenhum produto vendido ainda</p>
            </div>
          ) : (
            <div className="space-y-4">
              {produtosData.produtos.map((item, index) => (
                <div key={item.produtoId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {item.produto?.nome || 'Produto não encontrado'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Código: {item.produto?.codigo || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {item._sum.quantidade} unidades
                    </p>
                    <p className="text-sm text-gray-500">
                      R$ {item._sum.subtotal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Novos Gráficos - Vendas vs Compras e Contas a Pagar vs Receber */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Vendas vs Compras */}
        <div className="bg-dark rounded-lg shadow-sm border-dark p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-dark">Vendas vs Compras (6 meses)</h3>
          </div>
          <div className="h-80">
            {vendasVsComprasLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : (!vendasVsComprasData?.dados || vendasVsComprasData.dados.length === 0) ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Nenhum dado encontrado</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={vendasVsComprasData.dados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="mes" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                      name === 'vendas' ? 'Vendas (R$)' : 'Compras (R$)'
                    ]}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="#22c55e" 
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    name="Vendas (R$)"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="compras" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name="Compras (R$)"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico Contas a Pagar vs Receber */}
        <div className="bg-dark rounded-lg shadow-sm border-dark p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-dark">Contas a Pagar vs Receber</h3>
          </div>
          <div className="h-80">
            {contasPagarVsReceberLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner />
              </div>
            ) : (!contasPagarVsReceberData?.dados || contasPagarVsReceberData.dados.length === 0) ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Nenhum dado encontrado</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contasPagarVsReceberData.dados} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="mes" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                      name === 'aPagar' ? 'A Pagar (R$)' : 'A Receber (R$)'
                    ]}
                    labelFormatter={(label) => `Mês: ${label}`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="aPagar" 
                    fill="#ef4444" 
                    name="A Pagar (R$)"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="aReceber" 
                    fill="#22c55e" 
                    name="A Receber (R$)"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
