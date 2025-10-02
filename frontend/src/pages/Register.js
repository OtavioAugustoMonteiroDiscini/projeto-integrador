import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { maskCNPJ, maskTelefone, removeMask, validateCNPJ } from '../utils/masks';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cnpjValue, setCnpjValue] = useState('');
  const [telefoneValue, setTelefoneValue] = useState('');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm();

  const password = watch('senha');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Remove máscaras antes de enviar os dados
      const formattedData = {
        ...data,
        cnpj: removeMask(data.cnpj),
        telefone: removeMask(data.telefone)
      };
      
      const result = await registerUser(formattedData);
      
      if (result.success) {
        toast.success('Empresa cadastrada com sucesso!');
        navigate('/dashboard');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Erro ao cadastrar empresa');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Cadastro de Empresa
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Crie sua conta no sistema
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                Nome da Empresa
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
                className="input mt-1"
                placeholder="Nome da sua empresa"
              />
              {errors.nome && (
                <p className="mt-1 text-sm text-danger-600">{errors.nome.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">
                CNPJ
              </label>
              <input
                value={cnpjValue}
                onChange={handleCnpjChange}
                type="text"
                className="input mt-1"
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
                <p className="mt-1 text-sm text-danger-600">{errors.cnpj.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido'
                  }
                })}
                type="email"
                className="input mt-1"
                placeholder="seu@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                value={telefoneValue}
                onChange={handleTelefoneChange}
                type="text"
                className="input mt-1"
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
              <input
                type="hidden"
                {...register('telefone')}
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  {...register('senha', {
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="mt-1 text-sm text-danger-600">{errors.senha.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <input
                {...register('confirmarSenha', {
                  required: 'Confirmação de senha é obrigatória',
                  validate: value => value === password || 'Senhas não coincidem'
                })}
                type="password"
                className="input mt-1"
                placeholder="Confirme sua senha"
              />
              {errors.confirmarSenha && (
                <p className="mt-1 text-sm text-danger-600">{errors.confirmarSenha.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center items-center"
            >
              {loading ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : null}
              {loading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Faça login aqui
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;