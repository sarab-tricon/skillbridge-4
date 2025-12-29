import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

// Mock the hooks
jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => {
    return {
        MemoryRouter: ({ children }) => <div>{children}</div>,
        Link: ({ children, to }) => <a href={to}>{children}</a>,
        useNavigate: jest.fn(),
        useLocation: jest.fn(),
    };
});

describe('Navbar', () => {
    const mockLogout = jest.fn();
    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
    });

    it('renders the brand name and logo', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });
        useLocation.mockReturnValue({ pathname: '/' });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.getByText('SkillBridge')).toBeInTheDocument();
        expect(screen.getByAltText('Logo')).toBeInTheDocument();
    });

    it('does not show user info or logout button when not authenticated', () => {
        useAuth.mockReturnValue({ isAuthenticated: false });
        useLocation.mockReturnValue({ pathname: '/' });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.queryByTitle('Logout')).not.toBeInTheDocument();
    });

    it('shows user info and logout button when authenticated and not on landing/login page', () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            user: { sub: 'test@example.com' },
            logout: mockLogout,
        });
        useLocation.mockReturnValue({ pathname: '/employee' });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByTitle('Logout')).toBeInTheDocument();
    });

    it('calls logout and navigates to home when logout button is clicked', () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            user: { sub: 'test@example.com' },
            logout: mockLogout,
        });
        useLocation.mockReturnValue({ pathname: '/employee' });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        const logoutButton = screen.getByTitle('Logout');
        fireEvent.click(logoutButton);

        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('hides user info even if authenticated if on login page', () => {
        useAuth.mockReturnValue({
            isAuthenticated: true,
            user: { sub: 'test@example.com' },
        });
        useLocation.mockReturnValue({ pathname: '/login' });

        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        expect(screen.queryByTitle('Logout')).not.toBeInTheDocument();
    });
});
