import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import HRDashboard from '../pages/HRDashboard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../api/axios');

// Mock child components that we are not testing in detail
jest.mock('../components/BenchAllocation', () => () => <div data-testid="bench-allocation">Bench Allocation Component</div>);
jest.mock('../components/ProjectManagement', () => () => <div data-testid="project-management">Project Management Component</div>);
jest.mock('../components/SkillCatalog', () => () => <div data-testid="skill-catalog">Skill Catalog Component</div>);
jest.mock('../components/AllocationApprovals', () => () => <div data-testid="allocation-approvals">Allocation Approvals Component</div>);

// Mock Sidebar to simplify navigation testing
jest.mock('../components/Sidebar', () => ({ menuItems, onSectionChange }) => (
    <div role="navigation" aria-label="Sidebar">
        {menuItems.map(item => (
            <button key={item.id} onClick={() => onSectionChange(item.id)}>
                {item.label}
            </button>
        ))}
    </div>
));

describe('HRDashboard Tests', () => {
    const mockUser = { userId: 'hr-1', sub: 'hr@test.com', role: 'HR' };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: mockUser, role: 'HR' });

        // Default API mocks
        api.get.mockImplementation((url) => {
            if (url === '/users/managers') return Promise.resolve({ data: [{ id: 'm1', firstName: 'Manager', lastName: 'One' }] });
            if (url === '/users/employees') return Promise.resolve({ data: [] });
            if (url === '/users/hrs') return Promise.resolve({ data: [] });
            if (url === '/users/bench') return Promise.resolve({ data: [] });
            if (url === '/catalog/skills') return Promise.resolve({ data: [] });
            if (url.includes('/skills/search')) return Promise.resolve({ data: [] });
            return Promise.resolve({ data: {} });
        });

        api.post.mockResolvedValue({ data: {} });
    });

    test('renders dashboard overview by default', async () => {
        render(
            <MemoryRouter>
                <HRDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Employee Management')).toBeInTheDocument();
        });
    });

    test('navigates to People section', async () => {
        render(
            <MemoryRouter>
                <HRDashboard />
            </MemoryRouter>
        );

        const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
        const peopleButton = within(sidebar).getByText('People');

        fireEvent.click(peopleButton);

        await waitFor(() => {
            // Check for People Management specific headings
            expect(screen.getByText(/New User/i)).toBeInTheDocument();
            expect(screen.getByText(/Employee Directory/i)).toBeInTheDocument();
        });
    });

    test('validates onboarding form submission', async () => {
        render(
            <MemoryRouter>
                <HRDashboard />
            </MemoryRouter>
        );

        // Navigate to People section
        const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
        fireEvent.click(within(sidebar).getByText('People'));

        // Wait for form to appear
        await waitFor(() => screen.getByText(/New User/i));

        // Submit empty form
        const submitButton = screen.getByRole('button', { name: /Onboard User/i });
        fireEvent.click(submitButton);

        // Check for validation errors (using text content as we can't easily rely on classNames in unit tests without extensive setup, but text is visible)
        // Based on code: newErrors.onboardingFirstName = 'First Name is required'
        await waitFor(() => {
            expect(screen.getByText('First Name is required')).toBeInTheDocument();
            expect(screen.getByText('Last Name is required')).toBeInTheDocument();
            expect(screen.getByText('Email is required')).toBeInTheDocument();
            expect(screen.getByText('Password is required')).toBeInTheDocument();
        });
    });

    test('successfully onboards a new user', async () => {
        render(
            <MemoryRouter>
                <HRDashboard />
            </MemoryRouter>
        );

        // Navigate to People section
        const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
        fireEvent.click(within(sidebar).getByText('People'));
        await waitFor(() => screen.getByText(/New User/i));

        // Fill form
        fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
        fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
        fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john.doe@test.com' } });
        fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'password123' } });

        // Select Role (defaults to EMPLOYEE)
        // Select Manager (required for EMPLOYEE)
        // Wait for managers to be populated
        await waitFor(() => {
            // Mock returns 1 manager
        });

        const managerSelect = screen.getByLabelText(/^Manager$/i); // Regex anchor to avoid partial match if any
        fireEvent.change(managerSelect, { target: { value: 'm1' } });

        // Submit
        fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/users', expect.objectContaining({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@test.com',
                managerId: 'm1'
            }));
            expect(screen.getByText(/User John Doe created successfully!/i)).toBeInTheDocument();
        });
    });

    test('navigates to Talent section and performs search', async () => {
        render(
            <MemoryRouter>
                <HRDashboard />
            </MemoryRouter>
        );

        const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
        // Use specific button role to ensure we click the sidebar item
        fireEvent.click(within(sidebar).getByRole('button', { name: 'Talent' }));

        await waitFor(() => {
            // Target the main page title (H1) to ensure unique match
            expect(screen.getByRole('heading', { name: /Talent Discovery/i, level: 1 })).toBeInTheDocument();
        });

        expect(screen.getByText('Select skills to search...')).toBeInTheDocument();
    });
});
