import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EmployeeDashboard from '../pages/EmployeeDashboard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { allocationsApi } from '../api/allocations';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
jest.mock('../context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('../api/axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));

jest.mock('../api/allocations', () => ({
    allocationsApi: {
        getMyRequests: jest.fn(),
        createRequest: jest.fn(),
    },
}));

// Mock react-router-dom selectively
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/employee' }),
}));

describe('EmployeeDashboard Business Logic', () => {
    const mockUser = { sub: 'employee@test.com', role: 'EMPLOYEE' };

    const mockSkills = [
        { id: 1, skillName: 'React', proficiencyLevel: 'ADVANCED', status: 'APPROVED' },
        { id: 2, skillName: 'Node', proficiencyLevel: 'INTERMEDIATE', status: 'PENDING' },
    ];

    const mockAssignments = [
        {
            assignmentId: 101,
            projectName: 'Project Alpha',
            assignmentStatus: 'ACTIVE',
            allocationPercent: 60,
            billingType: 'BILLABLE'
        },
        {
            assignmentId: 102,
            projectName: 'Project Beta',
            assignmentStatus: 'ACTIVE',
            allocationPercent: 40,
            billingType: 'NON_BILLABLE'
        }
    ];

    const mockUtilization = {
        totalUtilization: 100,
        allocationStatus: 'ALLOCATED',
        assignments: mockAssignments
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        useAuth.mockReturnValue({ user: mockUser });

        // Default API resolutions
        api.get.mockImplementation((url) => {
            if (url === '/users/me') return Promise.resolve({
                data: {
                    id: '12345678-uuid',
                    firstName: 'Test',
                    lastName: 'User',
                    email: 'test@example.com',
                    role: 'EMPLOYEE'
                }
            });
            if (url === '/catalog/skills') return Promise.resolve({ data: [] });
            if (url === '/skills/my') return Promise.resolve({ data: mockSkills });
            if (url === '/assignments/my') return Promise.resolve({ data: mockAssignments });
            if (url === '/projects/active') return Promise.resolve({ data: [] });
            if (url === '/utilization/me') return Promise.resolve({ data: mockUtilization });
            return Promise.resolve({ data: {} });
        });

        allocationsApi.getMyRequests.mockResolvedValue({ data: [] });
    });

    it('calculates and displays metrics correctly on the overview page', async () => {
        render(
            <MemoryRouter>
                <EmployeeDashboard />
            </MemoryRouter>
        );

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
        });

        // Use findByText for metrics to be more resilient to loading delays
        // 1. Check Approved Skills Count
        expect(await screen.findByText('1')).toBeInTheDocument();

        // 2. Check Active Assignments Count
        expect(await screen.findByText('2')).toBeInTheDocument();

        // 3. Check Total Utilization Percentage
        expect(await screen.findByText('100%')).toBeInTheDocument();
    });

    it('prevents adding a duplicate skill (Business Logic Check)', async () => {
        const catalogData = [{ id: 1, name: 'React' }, { id: 2, name: 'Java' }];
        api.get.mockImplementation((url) => {
            if (url === '/users/me') return Promise.resolve({ data: { id: '12345678-uuid', firstName: 'Test', lastName: 'User', email: 'test@example.com', role: 'EMPLOYEE' } });
            if (url === '/catalog/skills') return Promise.resolve({ data: catalogData });
            if (url === '/skills/my') return Promise.resolve({ data: mockSkills });
            if (url === '/assignments/my') return Promise.resolve({ data: [] });
            if (url === '/projects/active') return Promise.resolve({ data: [] });
            if (url === '/utilization/me') return Promise.resolve({ data: {} });
            return Promise.resolve({ data: {} });
        });

        render(
            <MemoryRouter>
                <EmployeeDashboard />
            </MemoryRouter>
        );

        // Switch to skills section
        // Using findByRole for robustness
        const skillsLink = await screen.findByRole('button', { name: /My Skills/i });
        fireEvent.click(skillsLink);

        // Wait for skill management to load
        await waitFor(() => {
            expect(screen.getByText('Skill Management')).toBeInTheDocument();
        });

        // Use displayValue which is the default option text
        const select = screen.getByDisplayValue('Select a skill...');

        await waitFor(() => {
            expect(screen.getByText('React')).toBeInTheDocument();
        });

        fireEvent.change(select, { target: { value: 'React' } });

        const addButton = screen.getByRole('button', { name: /Add Skill/i });
        fireEvent.click(addButton);

        await waitFor(() => {
            expect(screen.getByText(/You already have "React" in your list/i)).toBeInTheDocument();
        });

        expect(api.post).not.toHaveBeenCalled();
    });

    it('switches sections correctly via sidebar navigation', async () => {
        render(
            <MemoryRouter>
                <EmployeeDashboard />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
        });

        // Click on Allocation
        const allocationLink = await screen.findByRole('button', { name: /Allocation/i });
        fireEvent.click(allocationLink);

        await waitFor(() => {
            expect(screen.getByText('My Projects')).toBeInTheDocument();
        });

        // Click on My Profile
        const profileLink = await screen.findByRole('button', { name: /My Profile/i });
        fireEvent.click(profileLink);

        await waitFor(() => {
            expect(screen.getByText('My Profile', { selector: 'h1' })).toBeInTheDocument();
        });
    });
});
