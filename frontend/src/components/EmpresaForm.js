import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import LoadingSpinner from './LoadingSpinner';
import { maskCNPJ, maskTelefone, maskCEP, removeMask } from '../utils/masks';

const EmpresaForm = ({ empresa, onSubmit, onCancel, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm();
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const isInitialMount = useRef(true);
  const lastCepSearched = useRef('');
  
  const cepValue = watch('cep');

  useEffect(() => {
    if (empresa) {
      // Preencher formulário com dados da empresa
      setValue('nome', empresa.nome);
      setValue('cnpj', maskCNPJ(empresa.cnpj || ''));
      setValue('email', empresa.email);
      setValue('telefone', maskTelefone(empresa.telefone || ''));
      setValue('endereco', empresa.endereco || '');
      setValue('numero', empresa.numero || '');
      setValue('cidade', empresa.cidade || '');
      setValue('estado', empresa.estado || '');
      setValue('cep', maskCEP(empresa.cep || ''));
      setValue('tipo', empresa.tipo || 'EMPRESA');
      setValue('ativo', empresa.ativo);
      lastCepSearched.current = removeMask(empresa.cep || '');
    } else {
      // Limpar formulário para nova empresa
      reset();
      setValue('tipo', 'EMPRESA');
      setValue('ativo', true);
      lastCepSearched.current = '';
    }
    isInitialMount.current = false;
  }, [empresa, setValue, reset]);

  // Buscar endereço por CEP
  const buscarEnderecoPorCEP = useCallback(async (cep) => {
    const cepLimpo = removeMask(cep);
    
    if (cepLimpo.length !== 8) {
      return;
    }

    setIsLoadingCEP(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (!data.erro) {
        // Preencher endereço sem sobrescrever o número se já existir
        const numeroAtual = watch('numero');
        setValue('endereco', data.logradouro || '');
        setValue('cidade', data.localidade || '');
        setValue('estado', data.uf || '');
        // Não alterar o número se já foi preenchido pelo usuário
        // Apenas limpar se estiver vazio
        if (!numeroAtual) {
          setValue('numero', '', { shouldDirty: false });
        }
      } else {
        // CEP não encontrado, limpar campos de endereço mas manter número
        setValue('endereco', '');
        setValue('cidade', '');
        setValue('estado', '');
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setIsLoadingCEP(false);
    }
  }, [setValue, watch]);

  // Observar mudanças no CEP e buscar endereço
  useEffect(() => {
    // Evitar busca durante o carregamento inicial do formulário
    if (isInitialMount.current) {
      return;
    }

    if (cepValue) {
      const cepLimpo = removeMask(cepValue);
      
      // Só buscar se o CEP tiver 8 dígitos e for diferente do último buscado
      if (cepLimpo.length === 8 && cepLimpo !== lastCepSearched.current) {
        // Usar timeout para evitar múltiplas chamadas enquanto o usuário digita
        const timeoutId = setTimeout(() => {
          lastCepSearched.current = cepLimpo;
          buscarEnderecoPorCEP(cepValue);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [cepValue, buscarEnderecoPorCEP]);

  const onSubmitForm = (data) => {
    // Remover máscaras antes de enviar
    const dadosLimpos = {
      ...data,
      cnpj: removeMask(data.cnpj),
      telefone: data.telefone ? removeMask(data.telefone) : '',
      cep: data.cep ? removeMask(data.cep) : ''
    };
    onSubmit(dadosLimpos);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nome da Empresa *
          </label>
          <input
            type="text"
            {...register('nome', { required: 'Nome é obrigatório' })}
            className="input"
            placeholder="Digite o nome da empresa"
          />
          {errors.nome && (
            <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
          )}
        </div>

        {/* CNPJ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            CNPJ *
          </label>
          <input
            type="text"
            {...register('cnpj', { 
              required: 'CNPJ é obrigatório',
              validate: (value) => {
                const cnpjLimpo = removeMask(value);
                if (cnpjLimpo.length !== 14) {
                  return 'CNPJ deve ter 14 dígitos';
                }
                return true;
              }
            })}
            onChange={(e) => {
              const masked = maskCNPJ(e.target.value);
              setValue('cnpj', masked, { shouldValidate: true });
            }}
            className="input"
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
          {errors.cnpj && (
            <p className="text-red-500 text-sm mt-1">{errors.cnpj.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email *
          </label>
          <input
            type="email"
            {...register('email', { 
              required: 'Email é obrigatório',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email inválido'
              }
            })}
            className="input"
            placeholder="empresa@exemplo.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Telefone
          </label>
          <input
            type="text"
            {...register('telefone')}
            onChange={(e) => {
              const masked = maskTelefone(e.target.value);
              setValue('telefone', masked);
            }}
            className="input"
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo
          </label>
          <select {...register('tipo')} className="input">
            <option value="EMPRESA">Empresa</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>

        {/* CEP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            CEP
            {isLoadingCEP && (
              <span className="ml-2 text-xs text-gray-500">Buscando...</span>
            )}
          </label>
          <input
            type="text"
            {...register('cep')}
            onChange={(e) => {
              const masked = maskCEP(e.target.value);
              setValue('cep', masked);
            }}
            className="input"
            placeholder="00000-000"
            maxLength={9}
          />
        </div>

        {/* Cidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cidade
          </label>
          <input
            type="text"
            {...register('cidade')}
            className="input"
            placeholder="São Paulo"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado
          </label>
          <input
            type="text"
            {...register('estado')}
            className="input"
            placeholder="SP"
            maxLength="2"
          />
        </div>

        {/* Endereço */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Endereço
          </label>
          <input
            type="text"
            {...register('endereco')}
            className="input"
            placeholder="Rua, avenida, logradouro"
          />
        </div>

        {/* Número */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Número
          </label>
          <input
            type="text"
            {...register('numero')}
            className="input"
            placeholder="123"
          />
        </div>

        {/* Senha */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {empresa ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha *'}
          </label>
          <input
            type="password"
            {...register('senha', empresa ? {
              minLength: {
                value: 6,
                message: 'Senha deve ter pelo menos 6 caracteres'
              }
            } : {
              required: 'Senha é obrigatória',
              minLength: {
                value: 6,
                message: 'Senha deve ter pelo menos 6 caracteres'
              }
            })}
            className="input"
            placeholder={empresa ? "Digite uma nova senha (opcional)" : "Digite uma senha"}
          />
          {errors.senha && (
            <p className="text-red-500 text-sm mt-1">{errors.senha.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="md:col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              {...register('ativo')}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Empresa ativa
            </span>
          </label>
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {empresa ? 'Atualizando...' : 'Criando...'}
            </>
          ) : (
            empresa ? 'Atualizar Empresa' : 'Criar Empresa'
          )}
        </button>
      </div>
    </form>
  );
};

export default EmpresaForm;
