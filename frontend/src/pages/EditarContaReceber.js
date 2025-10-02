import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { contaReceberService } from '../services/contaReceberService';
import LoadingSpinner from '../components/LoadingSpinner';

const EditarContaReceber = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  // Buscar dados da conta
  const { data: conta, isLoading: contaLoading } = useQuery(
    ['conta-receber', id],
    () => contaReceberService.buscar(id),
    {
      onSuccess: (data) => {
        if (data) {
          setValue('descricao', data.descricao);
          setValue('cliente', data.cliente);
          setValue('valor', data.valor);
          setValue('dataVencimento', data.dataVencimento ? new Date(data.dataVencimento).toISOString().split('T')[0] : '');
          setValue('dataRecebimento', data.dataRecebimento ? new Date(data.dataRecebimento).toISOString().split('T')[0] : '');
          setValue('status', data.status);
          setValue('observacoes', data.observacoes || '');
        }
      },
      onError: (error) => {
        toast.error('Erro ao carregar conta a receber');
        console.error('Erro ao carregar conta:', error);
      }
    }
  );

  const atualizarContaMutation = useMutation(
    (data) => contaReceberService.atualizar(id, data),
    {
      onSuccess: () => {
        toast.success('Conta a receber atualizada com sucesso!');
        queryClient.invalidateQueries('contas-receber');
        navigate('/contas-receber');
      },
      onError: (error) => {
        const errorMessage = error.response?.data?.error || 'Erro ao atualizar conta a receber';
        toast.error(errorMessage);
        console.error('Erro ao atualizar conta:', error.response?.data || error.message);
      }
    }
  );

  const onSubmit = (data) => {
    const formattedData = {
      ...data,
      valor: parseFloat(data.valor),
      dataVencimento: new Date(data.dataVencimento).toISOString(),
      dataRecebimento: data.dataRecebimento ? new Date(data.dataRecebimento).toISOString() : null,
    };
    atualizarContaMutation.mutate(formattedData);
  };

  if (contaLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!conta) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Conta a receber não encontrada</p>
        <Link to="/contas-receber" className="btn btn-primary mt-4">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/contas-receber"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Conta a Receber</h1>
          <p className="text-gray-600">Atualize as informações da conta</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Dados da Conta</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="descricao" className="label">Descrição *</label>
              <input
                type="text"
                id="descricao"
                {...register('descricao', { required: 'Descrição é obrigatória' })}
                className="input"
              />
              {errors.descricao && <p className="text-danger-600 text-sm mt-1">{errors.descricao.message}</p>}
            </div>
            <div>
              <label htmlFor="cliente" className="label">Cliente *</label>
              <input
                type="text"
                id="cliente"
                {...register('cliente', { required: 'Cliente é obrigatório' })}
                className="input"
              />
              {errors.cliente && <p className="text-danger-600 text-sm mt-1">{errors.cliente.message}</p>}
            </div>
            <div>
              <label htmlFor="valor" className="label">Valor *</label>
              <input
                type="number"
                id="valor"
                step="0.01"
                {...register('valor', {
                  required: 'Valor é obrigatório',
                  min: { value: 0.01, message: 'Valor deve ser positivo' }
                })}
                className="input"
              />
              {errors.valor && <p className="text-danger-600 text-sm mt-1">{errors.valor.message}</p>}
            </div>
            <div>
              <label htmlFor="dataVencimento" className="label">Data de Vencimento *</label>
              <input
                type="date"
                id="dataVencimento"
                {...register('dataVencimento', { required: 'Data de vencimento é obrigatória' })}
                className="input"
              />
              {errors.dataVencimento && <p className="text-danger-600 text-sm mt-1">{errors.dataVencimento.message}</p>}
            </div>
            <div>
              <label htmlFor="dataRecebimento" className="label">Data de Recebimento</label>
              <input
                type="date"
                id="dataRecebimento"
                {...register('dataRecebimento')}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="status" className="label">Status</label>
              <select
                id="status"
                {...register('status')}
                className="input"
              >
                <option value="PENDENTE">Pendente</option>
                <option value="RECEBIDA">Recebida</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label htmlFor="observacoes" className="label">Observações</label>
              <textarea
                id="observacoes"
                rows="3"
                {...register('observacoes')}
                className="input"
                placeholder="Observações da conta a receber"
              ></textarea>
              {errors.observacoes && <p className="text-danger-600 text-sm mt-1">{errors.observacoes.message}</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link to="/contas-receber" className="btn btn-secondary">
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={atualizarContaMutation.isLoading}
          >
            {atualizarContaMutation.isLoading ? <LoadingSpinner size="sm" /> : <DollarSign className="h-4 w-4 mr-2" />}
            {atualizarContaMutation.isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarContaReceber;
