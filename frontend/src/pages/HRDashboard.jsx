import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const HRDashboard = () => {
    const { user, role } = useAuth();

    // -- State Management --
    const [utilizationData, setUtilizationData] = useState([]);
    const [utilizationLoading, setUtilizationLoading] = useState(true);
    const [utilizationError, setUtilizationError] = useState(null);

    const [projectsData, setProjectsData] = useState([]);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [projectsError, setProjectsError] = useState(null);

    const [searchSkill, setSearchSkill] = useState('');
    const [talentResults, setTalentResults] = useState(null); // null means no search performed yet
    const [talentLoading, setTalentLoading] = useState(false);
    const [talentError, setTalentError] = useState(null);

    // -- Effects --
    useEffect(() => {
        console.log("Current User:", user);
        console.log("Current Role:", role);
        fetchUtilization();
        fetchProjects();
    }, [user, role]);

    // -- API Calls --
    const fetchUtilization = async () => {
        setUtilizationLoading(true);
        setUtilizationError(null);
        try {
            const response = await api.get('/utilization/org');
            setUtilizationData(response.data);
        } catch (err) {
            console.error('Failed to fetch utilization:', err);
            setUtilizationError('Unable to load utilization data. Please try again later.');
        } finally {
            setUtilizationLoading(false);
        }
    };

    const fetchProjects = async () => {
        setProjectsLoading(true);
        setProjectsError(null);
        try {
            const response = await api.get('/projects/active');
            setProjectsData(response.data);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
            setProjectsError(`Error: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
        } finally {
            setProjectsLoading(false);
        }
    };

    const handleTalentSearch = async (e) => {
        e.preventDefault();
        if (!searchSkill.trim()) return;

        setTalentLoading(true);
        setTalentError(null);
        setTalentResults([]);

        try {
            const response = await api.get(`/skills/search?skill=${encodeURIComponent(searchSkill)}`);
            setTalentResults(response.data);
        } catch (err) {
            console.error('Failed to search talent:', err);
            setTalentError('Error occurred while searching for talent.');
        } finally {
            setTalentLoading(false);
        }
    };

    // -- Helpers --
    const getUtilizationBadgeColor = (type) => {
        switch (type?.toUpperCase()) {
            case 'BILLABLE': return 'success'; // Green
            case 'INVESTMENT': return 'warning'; // Orange/Yellow
            case 'BENCH': return 'danger'; // Red
            default: return 'secondary';
        }
    };

    const getProjectStatusBadgeColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE': return 'success';
            case 'COMPLETED': return 'info';
            case 'ON_HOLD': return 'warning';
            default: return 'secondary';
        }
    };

    return (
        <div className="container py-5" style={{ fontFamily: 'Pompiere, cursive' }}>
            <header className="mb-5 border-bottom pb-3" style={{ borderColor: 'var(--color-secondary)' }}>
                <h1 className="display-4 fw-bold" style={{ color: 'var(--color-accent)' }}>HR Control Panel</h1>
                <p className="lead text-muted">
                    Welcome, {user?.sub || 'HR Administrator'}.
                    <span className="ms-2 badge bg-info text-dark">{role} Workspace</span>
                </p>
            </header>

            <div className="row g-5">

                {/* Section 1: Organization Utilization */}
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '4px solid var(--color-primary)' }}>
                        <div className="card-body">
                            <h3 className="card-title fw-bold mb-4" style={{ color: 'var(--color-primary)' }}>
                                <i className="bi bi-people-fill me-2"></i>Organization Utilization
                            </h3>

                            {utilizationLoading && (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status"></div>
                                    <p className="mt-2 text-muted">Loading utilization data...</p>
                                </div>
                            )}

                            {utilizationError && (
                                <div className="alert alert-danger" role="alert">{utilizationError}</div>
                            )}

                            {!utilizationLoading && !utilizationError && utilizationData.length === 0 && (
                                <div className="alert alert-info">No utilization records found.</div>
                            )}

                            {!utilizationLoading && !utilizationError && utilizationData.length > 0 && (
                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Employee</th>
                                                <th>Role</th>
                                                <th>Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {utilizationData.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="fw-bold">{item.employeeName}</td>
                                                    <td className="text-muted small">{item.role}</td>
                                                    <td>
                                                        <span className={`badge bg-${getUtilizationBadgeColor(item.utilizationType)}`}>
                                                            {item.utilizationType}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 2: Talent Search */}
                <div className="col-lg-6">
                    <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '4px solid var(--color-secondary)' }}>
                        <div className="card-body">
                            <h3 className="card-title fw-bold mb-4" style={{ color: 'var(--color-accent)' }}>
                                <i className="bi bi-search me-2"></i>Talent Discovery
                            </h3>

                            <form onSubmit={handleTalentSearch} className="d-flex gap-2 mb-4">
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    placeholder="Search by skill (e.g., React, Java)..."
                                    value={searchSkill}
                                    onChange={(e) => setSearchSkill(e.target.value)}
                                    style={{ border: '2px solid var(--color-secondary)' }}
                                />
                                <button
                                    type="submit"
                                    className="btn btn-lg text-white"
                                    style={{ backgroundColor: 'var(--color-accent)', minWidth: '120px' }}
                                    disabled={talentLoading || !searchSkill.trim()}
                                >
                                    {talentLoading ? 'Searching...' : 'Find'}
                                </button>
                            </form>

                            {talentError && (
                                <div className="alert alert-danger" role="alert">{talentError}</div>
                            )}

                            {talentResults !== null && talentResults.length === 0 && !talentLoading && (
                                <div className="alert alert-warning">
                                    No employees found with skill: <strong>{searchSkill}</strong>
                                </div>
                            )}

                            {talentResults && talentResults.length > 0 && (
                                <div className="table-responsive bg-light rounded border p-2">
                                    <table className="table table-sm mb-0">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Skill</th>
                                                <th>Level</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {talentResults.map((res, idx) => (
                                                <tr key={idx}>
                                                    <td>{res.employeeName}</td>
                                                    <td>{res.skillName}</td>
                                                    <td>
                                                        <span className="badge bg-secondary">{res.proficiencyLevel}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {talentResults === null && !talentLoading && (
                                <div className="text-center text-muted py-4">
                                    <p>Enter a skill to find qualified employees across the organization.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 3: Active Projects */}
                <div className="col-12">
                    <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '4px solid var(--color-primary)' }}>
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h3 className="card-title fw-bold m-0" style={{ color: 'var(--color-primary)' }}>
                                    <i className="bi bi-kanban me-2"></i>Active Project Portfolio
                                </h3>
                                <button className="btn btn-outline-primary btn-sm" onClick={fetchProjects}>
                                    <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                                </button>
                            </div>

                            {projectsLoading && (
                                <div className="d-flex justify-content-center py-4">
                                    <div className="spinner-border text-info" role="status"></div>
                                </div>
                            )}

                            {projectsError && (
                                <div className="alert alert-danger">{projectsError}</div>
                            )}

                            {!projectsLoading && !projectsError && projectsData.length === 0 && (
                                <div className="text-center p-5 bg-light rounded">
                                    <h4>No Active Projects</h4>
                                    <p className="text-muted">There are currently no projects in the system.</p>
                                </div>
                            )}

                            {!projectsLoading && !projectsError && projectsData.length > 0 && (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle">
                                        <thead className="table-light text-uppercase small text-muted">
                                            <tr>
                                                <th style={{ width: '25%' }}>Project Name</th>
                                                <th style={{ width: '20%' }}>Client / Company</th>
                                                <th style={{ width: '15%' }}>Status</th>
                                                <th style={{ width: '25%' }}>Duration</th>
                                                <th style={{ width: '15%' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projectsData.map((project, idx) => (
                                                <tr key={idx}>
                                                    <td className="fw-bold fs-5">{project.name}</td>
                                                    <td className="text-muted">{project.companyName}</td>
                                                    <td>
                                                        <span className={`badge rounded-pill bg-${getProjectStatusBadgeColor(project.status)}`}>
                                                            {project.status?.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <small className="d-block text-muted">
                                                            {project.startDate} &mdash; {project.endDate}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <button className="btn btn-sm btn-light text-primary border">Details</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
