
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';

// In a real app, NEVER store passwords in plain text. This is for demonstration only.
// I'm pre-populating with a default admin user for convenience.
const defaultAdmin: User = {
    id: 'user-0',
    name: 'Admin EcoLog',
    email: 'admin@ecolog.com',
    password: 'admin123',
    role: 'Admin',
};

interface AuthState {
    currentUser: User | null;
    users: User[];
    login: (email: string, pass: string) => boolean;
    register: (name: string, email: string, pass: string, role: Role) => boolean;
    logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        // Load users from localStorage on initial load
        try {
            const storedUsers = localStorage.getItem('ecolog-users');
            if (storedUsers) {
                setUsers(JSON.parse(storedUsers));
            } else {
                // If no users, create the default admin
                setUsers([defaultAdmin]);
                localStorage.setItem('ecolog-users', JSON.stringify([defaultAdmin]));
            }

            // Check if a user is already logged in (e.g., from a previous session)
            const loggedInUser = localStorage.getItem('ecolog-currentUser');
            if (loggedInUser) {
                setCurrentUser(JSON.parse(loggedInUser));
            }
        } catch (e) {
            console.error("Failed to process user data from localStorage", e);
            setUsers([defaultAdmin]); // Fallback
        }
    }, []);

    const login = (email: string, pass: string): boolean => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
        if (user) {
            const userToStore = { ...user };
            delete userToStore.password; // Don't store password in currentUser state/storage
            setCurrentUser(userToStore);
            localStorage.setItem('ecolog-currentUser', JSON.stringify(userToStore));
            return true;
        }
        return false;
    };

    const register = (name: string, email: string, pass: string, role: Role): boolean => {
        const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            return false; // Email already in use
        }
        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            password: pass, // Again, HASH THIS in a real app
            role,
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('ecolog-users', JSON.stringify(updatedUsers));
        
        // Automatically log in the new user
        const userToStore = { ...newUser };
        delete userToStore.password;
        setCurrentUser(userToStore);
        localStorage.setItem('ecolog-currentUser', JSON.stringify(userToStore));
        
        return true;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('ecolog-currentUser');
        // Optional: Force reload to reset all app state
        window.location.reload();
    };

    const value = { currentUser, users, login, register, logout };

    return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthState => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
