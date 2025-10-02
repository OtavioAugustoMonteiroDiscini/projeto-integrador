import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'react-query';
import { ArrowLeft, Plus, Trash2, Save, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { compraService } from '../services/compraService';
import { produtoService } from '../services/produtoService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const NovaCompra = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fornecedor: '',
    formaPagamento: 'DINHEIRO',
    desconto: 0,
    observacoes: ''
  });

  const [itens, setItens] = useState([]);
  const [errors, setErrors] = useState({});

  // Buscar produtos para seleção
  const { data: produtosData } = useQuery(
    'produtos-para-compra',
    () => produtoService.listar({ limit: 1000 }),
    {
      onError: () => {
        toast.error('Erro ao carregar produtos');
      }
    }
  );

  // Criar compra
  const createCompraMutation = useMutation(
    (compraData) => compraService.criar(compraData),
    {
      onSuccess: () => {
        toast.success('Compra registrada com sucesso!');
        navigate('/compras');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao registrar compra');
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

  const adicionarItem = () => {
    setItens(prev => [...prev, {
      produtoId: '',
      quantidade: 1,
      precoUnitario: 0,
      subtotal: 0
    }]);
  };

  const removerItem = (index) => {
    setItens(prev => prev.filter((_, i) => i !== index));
  };

  const atualizarItem = (index, field, value) => {
    setItens(prev => {
      const novosItens = [...prev];
      novosItens[index] = {
        ...novosItens[index],
        [field]: value
      };

      // Calcular subtotal
      if (field === 'quantidade' || field === 'precoUnitario') {
        const quantidade = field === 'quantidade' ? parseFloat(value) : novosItens[index].quantidade;
        const precoUnitario = field === 'precoUnitario' ? parseFloat(value) : novosItens[index].precoUnitario;
        novosItens[index].subtotal = quantidade * precoUnitario;
      }

      return novosItens;
    });
  };

  const calcularTotais = () => {
    const subtotal = itens.reduce((total, item) => total + (item.subtotal || 0), 0);
    const desconto = parseFloat(formData.desconto) || 0;
    const total = subtotal - desconto;
    
    return { subtotal, desconto, total };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fornecedor.trim()) {
      newErrors.fornecedor = 'Fornecedor é obrigatório';
    }

    if (itens.length === 0) {
      newErrors.itens = 'Adicione pelo menos um item';
    }

    itens.forEach((item, index) => {
      if (!item.produtoId) {
        newErrors[`item_${index}_produto`] = 'Selecione um produto';
      }
      if (!item.quantidade || item.quantidade <= 0) {
        newErrors[`item_${index}_quantidade`] = 'Quantidade deve ser maior que zero';
      }
      if (!item.precoUnitario || item.precoUnitario <= 0) {
        newErrors[`item_${index}_preco`] = 'Preço deve ser maior que zero';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    const { subtotal, desconto, total } = calcularTotais();

    const compraData = {
      ...formData,
      itens: itens.map(item => ({
        produtoId: item.produtoId,
        quantidade: parseInt(item.quantidade),
        precoUnitario: parseFloat(item.precoUnitario)
      })),
      subtotal,
      desconto: parseFloat(desconto),
      valorTotal: total
    };

    createCompraMutation.mutate(compraData);
  };

  const { subtotal, desconto, total } = calcularTotais();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/compras"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Compra</h1>
          <p className="text-gray-600">Registre uma nova compra</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados da Compra */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Dados da Compra</h3>
              </div>
              <div className="card-body space-y-4">
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
                    placeholder="Digite o nome do fornecedor"
                  />
                  {errors.fornecedor && <p className="mt-1 text-sm text-danger-600">{errors.fornecedor}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="formaPagamento" className="block text-sm font-medium text-gray-700 mb-2">
                      Forma de Pagamento
                    </label>
                    <select
                      id="formaPagamento"
                      name="formaPagamento"
                      value={formData.formaPagamento}
                      onChange={handleInputChange}
                      className="input"
                    >
                      <option value="DINHEIRO">Dinheiro</option>
                      <option value="CARTAO">Cartão</option>
                      <option value="PIX">PIX</option>
                      <option value="BOLETO">Boleto</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="desconto" className="block text-sm font-medium text-gray-700 mb-2">
                      Desconto (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                      <input
                        type="number"
                        id="desconto"
                        name="desconto"
                        value={formData.desconto}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="input pl-8"
                        placeholder="0,00"
                      />
                    </div>
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
                    rows={3}
                    className="input"
                    placeholder="Observações da compra"
                  />
                </div>
              </div>
            </div>

            {/* Itens da Compra */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Itens da Compra</h3>
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
                {errors.itens && <p className="text-sm text-danger-600 mb-4">{errors.itens}</p>}
                
                {itens.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum item adicionado</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Clique em "Adicionar Item" para começar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {itens.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Produto *
                            </label>
                            <select
                              value={item.produtoId}
                              onChange={(e) => atualizarItem(index, 'produtoId', e.target.value)}
                              className={`input ${errors[`item_${index}_produto`] ? 'border-danger-500' : ''}`}
                            >
                              <option value="">Selecione um produto</option>
                              {produtosData?.produtos?.map((produto) => (
                                <option key={produto.id} value={produto.id}>
                                  {produto.nome} - {produto.codigo}
                                </option>
                              ))}
                            </select>
                            {errors[`item_${index}_produto`] && (
                              <p className="mt-1 text-sm text-danger-600">{errors[`item_${index}_produto`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quantidade *
                            </label>
                            <input
                              type="number"
                              value={item.quantidade}
                              onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)}
                              min="1"
                              className={`input ${errors[`item_${index}_quantidade`] ? 'border-danger-500' : ''}`}
                            />
                            {errors[`item_${index}_quantidade`] && (
                              <p className="mt-1 text-sm text-danger-600">{errors[`item_${index}_quantidade`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Preço Unit. *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                              <input
                                type="number"
                                value={item.precoUnitario}
                                onChange={(e) => atualizarItem(index, 'precoUnitario', e.target.value)}
                                step="0.01"
                                min="0"
                                className={`input pl-8 ${errors[`item_${index}_preco`] ? 'border-danger-500' : ''}`}
                              />
                            </div>
                            {errors[`item_${index}_preco`] && (
                              <p className="mt-1 text-sm text-danger-600">{errors[`item_${index}_preco`]}</p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Subtotal
                              </label>
                              <div className="p-2 bg-gray-50 rounded border text-sm font-medium">
                                R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removerItem(index)}
                              className="text-danger-600 hover:text-danger-800 p-2"
                              title="Remover item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Resumo da Compra */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Resumo da Compra</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal:</span>
                  <span className="text-sm font-medium">
                    R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Desconto:</span>
                  <span className="text-sm font-medium text-danger-600">
                    - R$ {desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-medium text-gray-900">Total:</span>
                    <span className="text-lg font-bold text-gray-900">
                      R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={createCompraMutation.isLoading || itens.length === 0}
                className="btn btn-primary w-full"
              >
                {createCompraMutation.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Registrar Compra
                  </>
                )}
              </button>
              
              <Link
                to="/compras"
                className="btn btn-secondary w-full"
              >
                Cancelar
              </Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NovaCompra;