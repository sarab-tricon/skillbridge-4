import { render, screen, fireEvent } from '@testing-library/react';
import AllocationCard from '../components/AllocationCard';

describe('AllocationCard Component', () => {
    const mockAlloc = {
        projectName: 'Test Project',
        assignmentStatus: 'ACTIVE',
        billingType: 'BILLABLE',
        startDate: '2025-01-01',
        endDate: '2025-12-31'
    };
    const mockCompanyName = 'Test Company';
    const mockAllocationValue = 50;

    it('renders the collapsed state initially', () => {
        render(<AllocationCard alloc={mockAlloc} companyName={mockCompanyName} allocationValue={mockAllocationValue} />);
        
        expect(screen.getByText('Test Project')).toBeInTheDocument();
        expect(screen.getByText('Test Company')).toBeInTheDocument();
        expect(screen.getByText('View Project Details')).toBeInTheDocument();
        expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
    });

    it('expands when "View Project Details" is clicked', () => {
        render(<AllocationCard alloc={mockAlloc} companyName={mockCompanyName} allocationValue={mockAllocationValue} />);
        
        const expandButton = screen.getByText('View Project Details');
        fireEvent.click(expandButton);

        expect(screen.getByText('Project Overview')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
        expect(screen.getByText('BILLABLE')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('Minimize')).toBeInTheDocument();
    });

    it('collapses when "Minimize" is clicked', () => {
        render(<AllocationCard alloc={mockAlloc} companyName={mockCompanyName} allocationValue={mockAllocationValue} />);
        
        fireEvent.click(screen.getByText('View Project Details'));
        expect(screen.getByText('Project Overview')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Minimize'));
        expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
        expect(screen.getByText('View Project Details')).toBeInTheDocument();
    });

    it('collapses when close icon is clicked', () => {
        render(<AllocationCard alloc={mockAlloc} companyName={mockCompanyName} allocationValue={mockAllocationValue} />);
        
        fireEvent.click(screen.getByText('View Project Details'));
        
        const closeButton = screen.getByTitle('Close');
        fireEvent.click(closeButton);

        expect(screen.queryByText('Project Overview')).not.toBeInTheDocument();
    });

    it('handles pending status with different styling', () => {
        const pendingAlloc = { ...mockAlloc, assignmentStatus: 'PENDING' };
        render(<AllocationCard alloc={pendingAlloc} companyName={mockCompanyName} allocationValue={mockAllocationValue} />);
        
        fireEvent.click(screen.getByText('View Project Details'));
        
        const statusBadge = screen.getByText('PENDING');
        expect(statusBadge).toHaveClass('bg-warning');
    });

    it('uses default values when props are missing', () => {
        const minimalAlloc = { assignmentStatus: 'OTHER' };
        render(<AllocationCard alloc={minimalAlloc} />);
        
        expect(screen.getByText('Corporate Client')).toBeInTheDocument();
        expect(screen.getByText('Unnamed Project')).toBeInTheDocument();
        
        fireEvent.click(screen.getByText('View Project Details'));
        expect(screen.getByText('External Client')).toBeInTheDocument();
        expect(screen.getByText('N/A')).toBeInTheDocument();
    });
});
