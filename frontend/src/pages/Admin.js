import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Building2, 
  Users, 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  CreditCard, 
  DollarSign, 
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { adminService } from '../services/adminService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import EmpresaForm from '../components/EmpresaForm';
import EmpresaDetails from '../components/EmpresaDetails';
import ConfirmModal from '../components/ConfirmModal';
import ExportButton from '../components/ExportButton';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Admin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [empresaToDelete, setEmpresaToDelete] = useState(null);
  const queryClient = useQueryClient();

  // Buscar estatísticas
  const { data: statsData, isLoading: statsLoading } = useQuery(
    'admin-stats',
    adminService.getEstatisticas,
    {
      onError: (error) => {
        console.error('Erro ao carregar estatísticas:', error);
      }
    }
  );

  // Buscar empresas
  const { 
    data: empresasData, 
    isLoading: empresasLoading, 
    error: empresasError,
    refetch 
  } = useQuery(
    ['admin-empresas', { search: searchTerm, ativo: statusFilter, page }],
    () => adminService.listarEmpresas({ 
      search: searchTerm, 
      ativo: statusFilter, 
      page, 
      limit: 10 
    }),
    {
      keepPreviousData: true,
      onError: (error) => {
        toast.error('Erro ao carregar empresas');
      }
    }
  );

  // Criar empresa
  const criarEmpresaMutation = useMutation(
    (dados) => adminService.criarEmpresa(dados),
    {
      onSuccess: () => {
        toast.success('Empresa criada com sucesso!');
        queryClient.invalidateQueries('admin-empresas');
        queryClient.invalidateQueries('admin-stats');
        setShowCreateModal(false);
      },
      onError: (error) => {
        toast.error('Erro ao criar empresa');
        console.error('Erro ao criar empresa:', error);
      }
    }
  );

  // Atualizar empresa
  const atualizarEmpresaMutation = useMutation(
    ({ id, dados }) => adminService.atualizarEmpresa(id, dados),
    {
      onSuccess: () => {
        toast.success('Empresa atualizada com sucesso!');
        queryClient.invalidateQueries('admin-empresas');
        queryClient.invalidateQueries('admin-stats');
        setShowEditModal(false);
        setSelectedEmpresa(null);
      },
      onError: (error) => {
        toast.error('Erro ao atualizar empresa');
        console.error('Erro ao atualizar empresa:', error);
      }
    }
  );

  // Excluir empresa
  const excluirEmpresaMutation = useMutation(
    (id) => adminService.excluirEmpresa(id),
    {
      onSuccess: () => {
        toast.success('Empresa excluída com sucesso!');
        queryClient.invalidateQueries('admin-empresas');
        queryClient.invalidateQueries('admin-stats');
      },
      onError: (error) => {
        toast.error('Erro ao excluir empresa');
        console.error('Erro ao excluir empresa:', error);
      }
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleExcluir = (empresa) => {
    setEmpresaToDelete(empresa);
    setShowDeleteModal(true);
  };

  const confirmarExclusao = () => {
    if (empresaToDelete) {
      excluirEmpresaMutation.mutate(empresaToDelete.id);
      setShowDeleteModal(false);
      setEmpresaToDelete(null);
    }
  };

  const cancelarExclusao = () => {
    setShowDeleteModal(false);
    setEmpresaToDelete(null);
  };

  const toggleStatusEmpresa = async (empresa) => {
    try {
      await adminService.atualizarEmpresa(empresa.id, {
        ...empresa,
        ativo: !empresa.ativo
      });
      toast.success(`Empresa ${empresa.ativo ? 'desativada' : 'ativada'} com sucesso!`);
      queryClient.invalidateQueries('admin-empresas');
      queryClient.invalidateQueries('admin-stats');
    } catch (error) {
      toast.error('Erro ao alterar status da empresa');
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleEditar = (empresa) => {
    setSelectedEmpresa(empresa);
    setShowEditModal(true);
  };

  const handleVisualizar = (empresa) => {
    setSelectedEmpresa(empresa);
    setShowViewModal(true);
  };

  const handleCriarEmpresa = (dados) => {
    criarEmpresaMutation.mutate(dados);
  };

  const handleAtualizarEmpresa = (dados) => {
    atualizarEmpresaMutation.mutate({ id: selectedEmpresa.id, dados });
  };

  const handleCancelarModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedEmpresa(null);
  };

  const empresas = empresasData?.empresas || [];
  const totalEmpresas = empresasData?.pagination?.total || 0;

  const stats = [
    {
      name: 'Total de Empresas',
      value: statsData?.totalEmpresas || 0,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      name: 'Empresas Ativas',
      value: statsData?.empresasAtivas || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Total de Produtos',
      value: statsData?.totalProdutos || 0,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      name: 'Total de Vendas',
      value: statsData?.totalVendas || 0,
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      name: 'Total de Compras',
      value: statsData?.totalCompras || 0,
      icon: ShoppingBag,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      name: 'Total de Alertas',
      value: statsData?.totalAlertas || 0,
      icon: Bell,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    }
  ];

  if (statsLoading) {
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
          <h1 className="text-2xl font-bold text-dark">Administração</h1>
          <p className="text-dark-secondary">Gerenciar empresas do sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Empresa
        </button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-dark-secondary mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome, email ou CNPJ..."
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-secondary mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="">Todos</option>
                <option value="true">Ativas</option>
                <option value="false">Inativas</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Empresas */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-dark">
              Empresas ({totalEmpresas})
            </h3>
            <ExportButton
              data={empresas.map(empresa => ({
                nome: empresa.nome,
                cnpj: empresa.cnpj,
                email: empresa.email,
                telefone: empresa.telefone || '',
                cidade: empresa.cidade || '',
                estado: empresa.estado || '',
                status: empresa.ativo ? 'Ativa' : 'Inativa',
                tipo: empresa.tipo,
                produtos: empresa._count.produtos,
                vendas: empresa._count.vendas,
                compras: empresa._count.compras,
                criado_em: format(new Date(empresa.createdAt), 'dd/MM/yyyy', { locale: ptBR })
              }))}
              filename="empresas"
              label="Exportar CSV"
            />
          </div>
        </div>
        <div className="card-body">
          {empresasLoading ? (
            <LoadingSpinner />
          ) : empresasError ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <p>Erro ao carregar empresas</p>
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhuma empresa encontrada
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter 
                  ? 'Tente ajustar os filtros de busca.' 
                  : 'Comece criando uma nova empresa.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dados
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Criado em
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {empresas.map((empresa) => (
                    <tr key={empresa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {empresa.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            {empresa.cidade && empresa.estado 
                              ? `${empresa.cidade}, ${empresa.estado}`
                              : 'Localização não informada'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empresa.cnpj}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {empresa.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge ${empresa.ativo ? 'badge-success' : 'badge-danger'}`}>
                          {empresa.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div>Produtos: {empresa._count.produtos}</div>
                          <div>Vendas: {empresa._count.vendas}</div>
                          <div>Compras: {empresa._count.compras}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(empresa.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleVisualizar(empresa)}
                            className="text-info-600 hover:text-info-800"
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditar(empresa)}
                            className="text-primary-600 hover:text-primary-800"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleStatusEmpresa(empresa)}
                            className={`${empresa.ativo ? 'text-warning-600 hover:text-warning-800' : 'text-success-600 hover:text-success-800'}`}
                            title={empresa.ativo ? 'Desativar' : 'Ativar'}
                          >
                            {empresa.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            onClick={() => handleExcluir(empresa)}
                            className="text-danger-600 hover:text-danger-800"
                            title="Excluir"
                            disabled={excluirEmpresaMutation.isLoading}
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
          {empresasData?.pagination && empresasData.pagination.pages > 1 && (
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
                  Página {page} de {empresasData.pagination.pages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === empresasData.pagination.pages}
                  className="btn btn-secondary btn-sm"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação de Empresa */}
      <Modal
        isOpen={showCreateModal}
        onClose={handleCancelarModal}
        title="Nova Empresa"
        size="lg"
      >
        <EmpresaForm
          onSubmit={handleCriarEmpresa}
          onCancel={handleCancelarModal}
          isLoading={criarEmpresaMutation.isLoading}
        />
      </Modal>

      {/* Modal de Visualização de Empresa */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detalhes da Empresa"
        size="lg"
      >
        {selectedEmpresa && <EmpresaDetails empresa={selectedEmpresa} />}
      </Modal>

      {/* Modal de Edição de Empresa */}
      <Modal
        isOpen={showEditModal}
        onClose={handleCancelarModal}
        title="Editar Empresa"
        size="lg"
      >
        {selectedEmpresa && (
          <EmpresaForm
            empresa={selectedEmpresa}
            onSubmit={handleAtualizarEmpresa}
            onCancel={handleCancelarModal}
            isLoading={atualizarEmpresaMutation.isLoading}
          />
        )}
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelarExclusao}
        onConfirm={confirmarExclusao}
        title="Excluir Empresa"
        message={`Tem certeza que deseja excluir a empresa "${empresaToDelete?.nome}"? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={excluirEmpresaMutation.isLoading}
      />
    </div>
  );
};

export default Admin;
