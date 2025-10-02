import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, Package, AlertTriangle, Search, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { produtoService } from '../services/produtoService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Produtos = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  // Buscar produtos
  const { 
    data: produtosData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery(
    ['produtos', { search: searchTerm, page }],
    () => produtoService.listar({ search: searchTerm, page, limit: 10 }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error('Erro ao carregar produtos');
      }
    }
  );

  // Buscar produtos com estoque baixo
  const { data: estoqueBaixoData } = useQuery(
    'produtos-estoque-baixo',
    produtoService.produtosEstoqueBaixo,
    {
      onError: (error) => {
        console.error('Erro ao carregar produtos com estoque baixo:', error);
      }
    }
  );

  const produtos = produtosData?.produtos || [];
  const totalProdutos = produtosData?.pagination?.total || 0;
  const produtosEstoqueBaixo = estoqueBaixoData?.produtos || [];

  // Calcular valor total do estoque
  const valorTotalEstoque = produtos.reduce((total, produto) => {
    return total + (produto.precoCusto * produto.estoque);
  }, 0);

  // Alternar status do produto (ativo/inativo)
  const toggleStatusMutation = useMutation(
    (id) => produtoService.alternarStatus(id),
    {
      onSuccess: () => {
        toast.success('Status do produto atualizado!');
        queryClient.invalidateQueries('produtos');
      },
      onError: (error) => {
        toast.error('Erro ao atualizar status do produto');
        console.error('Erro ao alternar status:', error);
      }
    }
  );

  const handleToggleStatus = (id) => {
    toggleStatusMutation.mutate(id);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await produtoService.excluir(id);
        toast.success('Produto excluído com sucesso!');
        refetch();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Erro ao excluir produto');
      }
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
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-600">Gerencie seu catálogo de produtos</p>
        </div>
        <Link
          to="/produtos/novo"
          className="btn btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Link>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-primary-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Total de Produtos</h3>
                <p className="text-2xl font-bold text-gray-900">{totalProdutos}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-warning-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Estoque Baixo</h3>
                <p className="text-2xl font-bold text-gray-900">{produtosEstoqueBaixo.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-success-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Valor Total Estoque</h3>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar produtos por nome, código ou descrição..."
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
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Lista de Produtos</h3>
        </div>
        <div className="card-body">
          {produtos.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca.' 
                  : 'Comece criando seu primeiro produto.'
                }
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Link
                    to="/produtos/novo"
                    className="btn btn-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Produto
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Código</th>
                    <th>Categoria</th>
                    <th>Preço Venda</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtos.map((produto) => (
                    <tr key={produto.id}>
                      <td>
                        <div>
                          <div className="font-medium text-gray-900">{produto.nome}</div>
                          {produto.descricao && (
                            <div className="text-sm text-gray-500">{produto.descricao}</div>
                          )}
                        </div>
                      </td>
                      <td className="font-mono text-sm">{produto.codigo}</td>
                      <td>{produto.categoria || '-'}</td>
                      <td>
                        R$ {produto.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div className="flex items-center">
                          <span className={produto.estoque <= produto.estoqueMin ? 'text-warning-600 font-medium' : ''}>
                            {produto.estoque} {produto.unidade}
                          </span>
                          {produto.estoque <= produto.estoqueMin && (
                            <AlertTriangle className="h-4 w-4 text-warning-600 ml-1" />
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${produto.ativo ? 'badge-success' : 'badge-danger'}`}>
                          {produto.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleStatus(produto.id)}
                            className={`${produto.ativo ? 'text-success-600 hover:text-success-800' : 'text-warning-600 hover:text-warning-800'}`}
                            title={produto.ativo ? 'Desativar' : 'Ativar'}
                            disabled={toggleStatusMutation.isLoading}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/produtos/editar/${produto.id}`)}
                            className="text-primary-600 hover:text-primary-800"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleExcluir(produto.id)}
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
          {produtosData?.pagination && produtosData.pagination.pages > 1 && (
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
                  Página {page} de {produtosData.pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === produtosData.pagination.pages}
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

export default Produtos;
