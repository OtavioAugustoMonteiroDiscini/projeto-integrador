import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, ShoppingCart, Search, X, CheckCircle, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { vendaService } from '../services/vendaService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Vendas = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Buscar vendas
  const { 
    data: vendasData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['vendas', { search: searchTerm, status: statusFilter, page }],
    () => vendaService.listar({ 
      search: searchTerm, 
      status: statusFilter, 
      page, 
      limit: 10 
    }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error('Erro ao carregar vendas');
      }
    }
  );

  const vendas = vendasData?.vendas || [];
  const totalVendas = vendasData?.pagination?.total || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONCLUIDA':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'PENDENTE':
        return <Clock className="h-4 w-4 text-warning-600" />;
      case 'CANCELADA':
        return <X className="h-4 w-4 text-danger-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONCLUIDA':
        return 'badge-success';
      case 'PENDENTE':
        return 'badge-warning';
      case 'CANCELADA':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'CONCLUIDA':
        return 'Concluída';
      case 'PENDENTE':
        return 'Pendente';
      case 'CANCELADA':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta venda?')) {
      try {
        await vendaService.cancelar(id);
        toast.success('Venda cancelada com sucesso!');
        refetch();
      } catch (error) {
        toast.error('Erro ao cancelar venda');
        console.error('Erro ao cancelar venda:', error);
      }
    }
  };

  // Concluir venda
  const concluirVendaMutation = useMutation(
    (id) => vendaService.atualizarStatus(id, { status: 'CONCLUIDA' }),
    {
      onSuccess: () => {
        toast.success('Venda concluída com sucesso!');
        queryClient.invalidateQueries('vendas');
      },
      onError: (error) => {
        toast.error('Erro ao concluir venda');
        console.error('Erro ao concluir venda:', error);
      }
    }
  );

  const handleConcluir = (id) => {
    concluirVendaMutation.mutate(id);
  };

  const getFormaPagamentoText = (forma) => {
    switch (forma) {
      case 'DINHEIRO':
        return 'Dinheiro';
      case 'CARTAO':
        return 'Cartão';
      case 'PIX':
        return 'PIX';
      case 'BOLETO':
        return 'Boleto';
      default:
        return forma;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-600">Gerencie suas vendas</p>
        </div>
        <Link
          to="/vendas/nova"
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total de Vendas</h3>
                <p className="text-2xl font-bold text-gray-900">{totalVendas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-success-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Concluídas</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {vendas.filter(v => v.status === 'CONCLUIDA').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-warning-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Pendentes</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {vendas.filter(v => v.status === 'PENDENTE').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-success-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Valor Total</h3>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {vendas.reduce((total, venda) => total + parseFloat(venda.valorTotal), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Buscar por cliente, número da venda..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </button>
            </form>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange('')}
                className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Todas
              </button>
              <button
                onClick={() => handleStatusChange('CONCLUIDA')}
                className={`btn btn-sm ${statusFilter === 'CONCLUIDA' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Concluídas
              </button>
              <button
                onClick={() => handleStatusChange('PENDENTE')}
                className={`btn btn-sm ${statusFilter === 'PENDENTE' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Pendentes
              </button>
              <button
                onClick={() => handleStatusChange('CANCELADA')}
                className={`btn btn-sm ${statusFilter === 'CANCELADA' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Canceladas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Vendas */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Lista de Vendas</h3>
        </div>
        <div className="card-body">
          {vendas.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || statusFilter ? 'Nenhuma venda encontrada' : 'Nenhuma venda registrada'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Comece registrando sua primeira venda.'
                }
              </p>
              {!searchTerm && !statusFilter && (
                <div className="mt-6">
                  <Link
                    to="/vendas/nova"
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Venda
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Valor Total</th>
                    <th>Forma Pagamento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.map((venda) => (
                    <tr key={venda.id}>
                      <td className="font-mono text-sm">#{venda.numero}</td>
                      <td className="font-medium">{venda.cliente}</td>
                      <td>
                        {format(new Date(venda.dataVenda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="font-medium">
                        R$ {parseFloat(venda.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>{getFormaPagamentoText(venda.formaPagamento)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(venda.status)} flex items-center gap-1`}>
                          {getStatusIcon(venda.status)}
                          {getStatusText(venda.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          {venda.status === 'PENDENTE' && (
                            <button
                              onClick={() => handleConcluir(venda.id)}
                              className="text-success-600 hover:text-success-800"
                              title="Concluir"
                              disabled={concluirVendaMutation.isLoading}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/vendas/editar/${venda.id}`)}
                            className="text-primary-600 hover:text-primary-800"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleExcluir(venda.id)}
                            className="text-danger-600 hover:text-danger-800"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {vendasData?.pagination && vendasData.pagination.pages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn btn-secondary btn-sm"
                >
                  Anterior
                </button>
                <span className="flex items-center px-3 py-2 text-sm text-gray-700">
                  Página {page} de {vendasData.pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === vendasData.pagination.pages}
                  className="btn btn-secondary btn-sm"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vendas;
