import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ManagerDashboard from '../pages/ManagerDashboard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { allocationsApi } from '../api/allocations';
import { MemoryRouter } from 'react-router-dom';

// --- MOCKS ---
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
        getPendingRequests: jest.fn(),
        updateRequestStatus: jest.fn(),
        forwardToHr: jest.fn(),
        rejectRequest: jest.fn(),
    },
}));

// Mock Sidebar to simplify navigation testing
jest.mock('../components/Sidebar', () => {
    return function MockSidebar({ onSectionChange, menuItems, activeSection }) {
        return (
            <nav aria-label="Sidebar">
                {menuItems.map(item => (
                    <button
                        key={item.id === null ? 'null' : item.id}
                        onClick={() => onSectionChange(item.id)}
                        aria-current={activeSection === item.id ? 'page' : undefined}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        );
    };
});

// Mock requestIdleCallback to execute immediately for testing
global.requestIdleCallback = jest.fn((cb) => cb());
global.cancelIdleCallback = jest.fn();

// Mock Lazy Loaded Components to avoid Suspense issues in tests
jest.mock('../components/ProfileSection', () => {
    return function DummyProfileSection() {
        return <div data-testid="profile-section">Profile Section</div>;
    };
});

jest.mock('../components/AllocationCard', () => {
    return function DummyAllocationCard({ alloc }) {
        return <div data-testid="allocation-card">{alloc.projectName}</div>;
    };
});

describe('ManagerDashboard', () => {
    const mockUser = { sub: 'manager@test.com', role: 'MANAGER' };

    const mockPendingSkills = [
        {
            id: 101,
            skillName: 'Python',
            proficiencyLevel: 'INTERMEDIATE',
            status: 'PENDING',
            employeeName: 'Alice Dev',
            employeeEmail: 'alice@test.com'
        },
        {
            id: 102,
            skillName: 'Docker',
            proficiencyLevel: 'BEGINNER',
            status: 'PENDING',
            employeeName: 'Bob Ops',
            employeeEmail: 'bob@test.com'
        }
    ];

    const mockTeam = [
        {
            id: 'u1',
            firstName: 'Alice',
            lastName: 'Dev',
            email: 'alice@test.com',
            role: 'EMPLOYEE',
            managerId: 'm1'
        },
        {
            id: 'u2',
            firstName: 'Bob',
            lastName: 'Ops',
            email: 'bob@test.com',
            role: 'EMPLOYEE',
            managerId: 'm1'
        }
    ];

    const defaultResponses = {
        '/skills/pending': { data: mockPendingSkills },
        '/users/team': { data: mockTeam },
        '/users/me': { data: { id: 'm1', firstName: 'Manager', lastName: 'User', email: 'manager@test.com' } },
        '/utilization/team': { data: [] },
        '/projects/active': { data: [] },
        '/assignments/my': { data: [] },
        '/skills/my': { data: [] },
        '/catalog/skills': { data: [] },
        '/utilization/me': { data: { assignments: [], totalUtilization: 0 } },
        '/allocation-requests/pending': { data: [] },
    };

    beforeEach(() => {
        api.get.mockReset();
        api.post.mockReset();
        api.put.mockReset();
        api.delete.mockReset();
        allocationsApi.getPendingRequests.mockReset();
        allocationsApi.updateRequestStatus.mockReset();
        allocationsApi.forwardToHr.mockReset();
        allocationsApi.rejectRequest.mockReset();

        window.localStorage.clear(); // Clear section persistence
        useAuth.mockReturnValue({ user: mockUser });

        // Default API Responses
        api.get.mockImplementation((url) => {
            const res = defaultResponses[url];
            if (res) return Promise.resolve(res);
            return Promise.resolve({ data: [] });
        });

        allocationsApi.getPendingRequests.mockResolvedValue({ data: [] });
    });

    it('renders dashboard overview correctly', async () => {
        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        await screen.findByRole('heading', { name: /Dashboard Overview/i, level: 1 });

        expect(screen.getByText('Team Size')).toBeInTheDocument();
        const teamSizeCard = screen.getByText('Team Size').closest('.card');
        expect(within(teamSizeCard).getByText('2')).toBeInTheDocument(); // Alice and Bob
    });

    it('handles side navigation to My Team correctly', async () => {
        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        const teamBtn = await within(sidebar).findByText('My Team');
        fireEvent.click(teamBtn);

        await screen.findByRole('heading', { name: /Team Management/i });
        expect(screen.getByText('Alice Dev')).toBeInTheDocument();
    });

    it('handles Skill Verification section', async () => {
        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        const navBtn = await within(sidebar).findByText('Verifications');
        fireEvent.click(navBtn);

        await screen.findByRole('heading', { name: /Skill Verifications/i });
        expect(await screen.findByText(/Python/i)).toBeInTheDocument();

        const pythonRow = screen.getByText(/Python/i).closest('tr');
        const verifyBtn = within(pythonRow).getByRole('button', { name: /Verify/i });

        api.put.mockResolvedValue({ data: {} });

        fireEvent.click(verifyBtn);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith(expect.stringContaining('101/verify'), expect.objectContaining({ status: 'APPROVED' }));
        });
    });

    it('handles Skill Rejection', async () => {
        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        const navBtn = await within(sidebar).findByText('Verifications');
        fireEvent.click(navBtn);

        await screen.findByRole('heading', { name: /Skill Verifications/i });
        const dockerText = await screen.findByText(/Docker/i);
        const dockerRow = dockerText.closest('tr');
        const rejectBtn = within(dockerRow).getByRole('button', { name: /Reject/i });

        api.put.mockResolvedValue({ data: {} });

        fireEvent.click(rejectBtn);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith(expect.stringContaining('102/verify'), expect.objectContaining({ status: 'REJECTED' }));
        });
    });

    it('handles Adding a New Skill', async () => {
        const catalogData = [{ id: 1, name: 'Java' }, { id: 2, name: 'AWS' }];

        api.get.mockImplementation((url) => {
            if (url === '/catalog/skills') return Promise.resolve({ data: catalogData });
            const res = defaultResponses[url];
            if (res) return Promise.resolve(res);
            return Promise.resolve({ data: [] });
        });

        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        const navBtn = await within(sidebar).findByText('My Skills');
        fireEvent.click(navBtn);

        await screen.findByRole('heading', { name: /MANAGER Skills/i });
        expect(await screen.findByText(/Add New Skill/i)).toBeInTheDocument();

        // Scope to the form container to avoid ambiguity with table headings
        const formContainer = screen.getByText(/Add New Skill/i).closest('.card');
        const skillSelect = within(formContainer).getByText(/Skill Name/i).closest('div').querySelector('select');
        const levelSelect = within(formContainer).getByText(/Proficiency Level/i).closest('div').querySelector('select');
        const submitBtn = within(formContainer).getByRole('button', { name: /Add Skill/i });

        fireEvent.change(skillSelect, { target: { value: 'Java' } });
        fireEvent.change(levelSelect, { target: { value: 'ADVANCED' } });

        api.post.mockResolvedValue({ data: { id: 501, skillName: 'Java', proficiencyLevel: 'ADVANCED', status: 'APPROVED' } });

        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/Skill added/i)).toBeInTheDocument();
        });
        expect(api.post).toHaveBeenCalled();
    });

    it('handles Project Requests section', async () => {
        const mockRequests = [
            { id: 1, employeeName: 'Alice', employeeEmail: 'alice@test.com', projectName: 'Project X', selectedBillingType: 'BILLABLE' }
        ];

        api.get.mockImplementation((url) => {
            if (url === '/allocation-requests/pending') return Promise.resolve({ data: mockRequests });
            const res = defaultResponses[url];
            if (res) return Promise.resolve(res);
            return Promise.resolve({ data: [] });
        });
        allocationsApi.getPendingRequests.mockResolvedValue({ data: mockRequests });

        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        const navBtn = await within(sidebar).findByText('Requests');
        fireEvent.click(navBtn);

        await screen.findByRole('heading', { name: /Project Requests/i });
        const requestRow = await screen.findByText(/Project X/i);
        const row = requestRow.closest('tr');

        const forwardBtn = within(row).getByRole('button', { name: /Forward to HR/i });
        fireEvent.click(forwardBtn);

        await screen.findByRole('heading', { name: /Forward to HR/i });
        const commentArea = await screen.findByRole('textbox', { name: /Comments for HR/i });
        fireEvent.change(commentArea, { target: { value: 'Strong candidate' } });

        allocationsApi.forwardToHr.mockResolvedValue({ data: {} });

        const confirmBtn = screen.getByRole('button', { name: /Forward Request/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(allocationsApi.forwardToHr).toHaveBeenCalled();
        });
    });

    it('handles Rejecting a Project Request with reason', async () => {
        const mockRequests = [
            { id: 2, employeeName: 'Bob', employeeEmail: 'bob@test.com', projectName: 'Project Y', selectedBillingType: 'INVESTMENT' }
        ];

        api.get.mockImplementation((url) => {
            if (url === '/allocation-requests/pending') return Promise.resolve({ data: mockRequests });
            const res = defaultResponses[url];
            if (res) return Promise.resolve(res);
            return Promise.resolve({ data: [] });
        });
        allocationsApi.getPendingRequests.mockResolvedValue({ data: mockRequests });

        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        const navBtn = await within(sidebar).findByText('Requests');
        fireEvent.click(navBtn);

        await screen.findByRole('heading', { name: /Project Requests/i });
        const requestRow = await screen.findByText(/Project Y/i);
        const row = requestRow.closest('tr');

        const rejectBtn = within(row).getByRole('button', { name: /Reject/i });
        fireEvent.click(rejectBtn);

        await screen.findByRole('heading', { name: /Reject Request/i });
        const reasonArea = await screen.findByRole('textbox', { name: /Rejection reason/i });
        fireEvent.change(reasonArea, { target: { value: 'Not available' } });

        allocationsApi.rejectRequest.mockResolvedValue({ data: {} });

        const confirmBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(allocationsApi.rejectRequest).toHaveBeenCalledWith(2, 'Not available');
        });
    });

    it('handles Utilization section', async () => {
        const mockUtil = {
            totalUtilization: 75,
            allocationStatus: 'PARTIALLY_ALLOCATED',
            assignments: [
                { projectName: 'Internal Tool', allocationPercent: 75, startDate: '2023-01-01', billingType: 'INVESTMENT' }
            ]
        };

        api.get.mockImplementation((url) => {
            if (url === '/utilization/me') return Promise.resolve({ data: mockUtil });
            const res = defaultResponses[url];
            if (res) return Promise.resolve(res);
            return Promise.resolve({ data: [] });
        });

        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        const navBtn = await within(sidebar).findByText('Utilization');
        fireEvent.click(navBtn);

        await screen.findByRole('heading', { name: /Utilization/i, level: 1 });
        expect(await screen.findByText(/Internal Tool/i)).toBeInTheDocument();
        expect(screen.getByText(/PARTIALLY_ALLOCATED/i)).toBeInTheDocument();
    });
});

// Helper for row scoping
import { within } from '@testing-library/react';
