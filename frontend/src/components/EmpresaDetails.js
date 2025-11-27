import React from 'react';
import { Building2, Mail, Phone, MapPin, Calendar, Package, ShoppingCart, ShoppingBag, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const EmpresaDetails = ({ empresa }) => {
  if (!empresa) return null;

  const details = [
    {
      icon: Building2,
      label: 'Nome',
      value: empresa.nome
    },
    {
      icon: Mail,
      label: 'Email',
      value: empresa.email
    },
    {
      icon: Phone,
      label: 'Telefone',
      value: empresa.telefone || 'Não informado'
    },
    {
      icon: MapPin,
      label: 'Endereço',
      value: empresa.endereco || 'Não informado'
    },
    {
      icon: MapPin,
      label: 'Número',
      value: empresa.numero || 'Não informado'
    },
    {
      icon: MapPin,
      label: 'Cidade/Estado',
      value: empresa.cidade && empresa.estado ? `${empresa.cidade}, ${empresa.estado}` : 'Não informado'
    },
    {
      icon: MapPin,
      label: 'CEP',
      value: empresa.cep || 'Não informado'
    },
    {
      icon: Calendar,
      label: 'Criado em',
      value: format(new Date(empresa.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }
  ];

  const stats = [
    {
      icon: Package,
      label: 'Produtos',
      value: empresa._count?.produtos || 0,
      color: 'text-blue-600'
    },
    {
      icon: ShoppingCart,
      label: 'Vendas',
      value: empresa._count?.vendas || 0,
      color: 'text-green-600'
    },
    {
      icon: ShoppingBag,
      label: 'Compras',
      value: empresa._count?.compras || 0,
      color: 'text-purple-600'
    },
    {
      icon: Bell,
      label: 'Alertas',
      value: empresa._count?.alertas || 0,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Informações Básicas
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {details.map((detail, index) => {
            const Icon = detail.icon;
            return (
              <div key={index} className="flex items-start space-x-3">
                <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {detail.label}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {detail.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status e Tipo */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Status e Configurações
        </h4>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status:
            </span>
            <span className={`badge ${empresa.ativo ? 'badge-success' : 'badge-danger'}`}>
              {empresa.ativo ? 'Ativa' : 'Inativa'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Tipo:
            </span>
            <span className={`badge ${empresa.tipo === 'ADMIN' ? 'badge-warning' : 'badge-info'}`}>
              {empresa.tipo === 'ADMIN' ? 'Administrador' : 'Empresa'}
            </span>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div>
        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Estatísticas
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center">
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmpresaDetails;
