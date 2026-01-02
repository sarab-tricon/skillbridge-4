import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
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

global.requestIdleCallback = jest.fn((cb) => cb());
global.cancelIdleCallback = jest.fn();

jest.mock('../components/ProfileSection', () => {
    return function DummyProfileSection({ onNavigateToSkills }) {
        return (
            <div data-testid="profile-section">
                Profile Section
                <button onClick={onNavigateToSkills}>Go to Skills</button>
            </div>
        );
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
        { id: 101, skillName: 'Python', proficiencyLevel: 'INTERMEDIATE', status: 'PENDING', employeeName: 'Alice', employeeEmail: 'alice@test.com' },
        { id: 102, skillName: 'Docker', proficiencyLevel: 'BEGINNER', status: 'PENDING', employeeName: 'Bob', employeeEmail: 'bob@test.com' }
    ];

    const mockTeam = [
        { id: 'u1', firstName: 'Alice', lastName: 'Dev', email: 'alice@test.com', role: 'EMPLOYEE', managerId: 'm1' },
        { id: 'u2', firstName: 'Bob', lastName: 'Ops', email: 'bob@test.com', role: 'EMPLOYEE', managerId: 'm1' }
    ];

    const mockTeamUtil = [
        { employeeId: 'u1', projectName: 'Project Alpha', allocationStatus: 'ALLOCATED', assignmentId: 'assign1' }
    ];

    const mockActiveProjects = [
        { id: 'p1', name: 'Project Alpha', companyName: 'Acme Corp', status: 'IN_PROGRESS' },
        { id: 'p2', name: 'Project Beta', companyName: 'Global Tech', status: 'IN_PROGRESS' }
    ];

    const defaultResponses = {
        '/skills/pending': { data: mockPendingSkills },
        '/users/team': { data: mockTeam },
        '/users/me': { data: { id: 'm1', firstName: 'Manager', lastName: 'User', email: 'manager@test.com' } },
        '/utilization/team': { data: mockTeamUtil },
        '/projects/active': { data: mockActiveProjects },
        '/assignments/my': { data: [] },
        '/skills/my': { data: [] },
        '/catalog/skills': { data: [{ id: 1, name: 'Java' }, { id: 2, name: 'React' }] },
        '/utilization/me': { data: { assignments: [], totalUtilization: 0 } },
        '/allocation-requests/pending': { data: [] },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.clear();
        useAuth.mockReturnValue({ user: mockUser });

        api.get.mockImplementation((url) => {
            return Promise.resolve(defaultResponses[url] || { data: [] });
        });

        // Mock success by default
        api.post.mockResolvedValue({ data: {} });
        api.put.mockResolvedValue({ data: {} });
        allocationsApi.getPendingRequests.mockResolvedValue({ data: [] });
        allocationsApi.forwardToHr.mockResolvedValue({ data: {} });
        allocationsApi.rejectRequest.mockResolvedValue({ data: {} });
    });

    // --- NAVIGATION & VIEW ---
    it('renders dashboard overview correctly', async () => {
        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        await screen.findByRole('heading', { name: /Dashboard Overview/i });
        expect(screen.getByText('Team Size')).toBeInTheDocument();
    });

    it('navigates via Sidebar', async () => {
        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        fireEvent.click(within(sidebar).getByText(/My Team/i));
        await screen.findByRole('heading', { name: /My Team/i });
    });

    it('handles "View Details" click on Cards', async () => {
        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const viewBtns = screen.getAllByText('View Details');
        fireEvent.click(viewBtns[0]); // Team Size card
        await screen.findByRole('heading', { name: /My Team/i });
    });

    // --- FUNCTIONALITY TESTS ---

    it('renders Active Projects and Team Assignments', async () => {
        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        fireEvent.click(within(sidebar).getByText(/Active Projects/i));

        await screen.findByText('Organization Projects');
        expect(screen.getAllByText('Project Alpha').length).toBeGreaterThan(0);

        // Team assign table
        expect(screen.getByText('Alice Dev')).toBeInTheDocument();
    });

    it('handles Skill Verification: Approve/Reject', async () => {
        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        fireEvent.click(within(sidebar).getByText(/Verifications/i));

        await screen.findByText('Python');

        // Verify
        const verifyBtns = screen.getAllByText('Verify');
        fireEvent.click(verifyBtns[0]);
        await waitFor(() => expect(api.put).toHaveBeenCalledWith(expect.stringContaining('verify'), { status: 'APPROVED' }));

        // Reject
        api.put.mockRejectedValueOnce(new Error('Fail'));
        const rejectBtns = screen.getAllByText('Reject');
        fireEvent.click(rejectBtns[0]);
    });

    it('handles Skill Management: Add and Validate', async () => {
        // Ensure catalog loaded
        api.get.mockImplementation((url) => {
            if (url === '/catalog/skills') return Promise.resolve({ data: [{ id: 1, name: 'Java' }] });
            if (url === '/skills/my') return Promise.resolve({ data: [] });
            return Promise.resolve(defaultResponses[url]);
        });

        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        fireEvent.click(within(sidebar).getByText(/Skill Management/i));

        await screen.findByText(/Add New Skill/i);

        // VALIDATION: Empty
        const addBtns = screen.getAllByText(/Add Skill/i);
        const submitBtn = addBtns[addBtns.length - 1]; // Last button is submit
        fireEvent.click(submitBtn);

        // Check for invalid class on select
        await waitFor(() => {
            // Find select by class?
            const selects = screen.getAllByRole('combobox');
            expect(selects[0]).toHaveClass('is-invalid');
        });

        // SUCCESSFUL ADD
        const form = submitBtn.closest('form');
        const selects = within(form).getAllByRole('combobox');

        fireEvent.change(selects[0], { target: { value: 'Java' } });
        fireEvent.click(submitBtn);

        await waitFor(() => expect(api.post).toHaveBeenCalled());
        await screen.findByText(/Skill added/i);
    });

    it('handles Skill Management: Edit and Cancel', async () => {
        // Mock a skill in 'ADVANCED' tab
        const mySkills = [{ id: 1, skillName: 'Java', proficiencyLevel: 'ADVANCED', status: 'APPROVED' }];
        api.get.mockImplementation((url) => {
            if (url === '/skills/my') return Promise.resolve({ data: mySkills });
            if (url === '/catalog/skills') return Promise.resolve({ data: [{ id: 1, name: 'Java' }] });
            return Promise.resolve(defaultResponses[url]);
        });

        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        fireEvent.click(within(sidebar).getByText(/Skill Management/i));

        // Switch to "Advanced" tab - FIXED SELECTOR
        const advTab = screen.getByRole('button', { name: /ADVANCED/i });
        fireEvent.click(advTab);

        await waitFor(() => expect(screen.getAllByText('Java').length).toBeGreaterThan(0));

        // Click Edit
        const editBtn = screen.getByTitle('Edit Skill');
        fireEvent.click(editBtn);

        // Check if Form changed to "Edit Skill" mode
        await screen.findByText('Edit Skill');

        // Change proficiency
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[1], { target: { value: 'EXPERT' } });

        // Click Cancel
        const cancelBtn = screen.getByText('Cancel');
        fireEvent.click(cancelBtn);

        // Should return to Add New Skill mode
        await screen.findByText('Add New Skill');

        // Click Edit again and Update
        fireEvent.click(editBtn);
        const updateBtn = screen.getByText('Update Skill');
        fireEvent.click(updateBtn);

        await waitFor(() => expect(api.put).toHaveBeenCalledWith('/skills/1', expect.anything()));
    });

    it('handles Skill Management: Duplicate', async () => {
        const mySkills = [{ id: 1, skillName: 'Java', proficiencyLevel: 'ADVANCED', status: 'APPROVED' }];
        api.get.mockImplementation((url) => {
            if (url === '/skills/my') return Promise.resolve({ data: mySkills });
            if (url === '/catalog/skills') return Promise.resolve({ data: [{ id: 1, name: 'Java' }] });
            return Promise.resolve(defaultResponses[url]);
        });

        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        fireEvent.click(within(sidebar).getByText(/Skill Management/i));

        await screen.findByText(/Add New Skill/i);

        // Select Java
        const selects = screen.getAllByRole('combobox');
        fireEvent.change(selects[0], { target: { value: 'Java' } });

        const addBtns = screen.getAllByText(/Add Skill/i);
        fireEvent.click(addBtns[addBtns.length - 1]);

        await screen.findByText(/You already have/i);
    });

    it('handles Allocation Requests: Reject (Modal)', async () => {
        const mockRequests = [{ id: 10, employeeName: 'Alice', projectName: 'Proj X', selectedBillingType: 'BILLABLE' }];
        api.get.mockImplementation((url) => {
            if (url === '/allocation-requests/pending') return Promise.resolve({ data: mockRequests });
            return Promise.resolve(defaultResponses[url]);
        });

        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        fireEvent.click(within(sidebar).getByText(/Requests/i));

        await screen.findByText('Proj X');

        const rejectBtns = screen.getAllByText('Reject');
        fireEvent.click(rejectBtns[0]);

        // Modal Should Appear
        await screen.findByText(/Confirm Rejection/i);

        // Cancel
        fireEvent.click(screen.getByText('Cancel'));
        await waitFor(() => expect(screen.queryByText(/Confirm Rejection/i)).not.toBeInTheDocument());

        // Reject Real
        fireEvent.click(rejectBtns[0]);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Reason' } });
        fireEvent.click(screen.getByText('Confirm Rejection'));

        await waitFor(() => expect(allocationsApi.rejectRequest).toHaveBeenCalled());
        await waitFor(() => expect(screen.queryByText(/Confirm Rejection/i)).not.toBeInTheDocument());
    });

    it('handles Allocation Requests: Forward (Modal)', async () => {
        const mockRequests = [{ id: 10, employeeName: 'Alice', projectName: 'Proj X', selectedBillingType: 'BILLABLE' }];
        api.get.mockImplementation((url) => {
            if (url === '/allocation-requests/pending') return Promise.resolve({ data: mockRequests });
            return Promise.resolve(defaultResponses[url]);
        });

        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        fireEvent.click(within(sidebar).getByText(/Requests/i));

        await screen.findByText('Proj X');

        const row = screen.getByText('Proj X').closest('tr');
        const buttons = within(row).getAllByRole('button');
        // Let's click the one that is NOT reject.
        const forwardBtn = buttons.find(b => b.textContent.match(/Forward/i) || b.className.includes('success'));

        if (forwardBtn) {
            fireEvent.click(forwardBtn);
            await screen.findByText(/Confirm Forward/i);
            fireEvent.click(screen.getByText('Forward Request'));
            await waitFor(() => expect(allocationsApi.forwardToHr).toHaveBeenCalled());
        }
    });

    it('handles Initial Load Error', async () => {
        api.get.mockImplementation((url) => Promise.reject(new Error('Fail')));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
        consoleSpy.mockRestore();
    });

    it('render My Utilization', async () => {
        const myUtil = {
            totalUtilization: 80,
            allocationStatus: 'PARTIAL',
            assignments: [
                { projectName: 'Project X', allocationPercent: 80, startDate: '2023-01-01', billingType: 'BILLABLE' }
            ]
        };
        api.get.mockImplementation((url) => {
            if (url === '/utilization/me') return Promise.resolve({ data: myUtil });
            return Promise.resolve(defaultResponses[url]);
        });

        render(<MemoryRouter><ManagerDashboard /></MemoryRouter>);
        const sidebar = screen.getByRole('navigation', { name: /sidebar/i });
        fireEvent.click(within(sidebar).getByText(/Utilization/i));

        await screen.findAllByText('80%');
    });

});
