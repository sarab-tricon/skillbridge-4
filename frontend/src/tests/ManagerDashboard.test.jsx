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
    },
}));

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
            user: { firstName: 'Alice', lastName: 'Dev', email: 'alice@test.com' }
        },
        {
            id: 102,
            skillName: 'Docker',
            proficiencyLevel: 'BEGINNER',
            status: 'PENDING',
            user: { firstName: 'Bob', lastName: 'Ops', email: 'bob@test.com' }
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

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue({ user: mockUser });

        // Default API Responses
        api.get.mockImplementation((url) => {
            if (url === '/skills/pending') return Promise.resolve({ data: mockPendingSkills });
            if (url === '/users/team') return Promise.resolve({ data: mockTeam });

            // Other calls needed for initial load
            if (url === '/users/me') return Promise.resolve({ data: { id: 'm1', ...mockUser } });
            if (url === '/utilization/team') return Promise.resolve({ data: [] });
            if (url === '/projects/active') return Promise.resolve({ data: [] });
            if (url === '/assignments/my') return Promise.resolve({ data: [] }); // For My Allocations
            if (url === '/skills/my') return Promise.resolve({ data: [] }); // For My Skills

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

        await waitFor(() => {
            expect(screen.getByText('Dashboard Overview')).toBeInTheDocument();
        });
    });

    it('renders Team Member cards correctly', async () => {
        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        // Switch to "My Team" section
        const teamButton = await screen.findByRole('button', { name: /My Team/i });
        fireEvent.click(teamButton);

        await waitFor(() => {
            expect(screen.getByText('Alice Dev')).toBeInTheDocument();
            expect(screen.getByText('alice@test.com')).toBeInTheDocument();
            expect(screen.getByText('Bob Ops')).toBeInTheDocument();
        });
    }, 10000); // Increased timeout for tab switching

    it('handles Skill Approval (Verify)', async () => {
        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        // Switch to "Verifications" section using Sidebar (simpler/stable)
        // Note: Sidebar button text is 'Verifications'. Card button has aria-label 'View details for Verifications'.
        // Exact match anchors to Sidebar.
        const navBtn = await screen.findByRole('button', { name: /^Verifications$/i });
        fireEvent.click(navBtn);

        // Wait for active section content to load (Pending Skills table)
        await waitFor(() => {
            expect(screen.getByText('Python')).toBeInTheDocument();
        });

        const pythonRow = screen.getByText('Python').closest('tr');
        const verifyBtn = within(pythonRow).getByRole('button', { name: /Verify/i });

        api.put.mockResolvedValue({ data: {} });

        fireEvent.click(verifyBtn);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith('/skills/101/verify', { status: 'APPROVED' });
        });
    }, 10000);

    it('handles Skill Rejection (Reject)', async () => {
        render(
            <MemoryRouter>
                <ManagerDashboard />
            </MemoryRouter>
        );

        const navBtn = await screen.findByRole('button', { name: /^Verifications$/i });
        fireEvent.click(navBtn);

        await waitFor(() => {
            expect(screen.getByText('Docker')).toBeInTheDocument();
        });

        const dockerRow = screen.getByText('Docker').closest('tr');
        const rejectBtn = within(dockerRow).getByRole('button', { name: /Reject/i });

        api.delete.mockResolvedValue({ data: {} });

        fireEvent.click(rejectBtn);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith('/skills/102/verify', { status: 'REJECTED' });
        });
    }, 10000);

});

// Helper for row scoping
import { within } from '@testing-library/react';
