
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';
import { useLanguage } from '../hooks/useLanguage';

const AuthPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const { login, register } = useAuth();
    const { t } = useLanguage();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<Role>('User');
    const [error, setError] = useState('');

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isLoginView) {
            const success = login(email, password);
            if (!success) {
                setError('Email ou senha inválidos.');
            }
        } else {
            if (password.length < 6) {
                setError('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
            const success = register(name, email, password, role);
            if (!success) {
                setError('Este email já está em uso.');
            }
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setError('');
        setEmail('');
        setPassword('');
        setName('');
        setRole('User');
    };

    return (
        <div className="min-h-screen bg-bg-main flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-light">{t('appName')}</h1>
                    <p className="text-gray-text">{isLoginView ? t('loginPrompt') : t('registerPrompt')}</p>
                </div>

                <div className="bg-bg-card p-8 rounded-lg shadow-lg">
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        {!isLoginView && (
                             <div className="form-group">
                                <label className="form-label" htmlFor="name">{t('fullName')}</label>
                                <input className="form-input" type="text" id="name" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                        )}
                        <div className="form-group">
                            <label className="form-label" htmlFor="email">{t('email')}</label>
                            <input className="form-input" type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="password">{t('password')}</label>
                            <input className="form-input" type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        {!isLoginView && (
                            <div className="form-group">
                                <label className="form-label" htmlFor="role">{t('accountType')}</label>
                                <select className="form-select" id="role" value={role} onChange={e => setRole(e.target.value as Role)}>
                                    <option value="User">Usuário Padrão</option>
                                    <option value="Admin">Administrador</option>
                                </select>
                            </div>
                        )}

                        {error && <p className="text-danger text-sm text-center">{error}</p>}

                        <div>
                            <button type="submit" className="w-full px-4 py-3 bg-primary text-white font-bold rounded-md hover:bg-opacity-90 shadow-md hover:shadow-lg transition-shadow">
                                {isLoginView ? t('login') : t('register')}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-6">
                        <button onClick={toggleView} className="text-sm text-secondary hover:underline">
                            {isLoginView ? t('noAccount') : t('hasAccount')}
                        </button>
                    </div>
                </div>
            </div>
             <style>{`
                .form-group label { display: block; margin-bottom: 5px; font-weight: 500; color: #f9fafb; }
                .form-input, .form-select {
                    padding: 0.75rem;
                    border: 1px solid #374151;
                    border-radius: 0.375rem;
                    font-size: 1rem;
                    background-color: #0F172A;
                    color: #f9fafb;
                    width: 100%;
                }
                .form-input:focus, .form-select:focus {
                    outline: none;
                    border-color: #14B8A6;
                    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
                }
            `}</style>
        </div>
    );
};

export default AuthPage;