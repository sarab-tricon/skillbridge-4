import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const EmployeeDashboard = () => {
    const { user } = useAuth();

    // Section States
    const [skills, setSkills] = useState([]);
    const [allocation, setAllocation] = useState(null);
    const [utilization, setUtilization] = useState(null);

    // Loading & Error States
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [loadingAlloc, setLoadingAlloc] = useState(true);
    const [loadingUtil, setLoadingUtil] = useState(true);
    const [errorSkills, setErrorSkills] = useState(null);
    const [errorAlloc, setErrorAlloc] = useState(null);
    const [errorUtil, setErrorUtil] = useState(null);

    useEffect(() => {
        // Fetch My Skills
        const fetchSkills = async () => {
            try {
                const response = await api.get('/skills/my');
                setSkills(response.data);
            } catch (err) {
                setErrorSkills('Failed to load skills.');
                console.error(err);
            } finally {
                setLoadingSkills(false);
            }
        };

        // Fetch My Allocation
        const fetchAllocation = async () => {
            try {
                const response = await api.get('/allocations/me');
                setAllocation(response.data);
            } catch (err) {
                setErrorAlloc('Failed to load allocation.');
                console.error(err);
            } finally {
                setLoadingAlloc(false);
            }
        };

        // Fetch My Utilization
        const fetchUtilization = async () => {
            try {
                const response = await api.get('/utilization/me');
                setUtilization(response.data);
            } catch (err) {
                setErrorUtil('Failed to load utilization.');
                console.error(err);
            } finally {
                setLoadingUtil(false);
            }
        };

        fetchSkills();
        fetchAllocation();
        fetchUtilization();
    }, []);

    return (
        <div className="container py-5">
            <header className="mb-5">
                <h1 className="display-4 fw-bold">Employee Dashboard</h1>
                <p className="lead text-muted">Welcome back, {user?.sub}. Here is your current overview.</p>
            </header>

            <div className="row g-4">
                {/* MY SKILLS SECTION */}
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm border-0" style={{ backgroundColor: 'white', borderTop: '5px solid var(--color-primary)' }}>
                        <div className="card-body p-4">
                            <h3 className="card-title fw-bold mb-4" style={{ color: 'var(--color-accent)' }}>My Skills</h3>
                            {loadingSkills ? (
                                <p className="text-muted">Loading skills...</p>
                            ) : errorSkills ? (
                                <p className="text-danger">{errorSkills}</p>
                            ) : skills.length === 0 ? (
                                <p className="text-muted italic">No skills added yet.</p>
                            ) : (
                                <ul className="list-unstyled">
                                    {skills.map((skill) => (
                                        <li key={skill.id} className="mb-3 d-flex justify-content-between align-items-center">
                                            <span style={{ fontSize: '1.4rem' }}>{skill.skillName}</span>
                                            <span className="badge" style={{ backgroundColor: 'var(--color-secondary)', color: '#333', fontSize: '1rem' }}>
                                                {skill.proficiencyLevel}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>

                {/* MY ALLOCATION SECTION */}
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm border-0" style={{ backgroundColor: 'white', borderTop: '5px solid var(--color-primary)' }}>
                        <div className="card-body p-4">
                            <h3 className="card-title fw-bold mb-4" style={{ color: 'var(--color-accent)' }}>My Allocation</h3>
                            {loadingAlloc ? (
                                <p className="text-muted">Loading allocation...</p>
                            ) : errorAlloc ? (
                                <p className="text-danger">{errorAlloc}</p>
                            ) : !allocation || allocation.allocationStatus === 'BENCH' ? (
                                <div>
                                    <p className="lead fw-bold text-muted mb-1">Bench</p>
                                    <p className="text-muted small">Not currently assigned to a project.</p>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="fw-bold mb-1" style={{ color: '#333' }}>{allocation.projectName}</h4>
                                    <p className="mb-3">
                                        <span className="badge rounded-pill bg-success me-2" style={{ fontSize: '0.9rem' }}>Active</span>
                                        <span className="text-muted" style={{ fontSize: '1.1rem' }}>{allocation.allocationStatus}</span>
                                    </p>
                                    <p className="text-muted small">Project ID: {allocation.projectId?.substring(0, 8)}...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* MY UTILIZATION SECTION */}
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm border-0" style={{ backgroundColor: 'white', borderTop: '5px solid var(--color-primary)' }}>
                        <div className="card-body p-4">
                            <h3 className="card-title fw-bold mb-4" style={{ color: 'var(--color-accent)' }}>My Utilization</h3>
                            {loadingUtil ? (
                                <p className="text-muted">Loading utilization...</p>
                            ) : errorUtil ? (
                                <p className="text-danger">{errorUtil}</p>
                            ) : (
                                <div className="text-center py-3">
                                    <div className="p-4 rounded-circle d-inline-block shadow-sm" style={{ backgroundColor: 'var(--color-bg)', border: '2px solid var(--color-secondary)' }}>
                                        <span className="display-6 fw-bold" style={{ color: 'var(--color-accent)' }}>
                                            {utilization?.allocationStatus === 'BILLABLE' ? '100%' : utilization?.allocationStatus === 'INVESTMENT' ? '100%' : '0%'}
                                        </span>
                                    </div>
                                    <p className="mt-4 lead fw-bold" style={{ color: '#333' }}>
                                        {utilization?.allocationStatus || 'UNKNOWN'}
                                    </p>
                                    <p className="text-muted small mb-0">Based on active project assignments.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
