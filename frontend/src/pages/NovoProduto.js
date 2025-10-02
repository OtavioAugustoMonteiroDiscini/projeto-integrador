import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { produtoService } from '../services/produtoService';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const NovoProduto = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await produtoService.criar(data);
      toast.success('Produto criado com sucesso!');
      navigate('/produtos');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/produtos"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
          <p className="text-gray-600">Cadastre um novo produto no sistema</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    {...register('nome', {
                      required: 'Nome é obrigatório',
                      minLength: {
                        value: 2,
                        message: 'Nome deve ter pelo menos 2 caracteres'
                      }
                    })}
                    type="text"
                    className="input"
                    placeholder="Nome do produto"
                  />
                  {errors.nome && (
                    <p className="mt-1 text-sm text-danger-600">{errors.nome.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    {...register('codigo', {
                      required: 'Código é obrigatório',
                      minLength: {
                        value: 1,
                        message: 'Código é obrigatório'
                      }
                    })}
                    type="text"
                    className="input"
                    placeholder="Código único do produto"
                  />
                  {errors.codigo && (
                    <p className="mt-1 text-sm text-danger-600">{errors.codigo.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  {...register('descricao')}
                  rows={3}
                  className="input"
                  placeholder="Descrição do produto"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <input
                    {...register('categoria')}
                    type="text"
                    className="input"
                    placeholder="Categoria"
                  />
                </div>

                <div>
                  <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
                    Marca
                  </label>
                  <input
                    {...register('marca')}
                    type="text"
                    className="input"
                    placeholder="Marca"
                  />
                </div>

                <div>
                  <label htmlFor="unidade" className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade
                  </label>
                  <select
                    {...register('unidade')}
                    className="input"
                    defaultValue="UN"
                  >
                    <option value="UN">Unidade</option>
                    <option value="KG">Quilograma</option>
                    <option value="G">Grama</option>
                    <option value="L">Litro</option>
                    <option value="ML">Mililitro</option>
                    <option value="M">Metro</option>
                    <option value="CM">Centímetro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Preços e Estoque</h3>
            </div>
            <div className="card-body space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="precoVenda" className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Venda *
                  </label>
                  <input
                    {...register('precoVenda', {
                      required: 'Preço de venda é obrigatório',
                      min: {
                        value: 0,
                        message: 'Preço deve ser positivo'
                      }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    placeholder="0,00"
                  />
                  {errors.precoVenda && (
                    <p className="mt-1 text-sm text-danger-600">{errors.precoVenda.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="precoCusto" className="block text-sm font-medium text-gray-700 mb-1">
                    Preço de Custo
                  </label>
                  <input
                    {...register('precoCusto', {
                      min: {
                        value: 0,
                        message: 'Preço deve ser positivo'
                      }
                    })}
                    type="number"
                    step="0.01"
                    min="0"
                    className="input"
                    placeholder="0,00"
                  />
                  {errors.precoCusto && (
                    <p className="mt-1 text-sm text-danger-600">{errors.precoCusto.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="estoque" className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    {...register('estoque', {
                      min: {
                        value: 0,
                        message: 'Estoque deve ser positivo'
                      }
                    })}
                    type="number"
                    min="0"
                    className="input"
                    placeholder="0"
                    defaultValue="0"
                  />
                  {errors.estoque && (
                    <p className="mt-1 text-sm text-danger-600">{errors.estoque.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="estoqueMin" className="block text-sm font-medium text-gray-700 mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    {...register('estoqueMin', {
                      min: {
                        value: 0,
                        message: 'Estoque mínimo deve ser positivo'
                      }
                    })}
                    type="number"
                    min="0"
                    className="input"
                    placeholder="5"
                    defaultValue="5"
                  />
                  {errors.estoqueMin && (
                    <p className="mt-1 text-sm text-danger-600">{errors.estoqueMin.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              to="/produtos"
              className="btn btn-secondary"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Salvando...' : 'Salvar Produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovoProduto;
