import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import LoadingSpinner from './LoadingSpinner';
import { maskCNPJ, maskTelefone, maskCEP, removeMask, validateCNPJ } from '../utils/masks';

const EmpresaForm = ({ empresa, onSubmit, onCancel, isLoading }) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
  const [cnpjValue, setCnpjValue] = useState('');
  const [telefoneValue, setTelefoneValue] = useState('');
  const [cepValue, setCepValue] = useState('');

  useEffect(() => {
    if (empresa) {
      // Preencher formulário com dados da empresa
      setValue('nome', empresa.nome);
      setValue('email', empresa.email);
      setValue('endereco', empresa.endereco || '');
      setValue('cidade', empresa.cidade || '');
      setValue('estado', empresa.estado || '');
      setValue('tipo', empresa.tipo || 'EMPRESA');
      setValue('ativo', empresa.ativo);
      
      // Aplicar máscaras aos valores iniciais
      const cnpjMasked = empresa.cnpj ? maskCNPJ(empresa.cnpj) : '';
      const telefoneMasked = empresa.telefone ? maskTelefone(empresa.telefone) : '';
      const cepMasked = empresa.cep ? maskCEP(empresa.cep) : '';
      
      setCnpjValue(cnpjMasked);
      setTelefoneValue(telefoneMasked);
      setCepValue(cepMasked);
      
      setValue('cnpj', cnpjMasked);
      setValue('telefone', telefoneMasked);
      setValue('cep', cepMasked);
    } else {
      // Limpar formulário para nova empresa
      reset();
      setValue('tipo', 'EMPRESA');
      setValue('ativo', true);
      setCnpjValue('');
      setTelefoneValue('');
      setCepValue('');
    }
  }, [empresa, setValue, reset]);

  const onSubmitForm = (data) => {
    // Remove máscaras antes de enviar os dados
    const formattedData = {
      ...data,
      cnpj: removeMask(data.cnpj),
      telefone: removeMask(data.telefone),
      cep: removeMask(data.cep)
    };
    onSubmit(formattedData);
  };

  // Handlers para aplicar máscaras
  const handleCnpjChange = (e) => {
    const maskedValue = maskCNPJ(e.target.value);
    setCnpjValue(maskedValue);
    setValue('cnpj', maskedValue);
  };

  const handleTelefoneChange = (e) => {
    const maskedValue = maskTelefone(e.target.value);
    setTelefoneValue(maskedValue);
    setValue('telefone', maskedValue);
  };

  const handleCepChange = (e) => {
    const maskedValue = maskCEP(e.target.value);
    setCepValue(maskedValue);
    setValue('cep', maskedValue);
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
            value={cnpjValue}
            onChange={handleCnpjChange}
            className="input"
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
          <input
            type="hidden"
            {...register('cnpj', { 
              required: 'CNPJ é obrigatório',
              validate: value => validateCNPJ(value) || 'CNPJ inválido'
            })}
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
            value={telefoneValue}
            onChange={handleTelefoneChange}
            className="input"
            placeholder="(11) 99999-9999"
            maxLength={15}
          />
          <input
            type="hidden"
            {...register('telefone')}
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
          </label>
          <input
            type="text"
            value={cepValue}
            onChange={handleCepChange}
            className="input"
            placeholder="00000-000"
            maxLength={9}
          />
          <input
            type="hidden"
            {...register('cep')}
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
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Endereço
          </label>
          <input
            type="text"
            {...register('endereco')}
            className="input"
            placeholder="Rua, número, bairro"
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