import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, ShoppingBag, Search, X, CheckCircle, Clock, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { compraService } from '../services/compraService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Compras = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Buscar compras
  const { 
    data: comprasData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['compras', { search: searchTerm, status: statusFilter, page }],
    () => compraService.listar({ 
      search: searchTerm, 
      status: statusFilter, 
      page, 
      limit: 10 
    }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error('Erro ao carregar compras');
      }
    }
  );

  const compras = comprasData?.compras || [];
  const totalCompras = comprasData?.pagination?.total || 0;

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

  const handleExcluir = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta compra?')) {
      try {
        await compraService.excluir(id);
        toast.success('Compra excluída com sucesso!');
        refetch();
      } catch (error) {
        toast.error('Erro ao excluir compra');
        console.error('Erro ao excluir compra:', error);
      }
    }
  };

  // Concluir compra
  const concluirCompraMutation = useMutation(
    (id) => compraService.atualizarStatus(id, { status: 'CONCLUIDA' }),
    {
      onSuccess: () => {
        toast.success('Compra concluída com sucesso!');
        queryClient.invalidateQueries('compras');
      },
      onError: (error) => {
        toast.error('Erro ao concluir compra');
        console.error('Erro ao concluir compra:', error);
      }
    }
  );

  const handleConcluir = (id) => {
    concluirCompraMutation.mutate(id);
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
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-600">Gerencie suas compras</p>
        </div>
        <Link
          to="/compras/nova"
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Compra
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total de Compras</h3>
                <p className="text-2xl font-bold text-gray-900">{totalCompras}</p>
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
                  {compras.filter(c => c.status === 'CONCLUIDA').length}
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
                  {compras.filter(c => c.status === 'PENDENTE').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-success-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Valor Total</h3>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {compras.reduce((total, compra) => total + parseFloat(compra.valorTotal), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  placeholder="Buscar por fornecedor, número da compra..."
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

      {/* Lista de Compras */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Lista de Compras</h3>
        </div>
        <div className="card-body">
          {compras.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || statusFilter ? 'Nenhuma compra encontrada' : 'Nenhuma compra registrada'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Comece registrando sua primeira compra.'
                }
              </p>
              {!searchTerm && !statusFilter && (
                <div className="mt-6">
                  <Link
                    to="/compras/nova"
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Compra
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
                    <th>Fornecedor</th>
                    <th>Data</th>
                    <th>Valor Total</th>
                    <th>Forma Pagamento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((compra) => (
                    <tr key={compra.id}>
                      <td className="font-mono text-sm">#{compra.numero}</td>
                      <td className="font-medium">{compra.fornecedor}</td>
                      <td>
                        {format(new Date(compra.dataCompra), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="font-medium">
                        R$ {parseFloat(compra.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>{getFormaPagamentoText(compra.formaPagamento)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(compra.status)} flex items-center gap-1`}>
                          {getStatusIcon(compra.status)}
                          {getStatusText(compra.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          {compra.status === 'PENDENTE' && (
                            <button
                              onClick={() => handleConcluir(compra.id)}
                              className="text-success-600 hover:text-success-800"
                              title="Concluir"
                              disabled={concluirCompraMutation.isLoading}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/compras/editar/${compra.id}`)}
                            className="text-primary-600 hover:text-primary-800"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleExcluir(compra.id)}
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
          {comprasData?.pagination && comprasData.pagination.pages > 1 && (
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
                  Página {page} de {comprasData.pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === comprasData.pagination.pages}
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

export default Compras;
