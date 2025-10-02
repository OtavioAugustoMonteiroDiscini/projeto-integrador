import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Bell, AlertTriangle, CheckCircle, X, Trash2, Eye, EyeOff } from 'lucide-react';
import { alertaService } from '../services/alertaService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Alertas = () => {
  const [filtroLido, setFiltroLido] = useState('false');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Buscar alertas
  const { 
    data: alertasData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['alertas', { lido: filtroLido, page }],
    () => alertaService.listar({ lido: filtroLido, page, limit: 10 }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error('Erro ao carregar alertas');
      }
    }
  );

  // Contar alertas não lidos
  const { data: countData } = useQuery(
    'alertas-nao-lidos',
    alertaService.contarNaoLidos,
    {
      refetchInterval: 30000, // Atualizar a cada 30 segundos
    }
  );

  // Marcar como lido
  const marcarComoLidoMutation = useMutation(
    (id) => alertaService.marcarComoLido(id),
    {
      onSuccess: () => {
        toast.success('Alerta marcado como lido');
        queryClient.invalidateQueries(['alertas']);
        queryClient.invalidateQueries('alertas-nao-lidos');
      },
      onError: () => {
        toast.error('Erro ao marcar alerta como lido');
      }
    }
  );

  // Marcar todos como lidos
  const marcarTodosComoLidosMutation = useMutation(
    () => alertaService.marcarTodosComoLidos(),
    {
      onSuccess: () => {
        toast.success('Todos os alertas foram marcados como lidos');
        queryClient.invalidateQueries(['alertas']);
        queryClient.invalidateQueries('alertas-nao-lidos');
      },
      onError: () => {
        toast.error('Erro ao marcar alertas como lidos');
      }
    }
  );

  // Excluir alerta
  const excluirAlertaMutation = useMutation(
    (id) => alertaService.excluir(id),
    {
      onSuccess: () => {
        toast.success('Alerta excluído');
        queryClient.invalidateQueries(['alertas']);
        queryClient.invalidateQueries('alertas-nao-lidos');
      },
      onError: () => {
        toast.error('Erro ao excluir alerta');
      }
    }
  );

  const alertas = alertasData?.alertas || [];
  const totalAlertas = alertasData?.pagination?.total || 0;
  const alertasNaoLidos = countData?.count || 0;

  const getPrioridadeIcon = (prioridade) => {
    switch (prioridade) {
      case 'ALTA':
        return <AlertTriangle className="h-4 w-4 text-danger-600" />;
      case 'MEDIA':
        return <AlertTriangle className="h-4 w-4 text-warning-600" />;
      case 'BAIXA':
        return <Bell className="h-4 w-4 text-info-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPrioridadeBadge = (prioridade) => {
    switch (prioridade) {
      case 'ALTA':
        return 'badge-danger';
      case 'MEDIA':
        return 'badge-warning';
      case 'BAIXA':
        return 'badge-info';
      default:
        return 'badge-info';
    }
  };

  const getPrioridadeText = (prioridade) => {
    switch (prioridade) {
      case 'ALTA':
        return 'Alta';
      case 'MEDIA':
        return 'Média';
      case 'BAIXA':
        return 'Baixa';
      default:
        return prioridade;
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'ESTOQUE_BAIXO':
        return <AlertTriangle className="h-5 w-5 text-warning-600" />;
      case 'VENCIMENTO':
        return <Bell className="h-5 w-5 text-danger-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTipoText = (tipo) => {
    switch (tipo) {
      case 'ESTOQUE_BAIXO':
        return 'Estoque Baixo';
      case 'VENCIMENTO':
        return 'Vencimento';
      default:
        return tipo;
    }
  };

  const handleMarcarComoLido = (id) => {
    marcarComoLidoMutation.mutate(id);
  };

  const handleMarcarTodosComoLidos = () => {
    if (window.confirm('Tem certeza que deseja marcar todos os alertas como lidos?')) {
      marcarTodosComoLidosMutation.mutate();
    }
  };

  const handleExcluir = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este alerta?')) {
      excluirAlertaMutation.mutate(id);
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
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-600">Acompanhe os alertas do sistema</p>
        </div>
        {alertasNaoLidos > 0 && (
          <button
            onClick={handleMarcarTodosComoLidos}
            disabled={marcarTodosComoLidosMutation.isLoading}
            className="btn btn-primary"
          >
            {marcarTodosComoLidosMutation.isLoading ? (
              <LoadingSpinner size="sm" className="mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Marcar Todos como Lidos
          </button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Bell className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total de Alertas</h3>
                <p className="text-2xl font-bold text-gray-900">{totalAlertas}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-warning-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Não Lidos</h3>
                <p className="text-2xl font-bold text-gray-900">{alertasNaoLidos}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-success-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Lidos</h3>
                <p className="text-2xl font-bold text-gray-900">{totalAlertas - alertasNaoLidos}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroLido('false')}
              className={`btn btn-sm ${filtroLido === 'false' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Não Lidos
            </button>
            <button
              onClick={() => setFiltroLido('true')}
              className={`btn btn-sm ${filtroLido === 'true' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Lidos
            </button>
            <button
              onClick={() => setFiltroLido('all')}
              className={`btn btn-sm ${filtroLido === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Lista de Alertas</h3>
        </div>
        <div className="card-body">
          {alertas.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {filtroLido === 'false' ? 'Nenhum alerta não lido' : 
                 filtroLido === 'true' ? 'Nenhum alerta lido' : 'Nenhum alerta no momento'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filtroLido === 'false' ? 'Todos os alertas foram lidos!' : 
                 'Você será notificado quando houver alertas importantes.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alertas.map((alerta) => (
                <div 
                  key={alerta.id} 
                  className={`p-4 rounded-lg border ${
                    alerta.lido 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white border-warning-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getTipoIcon(alerta.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {alerta.titulo}
                          </h4>
                          <span className={`badge ${getPrioridadeBadge(alerta.prioridade)} flex items-center gap-1`}>
                            {getPrioridadeIcon(alerta.prioridade)}
                            {getPrioridadeText(alerta.prioridade)}
                          </span>
                          <span className="badge badge-info">
                            {getTipoText(alerta.tipo)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {alerta.mensagem}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(alerta.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!alerta.lido && (
                        <button
                          onClick={() => handleMarcarComoLido(alerta.id)}
                          disabled={marcarComoLidoMutation.isLoading}
                          className="text-success-600 hover:text-success-800"
                          title="Marcar como lido"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleExcluir(alerta.id)}
                        disabled={excluirAlertaMutation.isLoading}
                        className="text-danger-600 hover:text-danger-800"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {alertasData?.pagination && alertasData.pagination.pages > 1 && (
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
                  Página {page} de {alertasData.pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === alertasData.pagination.pages}
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

export default Alertas;
