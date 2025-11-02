
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const UserManagement: React.FC = () => {
    const { users } = useAuth();

    const getRoleBadge = (role: string) => {
        const colors = {
            'Admin': 'bg-secondary/20 text-secondary',
            'User': 'bg-gray-500/20 text-gray-text',
        };
        const colorClass = colors[role as keyof typeof colors] || colors['User'];
        return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>{role}</span>;
    };

    return (
        <div className="bg-bg-card rounded-lg p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-light">
                    <i className="fas fa-users-cog mr-2"></i> Gerenciamento de Usuários
                </h3>
                <span className="text-sm text-gray-text">{users.length} usuário(s) encontrado(s)</span>
            </div>
            <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm text-left text-gray-text">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nome</th>
                            <th scope="col" className="px-6 py-3">Email</th>
                            <th scope="col" className="px-6 py-3">Nível de Acesso</th>
                            <th scope="col" className="px-6 py-3">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-border-color">
                                <td className="px-6 py-4 font-medium text-light">{user.name}</td>
                                <td className="px-6 py-4">{user.email}</td>
                                <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                <td className="px-6 py-4 space-x-4">
                                    <button className="text-blue-400 hover:text-blue-300" title="Editar (Em breve)">✏️</button>
                                    <button className="text-red-500 hover:text-red-400" title="Remover (Em breve)">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
