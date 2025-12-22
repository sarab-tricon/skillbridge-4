import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true); // Add loading state

    useEffect(() => {
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
                setRole(decoded.role);
            } catch (error) {
                console.error("Invalid token", error);
                logout();
            }
        }
        setLoading(false); // Done loading
    }, [token]);

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
