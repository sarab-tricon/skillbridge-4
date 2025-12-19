import { useAuth } from '../context/AuthContext';

const ManagerDashboard = () => {
    const { user, role } = useAuth();

    const sections = [
        { title: 'Team Overview', description: 'Monitor your direct reports, their performance, and skill growth.' },
        { title: 'Team Allocations', description: 'Manage project assignments and shift schedules for your team.' },
        { title: 'Team Utilization', description: 'Analyze the utilization trends and bandwidth of your reports.' }
    ];

    return (
        <div className="container py-5">
            <header className="mb-5">
                <h1 className="display-4 fw-bold">Manager Dashboard</h1>
                <p className="lead text-muted">Welcome back, {user?.sub || 'Manager'}. Managing the {role} workspace.</p>
            </header>

            <div className="row g-4">
                {sections.map((section, index) => (
                    <div className="col-md-4" key={index}>
                        <div className="card h-100 shadow-sm border-0" style={{ backgroundColor: 'white', borderTop: `5px solid var(--color-primary)` }}>
                            <div className="card-body p-4">
                                <h3 className="card-title fw-bold mb-3" style={{ color: 'var(--color-accent)' }}>{section.title}</h3>
                                <p className="card-text text-muted" style={{ fontSize: '1.3rem' }}>{section.description}</p>
                                <div className="mt-4 pt-3 border-top" style={{ color: 'var(--color-secondary)' }}>
                                    <small>Managerial module pending data</small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ManagerDashboard;
