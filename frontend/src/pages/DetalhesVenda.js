import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Edit, X, Printer, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { vendaService } from '../services/vendaService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DetalhesVenda = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Buscar venda
  const { data: venda, isLoading, error } = useQuery(
    ['venda', id],
    () => vendaService.buscar(id),
    {
      enabled: !!id,
      onError: () => {
        toast.error('Erro ao carregar venda');
        navigate('/vendas');
      }
    }
  );

  // Cancelar venda
  const cancelarVendaMutation = useMutation(
    () => vendaService.cancelar(id),
    {
      onSuccess: () => {
        toast.success('Venda cancelada com sucesso!');
        queryClient.invalidateQueries(['vendas']);
        queryClient.invalidateQueries(['venda', id]);
        navigate('/vendas');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao cancelar venda');
      }
    }
  );

  const handleCancelar = () => {
    if (window.confirm('Tem certeza que deseja cancelar esta venda? Esta ação não pode ser desfeita.')) {
      cancelarVendaMutation.mutate();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'CONCLUIDA':
        return <CheckCircle className="h-5 w-5 text-success-600" />;
      case 'PENDENTE':
        return <Clock className="h-5 w-5 text-warning-600" />;
      case 'CANCELADA':
        return <X className="h-5 w-5 text-danger-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !venda) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Venda não encontrada</h3>
        <p className="mt-1 text-sm text-gray-500">
          A venda solicitada não foi encontrada ou você não tem permissão para visualizá-la.
        </p>
        <div className="mt-6">
          <Link to="/vendas" className="btn btn-primary">
            Voltar para Vendas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/vendas"
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Venda #{venda.numero}
            </h1>
            <p className="text-gray-600">
              {format(new Date(venda.dataVenda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className={`badge ${getStatusBadge(venda.status)} flex items-center gap-1`}>
            {getStatusIcon(venda.status)}
            {getStatusText(venda.status)}
          </span>
          
          {venda.status !== 'CANCELADA' && (
            <div className="flex space-x-2">
              <button
                onClick={() => window.print()}
                className="btn btn-secondary"
                title="Imprimir"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </button>
              
              {venda.status === 'PENDENTE' && (
                <>
                  <Link
                    to={`/vendas/editar/${venda.id}`}
                    className="btn btn-primary"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Link>
                  
                  <button
                    onClick={handleCancelar}
                    disabled={cancelarVendaMutation.isLoading}
                    className="btn btn-danger"
                    title="Cancelar"
                  >
                    {cancelarVendaMutation.isLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <X className="h-4 w-4 mr-2" />
                    )}
                    Cancelar
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações da Venda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados do Cliente */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Dados do Cliente</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cliente</label>
                  <p className="mt-1 text-sm text-gray-900">{venda.cliente}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Forma de Pagamento</label>
                  <p className="mt-1 text-sm text-gray-900">{getFormaPagamentoText(venda.formaPagamento)}</p>
                </div>
                {venda.observacoes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Observações</label>
                    <p className="mt-1 text-sm text-gray-900">{venda.observacoes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Itens da Venda */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Itens da Venda</h3>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Quantidade</th>
                      <th>Preço Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venda.itens?.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div>
                            <div className="font-medium text-gray-900">
                              {item.produto?.nome || 'Produto não encontrado'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Código: {item.produto?.codigo || 'N/A'}
                            </div>
                          </div>
                        </td>
                        <td className="text-center">{item.quantidade}</td>
                        <td>
                          R$ {parseFloat(item.precoUnitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="font-medium">
                          R$ {parseFloat(item.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Resumo Financeiro</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subtotal:</span>
                <span className="text-sm font-medium">
                  R$ {parseFloat(venda.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              {venda.desconto > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Desconto:</span>
                  <span className="text-sm font-medium text-danger-600">
                    - R$ {parseFloat(venda.desconto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-medium text-gray-900">Total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    R$ {parseFloat(venda.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Informações</h3>
            </div>
            <div className="card-body space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Data da Venda</label>
                <p className="mt-1 text-sm text-gray-900">
                  {format(new Date(venda.dataVenda), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Número da Venda</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">#{venda.numero}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">
                  <span className={`badge ${getStatusBadge(venda.status)} flex items-center gap-1 w-fit`}>
                    {getStatusIcon(venda.status)}
                    {getStatusText(venda.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesVenda;
