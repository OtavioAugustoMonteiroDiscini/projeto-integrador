import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { vendaService } from '../services/vendaService';
import { produtoService } from '../services/produtoService';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const NovaVenda = () => {
  const [loading, setLoading] = useState(false);
  const [itens, setItens] = useState([]);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm();

  // Buscar produtos para seleção
  const { data: produtosData, isLoading: produtosLoading } = useQuery(
    'produtos-venda',
    () => produtoService.listar({ ativo: 'true', limit: 100 })
  );

  const produtos = produtosData?.produtos || [];

  const adicionarItem = () => {
    setItens([...itens, { produtoId: '', quantidade: 1 }]);
  };

  const removerItem = (index) => {
    const novosItens = itens.filter((_, i) => i !== index);
    setItens(novosItens);
  };

  const atualizarItem = (index, campo, valor) => {
    const novosItens = [...itens];
    novosItens[index][campo] = valor;
    setItens(novosItens);
  };

  const calcularTotal = () => {
    return itens.reduce((total, item) => {
      const produto = produtos.find(p => p.id === item.produtoId);
      if (produto) {
        return total + (produto.precoVenda * item.quantidade);
      }
      return total;
    }, 0);
  };

  const onSubmit = async (data) => {
    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item à venda');
      return;
    }

    // Validar itens
    for (const item of itens) {
      if (!item.produtoId) {
        toast.error('Selecione um produto para todos os itens');
        return;
      }
      if (item.quantidade <= 0) {
        toast.error('Quantidade deve ser maior que zero');
        return;
      }
    }

    setLoading(true);
    try {
      const vendaData = {
        ...data,
        itens: itens.map(item => {
          const produto = produtos.find(p => p.id === item.produtoId);
          return {
            produtoId: item.produtoId,
            quantidade: parseInt(item.quantidade),
            precoUnitario: produto ? produto.precoVenda : 0
          };
        })
      };

      await vendaService.criar(vendaData);
      toast.success('Venda criada com sucesso!');
      navigate('/vendas');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar venda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/vendas"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Venda</h1>
          <p className="text-gray-600">Registre uma nova venda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário da Venda */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Informações da Venda</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">
                      Cliente *
                    </label>
                    <input
                      {...register('cliente', {
                        required: 'Cliente é obrigatório',
                        minLength: {
                          value: 2,
                          message: 'Nome do cliente deve ter pelo menos 2 caracteres'
                        }
                      })}
                      type="text"
                      className="input"
                      placeholder="Nome do cliente"
                    />
                    {errors.cliente && (
                      <p className="mt-1 text-sm text-danger-600">{errors.cliente.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="formaPagamento" className="block text-sm font-medium text-gray-700 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      {...register('formaPagamento')}
                      className="input"
                      defaultValue="DINHEIRO"
                    >
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="CARTAO">Cartão</option>
                      <option value="PIX">PIX</option>
                      <option value="BOLETO">Boleto</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="desconto" className="block text-sm font-medium text-gray-700 mb-1">
                      Desconto (R$)
                    </label>
                    <input
                      {...register('desconto', {
                        min: {
                          value: 0,
                          message: 'Desconto deve ser positivo'
                        }
                      })}
                      type="number"
                      step="0.01"
                      min="0"
                      className="input"
                      placeholder="0,00"
                      defaultValue="0"
                    />
                    {errors.desconto && (
                      <p className="mt-1 text-sm text-danger-600">{errors.desconto.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    {...register('observacoes')}
                    rows={3}
                    className="input"
                    placeholder="Observações da venda"
                  />
                </div>
              </div>
            </div>

            {/* Itens da Venda */}
            <div className="card">
              <div className="card-header">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Itens da Venda</h3>
                  <button
                    type="button"
                    onClick={adicionarItem}
                    className="btn btn-primary btn-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </button>
                </div>
              </div>
              <div className="card-body">
                {itens.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item adicionado</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Clique em "Adicionar Item" para começar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itens.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <select
                            value={item.produtoId}
                            onChange={(e) => atualizarItem(index, 'produtoId', e.target.value)}
                            className="input"
                          >
                            <option value="">Selecione um produto</option>
                            {produtos.map((produto) => (
                              <option key={produto.id} value={produto.id}>
                                {produto.nome} - R$ {produto.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => atualizarItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                            className="input"
                            placeholder="Qtd"
                          />
                        </div>
                        <div className="w-32 text-right">
                          {item.produtoId && (
                            <p className="text-sm font-medium text-gray-900">
                              R$ {(() => {
                                const produto = produtos.find(p => p.id === item.produtoId);
                                return produto ? (produto.precoVenda * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00';
                              })()}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removerItem(index)}
                          className="text-danger-600 hover:text-danger-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumo da Venda */}
          <div className="lg:col-span-1">
            <div className="card sticky top-6">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Resumo da Venda</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Subtotal:</span>
                    <span className="text-sm font-medium">
                      R$ {calcularTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Desconto:</span>
                    <span className="text-sm font-medium text-danger-600">
                      - R$ {(watch('desconto') || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">Total:</span>
                    <span className="text-base font-bold text-gray-900">
                      R$ {(calcularTotal() - (watch('desconto') || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={loading || itens.length === 0}
                    className="btn btn-primary w-full"
                  >
                    {loading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {loading ? 'Salvando...' : 'Finalizar Venda'}
                  </button>
                  
                  <Link
                    to="/vendas"
                    className="btn btn-secondary w-full"
                  >
                    Cancelar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NovaVenda;
