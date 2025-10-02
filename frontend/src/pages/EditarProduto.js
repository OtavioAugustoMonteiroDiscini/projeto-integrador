import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { produtoService } from '../services/produtoService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const EditarProduto = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    descricao: '',
    categoria: '',
    precoCusto: '',
    precoVenda: '',
    estoque: '',
    estoqueMin: '',
    unidade: '',
    marca: '',
    ativo: true
  });

  const [errors, setErrors] = useState({});

  // Buscar produto
  const { data: produto, isLoading: loadingProduto } = useQuery(
    ['produto', id],
    () => produtoService.buscar(id),
    {
      enabled: !!id,
      onSuccess: (data) => {
        if (data) {
          setFormData({
            nome: data.nome || '',
            codigo: data.codigo || '',
            descricao: data.descricao || '',
            categoria: data.categoria || '',
            precoCusto: data.precoCusto?.toString() || '',
            precoVenda: data.precoVenda?.toString() || '',
            estoque: data.estoque?.toString() || '',
            estoqueMin: data.estoqueMin?.toString() || '',
            unidade: data.unidade || '',
            marca: data.marca || '',
            ativo: data.ativo ?? true
          });
        }
      },
      onError: () => {
        toast.error('Erro ao carregar produto');
        navigate('/produtos');
      }
    }
  );

  // Atualizar produto
  const updateProdutoMutation = useMutation(
    (data) => produtoService.atualizar(id, data),
    {
      onSuccess: () => {
        toast.success('Produto atualizado com sucesso!');
        queryClient.invalidateQueries(['produtos']);
        queryClient.invalidateQueries(['produto', id]);
        navigate('/produtos');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Erro ao atualizar produto');
      }
    }
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.codigo.trim()) {
      newErrors.codigo = 'Código é obrigatório';
    }

    if (!formData.precoCusto || parseFloat(formData.precoCusto) < 0) {
      newErrors.precoCusto = 'Preço de custo deve ser um valor válido';
    }

    if (!formData.precoVenda || parseFloat(formData.precoVenda) < 0) {
      newErrors.precoVenda = 'Preço de venda deve ser um valor válido';
    }

    if (!formData.estoque || parseInt(formData.estoque) < 0) {
      newErrors.estoque = 'Estoque deve ser um valor válido';
    }

    if (!formData.estoqueMin || parseInt(formData.estoqueMin) < 0) {
      newErrors.estoqueMin = 'Estoque mínimo deve ser um valor válido';
    }

    if (!formData.unidade.trim()) {
      newErrors.unidade = 'Unidade é obrigatória';
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

    const produtoData = {
      ...formData,
      precoCusto: parseFloat(formData.precoCusto),
      precoVenda: parseFloat(formData.precoVenda),
      estoque: parseInt(formData.estoque),
      estoqueMin: parseInt(formData.estoqueMin)
    };

    updateProdutoMutation.mutate(produtoData);
  };

  if (loadingProduto) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
          <p className="text-gray-600">Atualize as informações do produto</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`input ${errors.nome ? 'border-danger-500' : ''}`}
                  placeholder="Digite o nome do produto"
                />
                {errors.nome && <p className="mt-1 text-sm text-danger-600">{errors.nome}</p>}
              </div>

              {/* Código */}
              <div>
                <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
                  Código *
                </label>
                <input
                  type="text"
                  id="codigo"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  className={`input ${errors.codigo ? 'border-danger-500' : ''}`}
                  placeholder="Digite o código do produto"
                />
                {errors.codigo && <p className="mt-1 text-sm text-danger-600">{errors.codigo}</p>}
              </div>

              {/* Categoria */}
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <input
                  type="text"
                  id="categoria"
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Digite a categoria"
                />
              </div>

              {/* Marca */}
              <div>
                <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  id="marca"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Digite a marca"
                />
              </div>

              {/* Preço de Custo */}
              <div>
                <label htmlFor="precoCusto" className="block text-sm font-medium text-gray-700 mb-2">
                  Preço de Custo *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    id="precoCusto"
                    name="precoCusto"
                    value={formData.precoCusto}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`input pl-8 ${errors.precoCusto ? 'border-danger-500' : ''}`}
                    placeholder="0,00"
                  />
                </div>
                {errors.precoCusto && <p className="mt-1 text-sm text-danger-600">{errors.precoCusto}</p>}
              </div>

              {/* Preço de Venda */}
              <div>
                <label htmlFor="precoVenda" className="block text-sm font-medium text-gray-700 mb-2">
                  Preço de Venda *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    id="precoVenda"
                    name="precoVenda"
                    value={formData.precoVenda}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className={`input pl-8 ${errors.precoVenda ? 'border-danger-500' : ''}`}
                    placeholder="0,00"
                  />
                </div>
                {errors.precoVenda && <p className="mt-1 text-sm text-danger-600">{errors.precoVenda}</p>}
              </div>

              {/* Estoque */}
              <div>
                <label htmlFor="estoque" className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque Atual *
                </label>
                <input
                  type="number"
                  id="estoque"
                  name="estoque"
                  value={formData.estoque}
                  onChange={handleInputChange}
                  min="0"
                  className={`input ${errors.estoque ? 'border-danger-500' : ''}`}
                  placeholder="0"
                />
                {errors.estoque && <p className="mt-1 text-sm text-danger-600">{errors.estoque}</p>}
              </div>

              {/* Estoque Mínimo */}
              <div>
                <label htmlFor="estoqueMin" className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque Mínimo *
                </label>
                <input
                  type="number"
                  id="estoqueMin"
                  name="estoqueMin"
                  value={formData.estoqueMin}
                  onChange={handleInputChange}
                  min="0"
                  className={`input ${errors.estoqueMin ? 'border-danger-500' : ''}`}
                  placeholder="0"
                />
                {errors.estoqueMin && <p className="mt-1 text-sm text-danger-600">{errors.estoqueMin}</p>}
              </div>

              {/* Unidade */}
              <div>
                <label htmlFor="unidade" className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade *
                </label>
                <select
                  id="unidade"
                  name="unidade"
                  value={formData.unidade}
                  onChange={handleInputChange}
                  className={`input ${errors.unidade ? 'border-danger-500' : ''}`}
                >
                  <option value="">Selecione a unidade</option>
                  <option value="UN">Unidade (UN)</option>
                  <option value="KG">Quilograma (KG)</option>
                  <option value="G">Grama (G)</option>
                  <option value="L">Litro (L)</option>
                  <option value="ML">Mililitro (ML)</option>
                  <option value="M">Metro (M)</option>
                  <option value="CM">Centímetro (CM)</option>
                  <option value="CX">Caixa (CX)</option>
                  <option value="PC">Peça (PC)</option>
                  <option value="DZ">Dúzia (DZ)</option>
                </select>
                {errors.unidade && <p className="mt-1 text-sm text-danger-600">{errors.unidade}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ativo"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ativo" className="ml-2 block text-sm text-gray-900">
                    Produto ativo
                  </label>
                </div>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                rows={4}
                className="input"
                placeholder="Digite uma descrição detalhada do produto"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Link
                to="/produtos"
                className="btn btn-secondary"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={updateProdutoMutation.isLoading}
                className="btn btn-primary"
              >
                {updateProdutoMutation.isLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditarProduto;
