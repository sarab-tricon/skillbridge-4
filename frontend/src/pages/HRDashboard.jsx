import { useAuth } from '../context/AuthContext';

const HRDashboard = () => {
    const { user, role } = useAuth();

    const sections = [
        { title: 'Project Management', description: 'Create, edit, and track the status of all internal enterprise projects.' },
        { title: 'Allocation Management', description: 'Oversee entire workforce assignments and resolve bench constraints.' },
        { title: 'Utilization & Reports', description: 'Generate organization-wide utilization reports and intelligence insights.' }
    ];

    return (
        <div className="container py-5">
            <header className="mb-5">
                <h1 className="display-4 fw-bold">HR Dashboard</h1>
                <p className="lead text-muted">Welcome back, {user?.sub || 'HR Administrator'}. Oversight of the {role} workspace.</p>
            </header>

            <div className="row g-4">
                {sections.map((section, index) => (
                    <div className="col-md-4" key={index}>
                        <div className="card h-100 shadow-sm border-0" style={{ backgroundColor: 'white', borderTop: `5px solid var(--color-primary)` }}>
                            <div className="card-body p-4">
                                <h3 className="card-title fw-bold mb-3" style={{ color: 'var(--color-accent)' }}>{section.title}</h3>
                                <p className="card-text text-muted" style={{ fontSize: '1.3rem' }}>{section.description}</p>
                                <div className="mt-4 pt-3 border-top" style={{ color: 'var(--color-secondary)' }}>
                                    <small>Administrative workspace ready</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 p-4 rounded" style={{ backgroundColor: 'rgba(156, 198, 219, 0.1)', border: '1px dashed var(--color-primary)' }}>
                <p className="text-center mb-0 text-muted" style={{ fontSize: '1.2rem' }}>
                    Note: This is an administrative view. Please use caution when modifying organization-wide data.
                </p>
            </div>
        </div>
    );
};

export default HRDashboard;
