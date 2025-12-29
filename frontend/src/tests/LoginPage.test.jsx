import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import { useAuth } from '../context/AuthContext';

// Mock the hooks
jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('react-router-dom', () => {
    return {
        MemoryRouter: ({ children }) => <div>{children}</div>,
        useNavigate: jest.fn(),
    };
});

describe('LoginPage', () => {
    const mockLogin = jest.fn();
    const mockNavigate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ login: mockLogin });
        useNavigate.mockReturnValue(mockNavigate);
    });

    it('renders login form correctly', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Login', { selector: 'h3' })).toBeInTheDocument();
        expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
    });

    it('updates input fields on change', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        const emailInput = screen.getByPlaceholderText('name@company.com');
        const passwordInput = screen.getByPlaceholderText('******');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    it('shows error message on failed login', async () => {
        mockLogin.mockResolvedValue({ success: false, message: 'Invalid credentials' });

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'wrong@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: 'wrongpass' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('navigates to /employee on successful employee login', async () => {
        mockLogin.mockResolvedValue({ success: true, role: 'EMPLOYEE' });

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'emp@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/employee');
        });
    });

    it('navigates to /manager on successful manager login', async () => {
        mockLogin.mockResolvedValue({ success: true, role: 'MANAGER' });

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'mgr@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/manager');
        });
    });

    it('navigates to /hr on successful HR login', async () => {
        mockLogin.mockResolvedValue({ success: true, role: 'HR' });

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText('name@company.com'), { target: { value: 'hr@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('******'), { target: { value: 'password' } });
        fireEvent.click(screen.getByRole('button', { name: /Login/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/hr');
        });
    });
});
