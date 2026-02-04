import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, User, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from './ui';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    alias: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isRegister) {
      // Validaciones de registro
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        setIsLoading(false);
        return;
      }
      
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        setIsLoading(false);
        return;
      }

      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        alias: formData.alias || formData.username
      });
      
      if (!result.success) {
        setError(result.error || 'Error al registrar');
      }
    } else {
      // Login
      const result = await login(formData.username, formData.password);
      
      if (!result.success) {
        setError(result.error || 'Error de autenticación');
      }
    }
    
    setIsLoading(false);
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setError('');
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      alias: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            PulseGuard
          </h1>
          <p className="text-slate-600 dark:text-gray-400">
            {isRegister ? 'Crear una cuenta' : 'Panel de administración'}
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              {isRegister ? (
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {isRegister ? 'Registro' : 'Iniciar sesión'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-gray-400">
                {isRegister 
                  ? 'Crea tu cuenta para acceder al panel' 
                  : 'Introduce tus credenciales para continuar'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
              >
                {isRegister ? 'Nombre de usuario' : 'Usuario o Email'}
              </label>
              <div className="relative">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder={isRegister ? 'usuario123' : 'usuario o email'}
                  autoFocus
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Email (solo en registro) */}
            {isRegister && (
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="tu@email.com"
                  />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>
            )}

            {/* Alias (solo en registro) */}
            {isRegister && (
              <div>
                <label 
                  htmlFor="alias" 
                  className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
                >
                  Alias (opcional)
                </label>
                <div className="relative">
                  <input
                    id="alias"
                    name="alias"
                    type="text"
                    value={formData.alias}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Tu nombre para mostrar"
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pl-11 pr-12 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password (solo en registro) */}
            {isRegister && (
              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2"
                >
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3"
              disabled={isLoading || !formData.username || !formData.password || (isRegister && !formData.email)}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isRegister ? 'Registrando...' : 'Verificando...'}
                </span>
              ) : (
                isRegister ? 'Crear cuenta' : 'Acceder'
              )}
            </Button>
          </form>

          {/* Toggle entre login y registro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes una cuenta?'}
              <button
                type="button"
                onClick={toggleMode}
                className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                {isRegister ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 dark:text-gray-400 mt-6">
          PulseGuard - Sistema de monitoreo de servicios
        </p>
      </div>
    </div>
  );
}
