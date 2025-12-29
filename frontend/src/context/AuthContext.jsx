import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Synchronously initialize state from localStorage to prevent redirect flickers
    const initialToken = localStorage.getItem('token');

    let initialUser = null;
    let initialRole = null;

    if (initialToken) {
        try {
            const decoded = jwtDecode(initialToken);
            initialUser = decoded;
            initialRole = decoded.role;
        } catch (error) {
            console.error("Invalid initial token", error);
            localStorage.removeItem('token');
        }
    }

    const [user, setUser] = useState(initialUser);
    const [token, setToken] = useState(initialToken);
    const [role, setRole] = useState(initialRole);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Sync state if token changes elsewhere
        if (token && !user) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
                setRole(decoded.role);
            } catch (error) {
                console.error("Invalid token refresh", error);
                logout();
            }
        }
    }, [token, user]);

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });
            const { token: receivedToken } = response.data;
            localStorage.setItem('token', receivedToken);
            setToken(receivedToken);
            const decoded = jwtDecode(receivedToken);
            return { success: true, role: decoded.role };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please check your credentials.'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('managerActiveSection');
        localStorage.removeItem('hrActiveSection');
        localStorage.removeItem('employeeActiveSection');
        setToken(null);
        setUser(null);
        setRole(null);
    };

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh'
            }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, token, role, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};
