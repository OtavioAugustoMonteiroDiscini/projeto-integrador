import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, DollarSign, Search, CheckCircle, Clock, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { contaReceberService } from '../services/contaReceberService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ContasReceber = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Buscar contas a receber
  const { 
    data: contasData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['contas-receber', { search: searchTerm, status: statusFilter, page }],
    () => contaReceberService.listar({ 
      search: searchTerm, 
      status: statusFilter, 
      page, 
      limit: 10 
    }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error('Erro ao carregar contas a receber');
      }
    }
  );

  // Marcar como recebida
  const marcarComoRecebidaMutation = useMutation(
    ({ id, dataRecebimento }) => contaReceberService.marcarComoRecebida(id, dataRecebimento),
    {
      onSuccess: () => {
        toast.success('Conta marcada como recebida');
        queryClient.invalidateQueries(['contas-receber']);
      },
      onError: () => {
        toast.error('Erro ao marcar conta como recebida');
      }
    }
  );

  // Excluir conta
  const excluirContaMutation = useMutation(
    (id) => contaReceberService.excluir(id),
    {
      onSuccess: () => {
        toast.success('Conta excluída');
        queryClient.invalidateQueries(['contas-receber']);
      },
      onError: () => {
        toast.error('Erro ao excluir conta');
      }
    }
  );

  const contas = contasData?.contas || [];
  const totalContas = contasData?.pagination?.total || 0;

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleStatusChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  const handleMarcarComoRecebida = (id) => {
    const dataRecebimento = new Date().toISOString().split('T')[0];
    if (window.confirm('Tem certeza que deseja marcar esta conta como recebida?')) {
      marcarComoRecebidaMutation.mutate({ id, dataRecebimento });
    }
  };

  const handleExcluir = (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      excluirContaMutation.mutate(id);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'RECEBIDO':
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'PENDENTE':
        return <Clock className="h-4 w-4 text-warning-600" />;
      case 'VENCIDA':
        return <AlertTriangle className="h-4 w-4 text-danger-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RECEBIDO':
        return 'badge-success';
      case 'PENDENTE':
        return 'badge-warning';
      case 'VENCIDA':
        return 'badge-danger';
      default:
        return 'badge-info';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'RECEBIDO':
        return 'Recebida';
      case 'PENDENTE':
        return 'Pendente';
      case 'VENCIDA':
        return 'Vencida';
      default:
        return status;
    }
  };

  const isVencida = (dataVencimento) => {
    return new Date(dataVencimento) < new Date();
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
          <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
          <p className="text-gray-600">Gerencie suas contas a receber</p>
        </div>
        <Link
          to="/contas-receber/nova"
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Conta
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total de Contas</h3>
                <p className="text-2xl font-bold text-gray-900">{totalContas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-success-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Recebidas</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {contas.filter(c => c.status === 'RECEBIDO').length}
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
                  {contas.filter(c => c.status === 'PENDENTE').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-danger-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Vencidas</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {contas.filter(c => isVencida(c.dataVencimento) && c.status !== 'RECEBIDO').length}
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
                  placeholder="Buscar por descrição, cliente..."
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
                onClick={() => handleStatusChange('RECEBIDO')}
                className={`btn btn-sm ${statusFilter === 'RECEBIDO' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Recebidas
              </button>
              <button
                onClick={() => handleStatusChange('PENDENTE')}
                className={`btn btn-sm ${statusFilter === 'PENDENTE' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Pendentes
              </button>
              <button
                onClick={() => handleStatusChange('VENCIDA')}
                className={`btn btn-sm ${statusFilter === 'VENCIDA' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Vencidas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Contas */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Lista de Contas a Receber</h3>
        </div>
        <div className="card-body">
          {contas.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || statusFilter ? 'Nenhuma conta encontrada' : 'Nenhuma conta a receber registrada'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Comece registrando sua primeira conta a receber.'
                }
              </p>
              {!searchTerm && !statusFilter && (
                <div className="mt-6">
                  <Link
                    to="/contas-receber/nova"
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Conta
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Cliente</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contas.map((conta) => (
                    <tr key={conta.id}>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">{conta.descricao}</div>
                          {conta.observacoes && (
                            <div className="text-sm text-gray-500">{conta.observacoes}</div>
                          )}
                        </div>
                      </td>
                      <td className="font-medium">{conta.cliente}</td>
                      <td className="font-medium">
                        R$ {parseFloat(conta.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div className={`${isVencida(conta.dataVencimento) && conta.status !== 'RECEBIDO' ? 'text-danger-600 font-medium' : ''}`}>
                          {format(new Date(conta.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(conta.status)} flex items-center gap-1`}>
                          {getStatusIcon(conta.status)}
                          {getStatusText(conta.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          {conta.status !== 'RECEBIDO' && (
                            <button
                              onClick={() => handleMarcarComoRecebida(conta.id)}
                              className="text-success-600 hover:text-success-800"
                              title="Marcar como Recebida"
                              disabled={marcarComoRecebidaMutation.isLoading}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/contas-receber/editar/${conta.id}`)}
                            className="text-primary-600 hover:text-primary-800"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleExcluir(conta.id)}
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
          {contasData?.pagination && contasData.pagination.pages > 1 && (
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
                  Página {page} de {contasData.pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === contasData.pagination.pages}
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

export default ContasReceber;
