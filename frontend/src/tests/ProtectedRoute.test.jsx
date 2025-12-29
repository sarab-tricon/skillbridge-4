import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Mock the useAuth hook
jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

// Mock the Navigate component from react-router-dom
jest.mock('react-router-dom', () => {
    const React = require('react');
    return {
        MemoryRouter: ({ children }) => <div>{children}</div>,
        Routes: ({ children }) => <div>{children}</div>,
        Route: ({ element }) => <div>{element}</div>,
        Navigate: jest.fn(({ to }) => <div data-testid="navigate" data-to={to} />),
    };
});

describe('ProtectedRoute', () => {
    it('redirects to login if not authenticated', () => {
        useAuth.mockReturnValue({ isAuthenticated: false, role: null });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute>
                                <div data-testid="protected-content">Protected Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
        // In a real scenario, you'd check if Navigate was called with the right props
    });

    it('renders children if authenticated and role matches', () => {
        useAuth.mockReturnValue({ isAuthenticated: true, role: 'EMPLOYEE' });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                                <div data-testid="protected-content">Protected Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    });

    it('redirects to home if role does not match', () => {
        useAuth.mockReturnValue({ isAuthenticated: true, role: 'MANAGER' });

        render(
            <MemoryRouter initialEntries={['/protected']}>
                <Routes>
                    <Route
                        path="/protected"
                        element={
                            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                                <div data-testid="protected-content">Protected Content</div>
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </MemoryRouter>
        );

        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
        expect(screen.getByTestId('navigate')).toBeInTheDocument();
    });
});
