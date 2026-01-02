import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import HRDashboard from '../pages/HRDashboard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { MemoryRouter } from 'react-router-dom';
import { allocationsApi } from '../api/allocations';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../api/axios');
jest.mock('../api/allocations', () => ({
    allocationsApi: {
        getPendingRequests: jest.fn(),
        getMyRequests: jest.fn(),
    }
}));

// Mock child components
jest.mock('../components/BenchAllocation', () => () => <div data-testid="bench-allocation">Bench Allocation Component</div>);
jest.mock('../components/ProjectManagement', () => () => <div data-testid="project-management">Project Management Component</div>);
jest.mock('../components/SkillCatalog', () => () => <div data-testid="skill-catalog">Skill Catalog Component</div>);
jest.mock('../components/AllocationApprovals', () => () => <div data-testid="allocation-approvals">Allocation Approvals Component</div>);

jest.mock('../components/Sidebar', () => ({ menuItems, onSectionChange }) => (
    <div role="navigation" aria-label="Sidebar">
        {menuItems.map(item => (
            <button key={item.id} onClick={() => onSectionChange(item.id)}>
                {item.label}
            </button>
        ))}
    </div>
));

describe('HRDashboard Comprehensive Tests', () => {
    const mockUser = { userId: 'hr-1', sub: 'hr@test.com', role: 'HR' };
    const mockManagers = [
        { id: 'm1', firstName: 'Manager', lastName: 'One', email: 'manager1@test.com', role: 'MANAGER' },
        { id: 'm2', firstName: 'Manager', lastName: 'Two', email: 'manager2@test.com', role: 'MANAGER' }
    ];
    const mockEmployees = [
        { id: 'e1', firstName: 'Employee', lastName: 'One', email: 'emp1@test.com', role: 'EMPLOYEE', managerId: 'm1' },
        { id: 'e2', firstName: 'Employee', lastName: 'Two', email: 'emp2@test.com', role: 'EMPLOYEE', managerId: 'm1' }
    ];
    const mockHRs = [
        { id: 'h1', firstName: 'HR', lastName: 'One', email: 'hr1@test.com', role: 'HR' }
    ];
    const mockSkills = [
        { id: 1, name: 'Java' },
        { id: 2, name: 'React' },
        { id: 3, name: 'Python' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        useAuth.mockReturnValue({ user: mockUser, role: 'HR' });

        // Default successful API responses
        api.get.mockImplementation((url) => {
            if (url === '/users/managers') return Promise.resolve({ data: mockManagers });
            if (url === '/users/employees') return Promise.resolve({ data: mockEmployees });
            if (url === '/users/hrs') return Promise.resolve({ data: mockHRs });
            if (url === '/users/bench') return Promise.resolve({ data: [] });
            if (url === '/catalog/skills') return Promise.resolve({ data: mockSkills });
            if (url.includes('/skills/search')) return Promise.resolve({ data: [] });
            return Promise.resolve({ data: [] });
        });

        api.post.mockResolvedValue({ data: {} });
        api.put.mockResolvedValue({ data: {} });
        api.delete.mockResolvedValue({ data: {} });
        allocationsApi.getPendingRequests.mockResolvedValue({ data: [] });
    });

    // ===== ACCESS CONTROL =====
    describe('Access Control', () => {
        test('denies access for non-HR users', async () => {
            useAuth.mockReturnValue({ user: { userId: 'e1', role: 'EMPLOYEE' }, role: 'EMPLOYEE' });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(screen.getByText(/Access Denied/i)).toBeInTheDocument();
                expect(screen.getByText(/Only HR administrators can access this module/i)).toBeInTheDocument();
            });
        });

        test('allows access for HR users', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(screen.getByText('Employee Management')).toBeInTheDocument();
            });
        });
    });

    // ===== NAVIGATION =====
    describe('Navigation', () => {
        test('renders dashboard overview by default', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
                expect(screen.getByText('Employee Management')).toBeInTheDocument();
            });
        });

        test('navigates to all sections via sidebar', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });

            // People
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => expect(screen.getByText(/New User/i)).toBeInTheDocument());

            // Projects
            fireEvent.click(within(sidebar).getByText('Projects'));
            await waitFor(() => expect(screen.getByTestId('project-management')).toBeInTheDocument());

            // Approvals
            fireEvent.click(within(sidebar).getByText('Approvals'));
            await waitFor(() => expect(screen.getByTestId('allocation-approvals')).toBeInTheDocument());

            // Bench & Alloc
            fireEvent.click(within(sidebar).getByText('Bench & Alloc'));
            await waitFor(() => expect(screen.getByTestId('bench-allocation')).toBeInTheDocument());

            // Skills
            fireEvent.click(within(sidebar).getByText('Skills'));
            await waitFor(() => expect(screen.getByTestId('skill-catalog')).toBeInTheDocument());

            // Talent
            fireEvent.click(within(sidebar).getByText('Talent'));
            await waitFor(() => {
                const headings = screen.getAllByRole('heading', { name: /Talent Discovery/i });
                expect(headings[0]).toBeInTheDocument();
            });
        });

        test('persists active section to localStorage', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });

            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => {
                expect(localStorage.getItem('hrActiveSection')).toBe('people');
            });
        });

        test('loads persisted section from localStorage', async () => {
            localStorage.setItem('hrActiveSection', 'talent');

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                const headings = screen.getAllByRole('heading', { name: /Talent Discovery/i });
                expect(headings[0]).toBeInTheDocument();
            });
        });
    });

    // ===== ONBOARDING VALIDATION =====
    describe('User Onboarding - Validation', () => {
        test('validates all required fields on empty submission', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));

            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(screen.getByText('First Name is required')).toBeInTheDocument();
                expect(screen.getByText('Last Name is required')).toBeInTheDocument();
                expect(screen.getByText('Email is required')).toBeInTheDocument();
                expect(screen.getByText('Password is required')).toBeInTheDocument();
            });
        });

        test('validates email format', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'invalid-email' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(screen.getByText('Invalid email format')).toBeInTheDocument();
            });
        });

        test('validates manager selection for EMPLOYEE role', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            // Role defaults to EMPLOYEE

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(screen.getByText('Please select a manager')).toBeInTheDocument();
            });
        });

        test('does not require manager for MANAGER role', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'MANAGER' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledWith('/users', expect.objectContaining({
                    firstName: 'John',
                    lastName: 'Doe',
                    role: 'MANAGER',
                    managerId: null
                }));
            });
        });

        test('does not require manager for HR role', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Jane' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Smith' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'jane@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'HR' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledWith('/users', expect.objectContaining({
                    firstName: 'Jane',
                    lastName: 'Smith',
                    role: 'HR',
                    managerId: null
                }));
            });
        });
    });

    // ===== ONBOARDING SUCCESS =====
    describe('User Onboarding - Success', () => {
        test('successfully onboards an EMPLOYEE', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            fireEvent.change(screen.getByLabelText(/^Manager$/i), { target: { value: 'm1' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledWith('/users', {
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@test.com',
                    password: 'pass123',
                    role: 'EMPLOYEE',
                    managerId: 'm1'
                });
                expect(screen.getByText(/User John Doe created successfully!/i)).toBeInTheDocument();
            });

            // Verify form is reset
            expect(screen.getByLabelText(/First Name/i)).toHaveValue('');
            expect(screen.getByLabelText(/Last Name/i)).toHaveValue('');
        });

        test('switches to MANAGERS tab after onboarding a manager', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Manager' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'New' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'manager@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'MANAGER' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(screen.getByText(/User Manager New created successfully!/i)).toBeInTheDocument();
            });

            // Verify Managers tab is active
            const managersTab = screen.getByRole('button', { name: 'Managers' });
            expect(managersTab).toHaveClass('btn-primary');
        });

        test('switches to HR Ops tab after onboarding HR', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'HR' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'New' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'hr@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            fireEvent.change(screen.getByLabelText(/Role/i), { target: { value: 'HR' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(screen.getByText(/User HR New created successfully!/i)).toBeInTheDocument();
            });

            // Verify HR Ops tab is active
            const hrTab = screen.getByRole('button', { name: 'HR Ops' });
            expect(hrTab).toHaveClass('btn-primary');
        });

        test('toggles password visibility', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            const passwordInput = screen.getByLabelText(/Initial Password/i);
            expect(passwordInput).toHaveAttribute('type', 'password');

            const toggleButton = screen.getByLabelText('Show password');
            fireEvent.click(toggleButton);

            expect(passwordInput).toHaveAttribute('type', 'text');

            fireEvent.click(screen.getByLabelText('Hide password'));
            expect(passwordInput).toHaveAttribute('type', 'password');
        });

        test('dismisses success alert', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            fireEvent.change(screen.getByLabelText(/^Manager$/i), { target: { value: 'm1' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(screen.getByText(/User John Doe created successfully!/i)).toBeInTheDocument();
            });

            const closeButton = screen.getByRole('alert').querySelector('.btn-close');
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByText(/User John Doe created successfully!/i)).not.toBeInTheDocument();
            });
        });
    });

    // ===== ONBOARDING ERROR HANDLING =====
    describe('User Onboarding - Error Handling', () => {
        test('handles API error with custom message', async () => {
            api.post.mockRejectedValueOnce({
                response: { data: { message: 'Email already exists' } }
            });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            fireEvent.change(screen.getByLabelText(/^Manager$/i), { target: { value: 'm1' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(screen.getByText('Email already exists')).toBeInTheDocument();
            });
        });

        test('handles API error with generic message', async () => {
            api.post.mockRejectedValueOnce(new Error('Network error'));

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            fireEvent.change(screen.getByLabelText(/^Manager$/i), { target: { value: 'm1' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(screen.getByText('Network error')).toBeInTheDocument();
            });
        });

        test('dismisses error alert', async () => {
            api.post.mockRejectedValueOnce({
                response: { data: { message: 'Test error' } }
            });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/New User/i));

            fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
            fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Doe' } });
            fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@test.com' } });
            fireEvent.change(screen.getByLabelText(/Initial Password/i), { target: { value: 'pass123' } });
            fireEvent.change(screen.getByLabelText(/^Manager$/i), { target: { value: 'm1' } });

            fireEvent.click(screen.getByRole('button', { name: /Onboard User/i }));

            await waitFor(() => {
                expect(screen.getByText('Test error')).toBeInTheDocument();
            });

            const closeButton = screen.getByRole('alert').querySelector('.btn-close');
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByText('Test error')).not.toBeInTheDocument();
            });
        });
    });

    // ===== PEOPLE DIRECTORY =====
    describe('People Directory', () => {
        test('displays employees by default', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));

            await waitFor(() => {
                expect(screen.getByText('Employee One')).toBeInTheDocument();
                expect(screen.getByText('Employee Two')).toBeInTheDocument();
            });
        });

        test('switches to Managers tab', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/Employee Directory/i));

            const managersTab = screen.getByRole('button', { name: 'Managers' });
            fireEvent.click(managersTab);

            await waitFor(() => {
                // Check that the Managers tab is active
                expect(managersTab).toHaveClass('btn-primary');
                // Check for manager emails which are unique identifiers
                expect(screen.getByText('manager1@test.com')).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        test('switches to HR Ops tab', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/Employee Directory/i));

            const hrTab = screen.getByRole('button', { name: 'HR Ops' });
            fireEvent.click(hrTab);

            await waitFor(() => {
                expect(hrTab).toHaveClass('btn-primary');
                expect(screen.getByText('hr1@test.com')).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        test('filters out current user from directory', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText(/Employee Directory/i));

            const hrTab = screen.getByRole('button', { name: 'HR Ops' });
            fireEvent.click(hrTab);

            await waitFor(() => {
                // Current user (hr-1) should be filtered out, so we should see the HR tab is active
                // but the current user should not be in the list
                expect(hrTab).toHaveClass('btn-primary');
                // The mock has only one HR user with id 'h1', not 'hr-1', so it should appear
                expect(screen.getByText('hr1@test.com')).toBeInTheDocument();
            }, { timeout: 3000 });
        });
    });

    // ===== USER EDIT =====
    describe('User Edit', () => {
        test('opens edit modal with user data', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const editButtons = screen.getAllByTitle('Edit User');
            fireEvent.click(editButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Edit User Details')).toBeInTheDocument();
                expect(screen.getByDisplayValue('Employee')).toBeInTheDocument();
                expect(screen.getByDisplayValue('One')).toBeInTheDocument();
                expect(screen.getByDisplayValue('emp1@test.com')).toBeInTheDocument();
            });
        });

        test('validates edit form fields', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const editButtons = screen.getAllByTitle('Edit User');
            fireEvent.click(editButtons[0]);

            await waitFor(() => screen.getByText('Edit User Details'));

            const modal = screen.getByText('Edit User Details').closest('.modal');

            // Clear required fields
            fireEvent.change(within(modal).getByLabelText(/First Name/i), { target: { value: '' } });
            fireEvent.change(within(modal).getByLabelText(/Last Name/i), { target: { value: '' } });
            fireEvent.change(within(modal).getByLabelText(/Email Address/i), { target: { value: '' } });

            fireEvent.click(within(modal).getByRole('button', { name: /Save Changes/i }));

            await waitFor(() => {
                expect(screen.getByText('First Name is required')).toBeInTheDocument();
                expect(screen.getByText('Last Name is required')).toBeInTheDocument();
                expect(screen.getByText('Email is required')).toBeInTheDocument();
            });
        });

        test('validates email format in edit form', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const editButtons = screen.getAllByTitle('Edit User');
            fireEvent.click(editButtons[0]);

            await waitFor(() => screen.getByText('Edit User Details'));

            const modal = screen.getByText('Edit User Details').closest('.modal');

            fireEvent.change(within(modal).getByLabelText(/Email Address/i), { target: { value: 'invalid-email' } });
            fireEvent.click(within(modal).getByRole('button', { name: /Save Changes/i }));

            await waitFor(() => {
                expect(screen.getByText('Invalid email format')).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        test('validates manager selection for employee in edit form', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const editButtons = screen.getAllByTitle('Edit User');
            fireEvent.click(editButtons[0]);

            await waitFor(() => screen.getByText('Edit User Details'));

            const modal = screen.getByText('Edit User Details').closest('.modal');

            // Clear manager selection
            const managerSelect = within(modal).getAllByRole('combobox').find(select =>
                select.querySelector('option[value="m1"]')
            );
            fireEvent.change(managerSelect, { target: { value: '' } });

            fireEvent.click(within(modal).getByRole('button', { name: /Save Changes/i }));

            await waitFor(() => {
                expect(screen.getByText('Please select a manager for the employee')).toBeInTheDocument();
            });
        });

        test('successfully updates user', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const editButtons = screen.getAllByTitle('Edit User');
            fireEvent.click(editButtons[0]);

            await waitFor(() => screen.getByText('Edit User Details'));

            const modal = screen.getByText('Edit User Details').closest('.modal');

            fireEvent.change(within(modal).getByLabelText(/First Name/i), { target: { value: 'Updated' } });
            fireEvent.click(within(modal).getByRole('button', { name: /Save Changes/i }));

            await waitFor(() => {
                expect(api.put).toHaveBeenCalledWith('/users/e1', expect.objectContaining({
                    firstName: 'Updated'
                }));
                expect(screen.getByText('User updated successfully!')).toBeInTheDocument();
            });

            // Modal should close after 1.5s
            await waitFor(() => {
                expect(screen.queryByText('Edit User Details')).not.toBeInTheDocument();
            }, { timeout: 2000 });
        });

        test('handles edit API error', async () => {
            api.put.mockRejectedValueOnce({
                response: { data: { message: 'Update failed' } }
            });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const editButtons = screen.getAllByTitle('Edit User');
            fireEvent.click(editButtons[0]);

            await waitFor(() => screen.getByText('Edit User Details'));

            const modal = screen.getByText('Edit User Details').closest('.modal');

            fireEvent.change(within(modal).getByLabelText(/First Name/i), { target: { value: 'Updated' } });
            fireEvent.click(within(modal).getByRole('button', { name: /Save Changes/i }));

            await waitFor(() => {
                expect(screen.getByText('Update failed')).toBeInTheDocument();
            });
        });

        test('closes edit modal', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const editButtons = screen.getAllByTitle('Edit User');
            fireEvent.click(editButtons[0]);

            await waitFor(() => screen.getByText('Edit User Details'));

            const modal = screen.getByText('Edit User Details').closest('.modal');
            const closeButton = within(modal).getByLabelText('Close');
            fireEvent.click(closeButton);

            await waitFor(() => {
                expect(screen.queryByText('Edit User Details')).not.toBeInTheDocument();
            });
        });
    });

    // ===== USER DELETE =====
    describe('User Delete', () => {
        test('opens delete confirmation modal', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const deleteButtons = screen.getAllByTitle('Delete User');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => {
                expect(screen.getByText('Delete User?')).toBeInTheDocument();
                expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
            });
        });

        test('successfully deletes user', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const deleteButtons = screen.getAllByTitle('Delete User');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => screen.getByText('Delete User?'));

            const modal = screen.getByText('Delete User?').closest('.modal');
            fireEvent.click(within(modal).getByRole('button', { name: /Confirm Deletion/i }));

            await waitFor(() => {
                expect(api.delete).toHaveBeenCalledWith('/users/e1');
                expect(screen.getByText('User deleted successfully!')).toBeInTheDocument();
            });

            // Modal should close after 1.5s
            await waitFor(() => {
                expect(screen.queryByText('Delete User?')).not.toBeInTheDocument();
            }, { timeout: 2000 });
        });

        test('handles delete API error', async () => {
            api.delete.mockRejectedValueOnce({
                response: { data: { message: 'Cannot delete user' } }
            });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const deleteButtons = screen.getAllByTitle('Delete User');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => screen.getByText('Delete User?'));

            const modal = screen.getByText('Delete User?').closest('.modal');
            fireEvent.click(within(modal).getByRole('button', { name: /Confirm Deletion/i }));

            await waitFor(() => {
                expect(screen.getByText('Cannot delete user')).toBeInTheDocument();
            });
        });

        test('cancels delete operation', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('People'));
            await waitFor(() => screen.getByText('Employee One'));

            const deleteButtons = screen.getAllByTitle('Delete User');
            fireEvent.click(deleteButtons[0]);

            await waitFor(() => screen.getByText('Delete User?'));

            const modal = screen.getByText('Delete User?').closest('.modal');
            fireEvent.click(within(modal).getByRole('button', { name: /Cancel/i }));

            await waitFor(() => {
                expect(screen.queryByText('Delete User?')).not.toBeInTheDocument();
            });

            expect(api.delete).not.toHaveBeenCalled();
        });
    });

    // ===== TALENT SEARCH =====
    describe('Talent Search', () => {
        test('adds skills to search', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('Talent'));

            await waitFor(() => {
                const headings = screen.getAllByRole('heading', { name: /Talent Discovery/i });
                expect(headings[0]).toBeInTheDocument();
            }, { timeout: 3000 });

            const skillSelect = screen.getByLabelText(/Add skill to search/i);
            fireEvent.change(skillSelect, { target: { value: 'Java' } });

            await waitFor(() => {
                expect(screen.getByText('Java')).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        test('removes skills from search', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('Talent'));

            await waitFor(() => {
                const headings = screen.getAllByRole('heading', { name: /Talent Discovery/i });
                expect(headings[0]).toBeInTheDocument();
            }, { timeout: 3000 });

            const skillSelect = screen.getByLabelText(/Add skill to search/i);
            fireEvent.change(skillSelect, { target: { value: 'Java' } });

            await waitFor(() => screen.getByText('Java'), { timeout: 3000 });

            const removeButton = screen.getByLabelText(/Remove Java/i);
            fireEvent.click(removeButton);

            await waitFor(() => {
                expect(screen.queryByText('Java')).not.toBeInTheDocument();
            }, { timeout: 3000 });
        });

        test('performs talent search successfully', async () => {
            const mockResults = [
                {
                    employeeName: 'John Doe',
                    matches: [
                        { skillName: 'Java', proficiencyLevel: 'ADVANCED' }
                    ],
                    status: 'APPROVED'
                }
            ];

            api.get.mockImplementation((url) => {
                if (url.includes('/skills/search')) return Promise.resolve({ data: mockResults });
                if (url === '/catalog/skills') return Promise.resolve({ data: mockSkills });
                if (url === '/users/managers') return Promise.resolve({ data: mockManagers });
                if (url === '/users/employees') return Promise.resolve({ data: mockEmployees });
                if (url === '/users/hrs') return Promise.resolve({ data: mockHRs });
                return Promise.resolve({ data: [] });
            });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('Talent'));

            await waitFor(() => {
                const headings = screen.getAllByRole('heading', { name: /Talent Discovery/i });
                expect(headings[0]).toBeInTheDocument();
            }, { timeout: 3000 });

            const skillSelect = screen.getByLabelText(/Add skill to search/i);
            fireEvent.change(skillSelect, { target: { value: 'Java' } });

            await waitFor(() => screen.getByText('Java'));

            fireEvent.click(screen.getByRole('button', { name: /Search/i }));

            await waitFor(() => {
                expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/skills/search?skills=Java'));
                expect(screen.getByText('John Doe')).toBeInTheDocument();
                expect(screen.getByText('APPROVED')).toBeInTheDocument();
            });
        });

        test('handles talent search with multiple skills', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('Talent'));

            await waitFor(() => {
                const headings = screen.getAllByRole('heading', { name: /Talent Discovery/i });
                expect(headings[0]).toBeInTheDocument();
            }, { timeout: 3000 });

            const skillSelect = screen.getByLabelText(/Add skill to search/i);

            fireEvent.change(skillSelect, { target: { value: 'Java' } });
            await waitFor(() => screen.getByText('Java'));

            fireEvent.change(skillSelect, { target: { value: 'React' } });
            await waitFor(() => screen.getByText('React'));

            fireEvent.click(screen.getByRole('button', { name: /Search/i }));

            await waitFor(() => {
                expect(api.get).toHaveBeenCalledWith(expect.stringContaining('skills=Java'));
                expect(api.get).toHaveBeenCalledWith(expect.stringContaining('skills=React'));
            });
        });

        test('does not search with empty skills', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('Talent'));

            await waitFor(() => {
                const headings = screen.getAllByRole('heading', { name: /Talent Discovery/i });
                expect(headings[0]).toBeInTheDocument();
            }, { timeout: 3000 });

            const searchButton = screen.getByRole('button', { name: /Search/i });
            expect(searchButton).toBeDisabled();
        });

        test('handles talent search error', async () => {
            api.get.mockImplementation((url) => {
                if (url.includes('/skills/search')) return Promise.reject(new Error('Search failed'));
                if (url === '/catalog/skills') return Promise.resolve({ data: mockSkills });
                return Promise.resolve({ data: [] });
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);
            const sidebar = screen.getByRole('navigation', { name: 'Sidebar' });
            fireEvent.click(within(sidebar).getByText('Talent'));

            await waitFor(() => {
                const headings = screen.getAllByRole('heading', { name: /Talent Discovery/i });
                expect(headings[0]).toBeInTheDocument();
            }, { timeout: 3000 });

            const skillSelect = screen.getByLabelText(/Add skill to search/i);
            fireEvent.change(skillSelect, { target: { value: 'Java' } });

            await waitFor(() => screen.getByText('Java'), { timeout: 3000 });

            fireEvent.click(screen.getByRole('button', { name: /Search/i }));

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Failed to search talent:', expect.any(Error));
            }, { timeout: 3000 });

            consoleSpy.mockRestore();
        });
    });

    // ===== INITIAL DATA LOADING ERRORS =====
    describe('Initial Data Loading - Error Handling', () => {
        test('handles managers fetch error', async () => {
            api.get.mockImplementation((url) => {
                if (url === '/users/managers') return Promise.reject(new Error('Failed to fetch managers'));
                if (url === '/users/employees') return Promise.resolve({ data: mockEmployees });
                if (url === '/users/hrs') return Promise.resolve({ data: mockHRs });
                return Promise.resolve({ data: [] });
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch managers:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });

        test('handles employees fetch error', async () => {
            api.get.mockImplementation((url) => {
                if (url === '/users/employees') return Promise.reject(new Error('Failed to fetch employees'));
                if (url === '/users/managers') return Promise.resolve({ data: mockManagers });
                if (url === '/users/hrs') return Promise.resolve({ data: mockHRs });
                return Promise.resolve({ data: [] });
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch employees:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });

        test('handles HRs fetch error', async () => {
            api.get.mockImplementation((url) => {
                if (url === '/users/hrs') return Promise.reject(new Error('Failed to fetch HRs'));
                if (url === '/users/managers') return Promise.resolve({ data: mockManagers });
                if (url === '/users/employees') return Promise.resolve({ data: mockEmployees });
                return Promise.resolve({ data: [] });
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch HRs:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });

        test('handles bench users fetch error', async () => {
            api.get.mockImplementation((url) => {
                if (url === '/users/bench') return Promise.reject(new Error('Failed to fetch bench users'));
                if (url === '/users/managers') return Promise.resolve({ data: mockManagers });
                if (url === '/users/employees') return Promise.resolve({ data: mockEmployees });
                if (url === '/users/hrs') return Promise.resolve({ data: mockHRs });
                return Promise.resolve({ data: [] });
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch bench users:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });

        test('handles catalog skills fetch error', async () => {
            api.get.mockImplementation((url) => {
                if (url === '/catalog/skills') return Promise.reject(new Error('Failed to load skill catalog'));
                if (url === '/users/managers') return Promise.resolve({ data: mockManagers });
                if (url === '/users/employees') return Promise.resolve({ data: mockEmployees });
                if (url === '/users/hrs') return Promise.resolve({ data: mockHRs });
                return Promise.resolve({ data: [] });
            });

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Failed to load skill catalog', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });

        test('handles pending requests count fetch error', async () => {
            allocationsApi.getPendingRequests.mockRejectedValueOnce(new Error('Failed to fetch pending requests'));

            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch pending requests count:', expect.any(Error));
            });

            consoleSpy.mockRestore();
        });
    });

    // ===== DASHBOARD STATS =====
    describe('Dashboard Stats', () => {
        test('displays correct team count', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                const teamSizeCard = screen.getByText('Employee Management').closest('.STAT-CARD');
                // Total: 2 managers + 2 employees + 1 HR = 5
                expect(within(teamSizeCard).getByText('5')).toBeInTheDocument();
            });
        });

        test('displays bench count', async () => {
            api.get.mockImplementation((url) => {
                if (url === '/users/bench') return Promise.resolve({ data: [{ id: 'b1' }, { id: 'b2' }] });
                if (url === '/users/managers') return Promise.resolve({ data: mockManagers });
                if (url === '/users/employees') return Promise.resolve({ data: mockEmployees });
                if (url === '/users/hrs') return Promise.resolve({ data: mockHRs });
                return Promise.resolve({ data: [] });
            });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                const benchCard = screen.getByText('On Bench').closest('.STAT-CARD');
                expect(within(benchCard).getByText('2')).toBeInTheDocument();
            });
        });

        test('displays active requests count', async () => {
            allocationsApi.getPendingRequests.mockResolvedValueOnce({
                data: [{ id: 1 }, { id: 2 }, { id: 3 }]
            });

            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                // Get all 'Approvals' text (sidebar + stat card), use the stat card one
                const approvalsTexts = screen.getAllByText('Approvals');
                const approvalsCard = approvalsTexts[approvalsTexts.length - 1].closest('.STAT-CARD');
                expect(within(approvalsCard).getByText('3')).toBeInTheDocument();
            }, { timeout: 3000 });
        });
    });

    // ===== STAT CARD NAVIGATION =====
    describe('Stat Card Navigation', () => {
        test('navigates to People section via stat card click', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => screen.getByText('Employee Management'));

            const employeeCard = screen.getByText('Employee Management').closest('.STAT-CARD');
            const clickableArea = within(employeeCard).getByRole('button', { name: /View details for Employee Management/i });

            fireEvent.click(clickableArea);

            await waitFor(() => {
                expect(screen.getByText(/New User/i)).toBeInTheDocument();
            });
        });

        test('navigates to Bench section via stat card button', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => screen.getByText('On Bench'));

            const benchCard = screen.getByText('On Bench').closest('.STAT-CARD');
            const viewDetailsButton = within(benchCard).getByText('View Details');

            fireEvent.click(viewDetailsButton);

            await waitFor(() => {
                expect(screen.getByTestId('bench-allocation')).toBeInTheDocument();
            });
        });

        test('navigates via keyboard (Enter key)', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => {
                expect(screen.getAllByText('Approvals').length).toBeGreaterThan(0);
            }, { timeout: 3000 });

            const approvalsTexts = screen.getAllByText('Approvals');
            const approvalsCard = approvalsTexts[approvalsTexts.length - 1].closest('.STAT-CARD');
            const clickableArea = within(approvalsCard).getByRole('button', { name: /View details for Approvals/i });

            fireEvent.keyDown(clickableArea, { key: 'Enter' });

            await waitFor(() => {
                expect(screen.getByTestId('allocation-approvals')).toBeInTheDocument();
            }, { timeout: 3000 });
        });

        test('navigates via keyboard (Space key)', async () => {
            render(<MemoryRouter><HRDashboard /></MemoryRouter>);

            await waitFor(() => screen.getByText('Skill Catalog'), { timeout: 3000 });

            const skillsCard = screen.getByText('Skill Catalog').closest('.STAT-CARD');
            const clickableArea = within(skillsCard).getByRole('button', { name: /View details for Skill Catalog/i });

            fireEvent.keyDown(clickableArea, { key: ' ' });

            await waitFor(() => {
                expect(screen.getByTestId('skill-catalog')).toBeInTheDocument();
            });
        });
    });
});
