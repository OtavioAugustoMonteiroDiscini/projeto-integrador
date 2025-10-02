import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { ArrowLeft, Save, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { contaPagarService } from '../services/contaPagarService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const NovaContaPagar = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    descricao: '',
    fornecedor: '',
    valor: '',
    dataVencimento: '',
    observacoes: ''
  });

  const [errors, setErrors] = useState({});

  // Criar conta a pagar
  const createContaMutation = useMutation(
    (contaData) => contaPagarService.criar(contaData),
    {
      onSuccess: () => {
        toast.success('Conta a pagar registrada com sucesso!');
        navigate('/contas-pagar');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao registrar conta a pagar');
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.fornecedor.trim()) {
      newErrors.fornecedor = 'Fornecedor é obrigatório';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.dataVencimento) {
      newErrors.dataVencimento = 'Data de vencimento é obrigatória';
    } else {
      const dataVencimento = new Date(formData.dataVencimento);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      if (dataVencimento < hoje) {
        newErrors.dataVencimento = 'Data de vencimento não pode ser anterior a hoje';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    const contaData = {
      ...formData,
      valor: parseFloat(formData.valor),
      dataVencimento: new Date(formData.dataVencimento).toISOString()
    };

    createContaMutation.mutate(contaData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/contas-pagar"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Conta a Pagar</h1>
          <p className="text-gray-600">Registre uma nova conta a pagar</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Dados da Conta</h3>
            </div>
            <div className="card-body space-y-6">
              <div>
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  className={`input ${errors.descricao ? 'border-danger-500' : ''}`}
                  placeholder="Ex: Compra de produtos, Serviço contratado, etc."
                />
                {errors.descricao && <p className="mt-1 text-sm text-danger-600">{errors.descricao}</p>}
              </div>

              <div>
                <label htmlFor="fornecedor" className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor *
                </label>
                <input
                  type="text"
                  id="fornecedor"
                  name="fornecedor"
                  value={formData.fornecedor}
                  onChange={handleInputChange}
                  className={`input ${errors.fornecedor ? 'border-danger-500' : ''}`}
                  placeholder="Nome do fornecedor"
                />
                {errors.fornecedor && <p className="mt-1 text-sm text-danger-600">{errors.fornecedor}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                    Valor *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                    <input
                      type="number"
                      id="valor"
                      name="valor"
                      value={formData.valor}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className={`input pl-8 ${errors.valor ? 'border-danger-500' : ''}`}
                      placeholder="0,00"
                    />
                  </div>
                  {errors.valor && <p className="mt-1 text-sm text-danger-600">{errors.valor}</p>}
                </div>

                <div>
                  <label htmlFor="dataVencimento" className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento *
                  </label>
                  <input
                    type="date"
                    id="dataVencimento"
                    name="dataVencimento"
                    value={formData.dataVencimento}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`input ${errors.dataVencimento ? 'border-danger-500' : ''}`}
                  />
                  {errors.dataVencimento && <p className="mt-1 text-sm text-danger-600">{errors.dataVencimento}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={4}
                  className="input"
                  placeholder="Informações adicionais sobre a conta..."
                />
              </div>
            </div>
          </div>

          {/* Resumo */}
          {formData.valor && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Resumo</h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fornecedor:</span>
                    <span className="text-sm font-medium">{formData.fornecedor || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <span className="text-sm font-medium">
                      R$ {parseFloat(formData.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vencimento:</span>
                    <span className="text-sm font-medium">
                      {formData.dataVencimento ? 
                        new Date(formData.dataVencimento).toLocaleDateString('pt-BR') : 
                        '-'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <Link
              to="/contas-pagar"
              className="btn btn-secondary"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createContaMutation.isLoading}
              className="btn btn-primary"
            >
              {createContaMutation.isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Registrando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Registrar Conta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaContaPagar;