import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import BenchAllocation from '../components/BenchAllocation';
import ProjectManagement from '../components/ProjectManagement';
import SkillCatalog from '../components/SkillCatalog';


const HRDashboard = () => {
    const { user, role } = useAuth();
    const [activeSection, setActiveSection] = useState('overview');

    // -- State Management --
    const [stats, setStats] = useState({
        totalEmployees: 0,
        benchCount: 0,
        projectsCount: 0, // Placeholder
        activeRequests: 0 // Placeholder
    });
    const [employees, setEmployees] = useState([]);
    const [benchUsers, setBenchUsers] = useState([]);

    // Onboarding State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        managerId: ''
    });
    const [managers, setManagers] = useState([]);
    const [onboardingLoading, setOnboardingLoading] = useState(false);
    const [onboardingSuccess, setOnboardingSuccess] = useState(null);
    const [onboardingError, setOnboardingError] = useState(null);

    // Talent/Skill State
    const [searchSkills, setSearchSkills] = useState([]);
    const [catalogSkills, setCatalogSkills] = useState([]);
    const [talentResults, setTalentResults] = useState(null);
    const [talentLoading, setTalentLoading] = useState(false);
    const [talentError, setTalentError] = useState(null);

    // -- Effects --
    useEffect(() => {
        if (role === 'HR') {
            fetchInitialData();
        }
    }, [role]);

    const fetchInitialData = async () => {
        await Promise.all([
            fetchManagers(),
            fetchEmployees(),
            fetchBenchUsers(),
            fetchCatalog()
        ]);
    };

    const fetchManagers = async () => {
        try {
            const response = await api.get('/users/managers');
            setManagers(response.data);
        } catch (err) {
            console.error('Failed to fetch managers:', err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/users/employees');
            setEmployees(response.data);
            setStats(prev => ({ ...prev, totalEmployees: response.data.length }));
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        }
    };

    const fetchBenchUsers = async () => {
        try {
            const response = await api.get('/users/bench');
            setBenchUsers(response.data);
            setStats(prev => ({ ...prev, benchCount: response.data.length }));
        } catch (err) {
            console.error('Failed to fetch bench users:', err);
        }
    };

    const fetchCatalog = async () => {
        try {
            const response = await api.get('/catalog/skills');
            setCatalogSkills(response.data);
        } catch (err) {
            console.error('Failed to load skill catalog', err);
        }
    };

    const handleOnboardingSubmit = async (e) => {
        e.preventDefault();
        setOnboardingLoading(true);
        setOnboardingSuccess(null);
        setOnboardingError(null);

        if (formData.role === 'EMPLOYEE' && !formData.managerId) {
            setOnboardingError('Please select a manager for the employee.');
            setOnboardingLoading(false);
            return;
        }

        try {
            await api.post('/users', {
                ...formData,
                managerId: formData.role === 'EMPLOYEE' ? formData.managerId : null
            });
            setOnboardingSuccess(`User ${formData.firstName} ${formData.lastName} created successfully!`);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: 'EMPLOYEE',
                managerId: ''
            });
            fetchEmployees(); // Refresh list
        } catch (err) {
            console.error('Failed to create user:', err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to create user.';
            setOnboardingError(errorMsg);
        } finally {
            setOnboardingLoading(false);
        }
    };

    const handleTalentSearch = async (e) => {
        e.preventDefault();
        if (searchSkills.length === 0) return;

        setTalentLoading(true);
        setTalentError(null);
        setTalentResults([]);

        try {
            const skillsQuery = searchSkills.map(s => `skills=${encodeURIComponent(s)}`).join('&');
            const response = await api.get(`/skills/search?${skillsQuery}`);
            setTalentResults(response.data);
        } catch (err) {
            console.error('Failed to search talent:', err);
            setTalentError('Error occurred while searching for talent.');
        } finally {
            setTalentLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (role !== 'HR') {
        return (
            <div className="container py-5 text-center">
                <div className="alert alert-danger">
                    <h3>Access Denied</h3>
                    <p>Only HR administrators can access this module.</p>
                </div>
            </div>
        );
    }

    // -- Sub-Components --

    const StatCard = ({ title, value, icon, color, onClick }) => (
        <div className="col-md-3 mb-4">
            <div
                className="card shadow-sm border-0 h-100 STAT-CARD"
                style={{ cursor: 'pointer', borderLeft: `5px solid ${color}` }}
                onClick={onClick}
            >
                <div className="card-body d-flex align-items-center justify-content-between">
                    <div>
                        <h6 className="text-muted text-uppercase mb-2">{title}</h6>
                        <h2 className="fw-bold mb-0" style={{ color: color }}>{value}</h2>
                    </div>
                    <div className="rounded-circle p-3" style={{ backgroundColor: `${color}20` }}>
                        <i className={`bi ${icon} fs-4`} style={{ color: color }}></i>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOverview = () => (
        <div className="fade-in">
            <h3 className="fw-bold mb-4" style={{ color: '#CF4B00' }}>Dashboard Overview</h3>
            <div className="row g-4">
                <StatCard
                    title="Total Employees"
                    value={stats.totalEmployees}
                    icon="bi-people-fill"
                    color="#0d6efd"
                    onClick={() => setActiveSection('people')}
                />
                <StatCard
                    title="On Bench"
                    value={stats.benchCount}
                    icon="bi-hourglass-split"
                    color="#ffc107"
                    onClick={() => setActiveSection('bench')}
                />
                <StatCard
                    title="Skill Catalog"
                    value={catalogSkills.length}
                    icon="bi-journal-code"
                    color="#198754"
                    onClick={() => setActiveSection('catalog')}
                />
                <StatCard
                    title="Projects"
                    value="Manage"
                    icon="bi-folder-fill"
                    color="#6f42c1"
                    onClick={() => setActiveSection('projects')}
                />
                <StatCard
                    title="Talent Search"
                    value="Find"
                    icon="bi-search"
                    color="#0dcaf0"
                    onClick={() => setActiveSection('talent')}
                />
                <StatCard
                    title="Onboard New"
                    value="+"
                    icon="bi-person-plus-fill"
                    color="#CF4B00"
                    onClick={() => setActiveSection('people')}
                />
            </div>
        </div>
    );

    const renderPeopleManagement = () => (
        <div className="fade-in">
            <div className="row g-4">
                <div className="col-lg-4">
                    {renderOnboarding()}
                </div>
                <div className="col-lg-8">
                    {renderEmployeeDirectory()}
                </div>
            </div>
        </div>
    );

    const renderEmployeeDirectory = () => (
        <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '5px solid #0d6efd' }}>
            <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="card-title fw-bold m-0" style={{ color: '#0d6efd' }}>
                        <i className="bi bi-people-fill me-2"></i>Employee Directory
                    </h3>
                    <button className="btn btn-outline-primary btn-sm" onClick={fetchEmployees}>
                        <i className="bi bi-arrow-clockwise me-1"></i> Refresh
                    </button>
                </div>

                <div className="table-responsive" style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto', overflowX: 'hidden', border: '1px solid #dee2e6' }}>
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light sticky-top">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Manager Name</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length > 0 ? (
                                employees.map(emp => (
                                    <tr key={emp.id}>
                                        <td className="fw-bold">{emp.firstName} {emp.lastName}</td>
                                        <td>{emp.email}</td>
                                        <td><span className="badge bg-secondary">{emp.role}</span></td>
                                        <td><small className="text-muted">{emp.managerName || 'N/A'}</small></td>
                                        <td><span className="badge bg-success">Active</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-muted">No employees found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderOnboarding = () => (
        <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '5px solid #9CC6DB' }}>
            <div className="card-body p-4">
                <h3 className="card-title fw-bold mb-4" style={{ color: '#CF4B00' }}>
                    <i className="bi bi-person-plus-fill me-2"></i>Add New User
                </h3>

                {onboardingSuccess && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <i className="bi bi-check-circle-fill me-2"></i> {onboardingSuccess}
                        <button type="button" className="btn-close" onClick={() => setOnboardingSuccess(null)}></button>
                    </div>
                )}

                {onboardingError && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i> {onboardingError}
                        <button type="button" className="btn-close" onClick={() => setOnboardingError(null)}></button>
                    </div>
                )}

                <form onSubmit={handleOnboardingSubmit}>
                    <div className="row g-2">
                        <div className="col-md-6 mb-2">
                            <label className="form-label fw-bold small">First Name</label>
                            <input
                                type="text"
                                name="firstName"
                                className="form-control form-control-sm"
                                placeholder="John"
                                required
                                value={formData.firstName}
                                onChange={handleInputChange}
                                style={{ border: '1px solid #9CC6DB' }}
                            />
                        </div>
                        <div className="col-md-6 mb-2">
                            <label className="form-label fw-bold small">Last Name</label>
                            <input
                                type="text"
                                name="lastName"
                                className="form-control form-control-sm"
                                placeholder="Doe"
                                required
                                value={formData.lastName}
                                onChange={handleInputChange}
                                style={{ border: '1px solid #9CC6DB' }}
                            />
                        </div>
                    </div>

                    <div className="mb-2">
                        <label className="form-label fw-bold small">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control form-control-sm"
                            placeholder="user@skillbridge.com"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            style={{ border: '1px solid #9CC6DB' }}
                        />
                    </div>

                    <div className="mb-2">
                        <label className="form-label fw-bold small">Initial Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control form-control-sm"
                            placeholder="••••••••"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            style={{ border: '1px solid #9CC6DB' }}
                        />
                    </div>

                    <div className="row g-2">
                        <div className={formData.role === 'EMPLOYEE' ? "col-md-6 mb-2" : "col-12 mb-2"}>
                            <label className="form-label fw-bold small">Role</label>
                            <select
                                name="role"
                                className="form-select form-select-sm"
                                value={formData.role}
                                onChange={handleInputChange}
                                style={{ border: '1px solid #9CC6DB' }}
                            >
                                <option value="EMPLOYEE">EMPLOYEE</option>
                                <option value="MANAGER">MANAGER</option>
                                <option value="HR">HR</option>
                            </select>
                        </div>

                        {formData.role === 'EMPLOYEE' && (
                            <div className="col-md-6 mb-2">
                                <label className="form-label fw-bold small">Manager</label>
                                <select
                                    name="managerId"
                                    className="form-select form-select-sm"
                                    required
                                    value={formData.managerId}
                                    onChange={handleInputChange}
                                    style={{ border: '1px solid #9CC6DB' }}
                                >
                                    <option value="">Choose...</option>
                                    {managers.map(mgr => (
                                        <option key={mgr.id} value={mgr.id}>
                                            {mgr.firstName} {mgr.lastName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="mt-3">
                        <button
                            type="submit"
                            className="btn btn-sm w-100 text-white fw-bold"
                            style={{ backgroundColor: '#CF4B00' }}
                            disabled={onboardingLoading}
                        >
                            {onboardingLoading ? 'Saving...' : 'Onboard User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderTalentDiscovery = () => (
        <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '5px solid #9CC6DB' }}>
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="card-title fw-bold m-0" style={{ color: '#CF4B00' }}>
                        <i className="bi bi-search me-2"></i>Talent Discovery
                    </h4>
                    <div className="d-flex gap-2">
                        <span className="badge bg-success small" style={{ fontSize: '0.7rem' }}>Advanced</span>
                        <span className="badge bg-primary small" style={{ fontSize: '0.7rem' }}>Intermediate</span>
                        <span className="badge bg-warning text-dark small" style={{ fontSize: '0.7rem' }}>Beginner</span>
                    </div>
                </div>

                <form onSubmit={handleTalentSearch} className="mb-3">
                    <div className="d-flex flex-wrap gap-2 mb-2 p-2 border rounded bg-light" style={{ minHeight: '38px' }}>
                        {searchSkills.length === 0 ? (
                            <span className="text-muted small align-self-center">Select skills to search...</span>
                        ) : (
                            searchSkills.map(skill => (
                                <span key={skill} className="badge bg-secondary d-flex align-items-center gap-2">
                                    {skill}
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        style={{ fontSize: '0.5rem' }}
                                        onClick={() => setSearchSkills(prev => prev.filter(s => s !== skill))}
                                    ></button>
                                </span>
                            ))
                        )}
                    </div>
                    <div className="input-group input-group-sm">
                        <select
                            className="form-select"
                            style={{ border: '2px solid #9CC6DB' }}
                            onChange={(e) => {
                                const selected = e.target.value;
                                if (selected && !searchSkills.includes(selected)) {
                                    setSearchSkills(prev => [...prev, selected]);
                                }
                                e.target.value = '';
                            }}
                        >
                            <option value="">+ Add Skill</option>
                            {catalogSkills.map(skill => (
                                <option key={skill.id} value={skill.name}>{skill.name}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="btn text-white fw-bold"
                            style={{ backgroundColor: '#CF4B00' }}
                            disabled={talentLoading || searchSkills.length === 0}
                        >
                            <i className="bi bi-search me-2"></i>Search
                        </button>
                    </div>
                </form>

                {talentLoading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-info" role="status"></div>
                    </div>
                ) : talentResults && talentResults.length > 0 ? (
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table table-sm table-hover align-middle mb-0">
                            <thead className="table-light sticky-top">
                                <tr>
                                    <th>Name</th>
                                    <th>Skill</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {talentResults.map((res, idx) => (
                                    <tr key={idx}>
                                        <td className="fw-bold">{res.employeeName}</td>
                                        <td>
                                            {res.matches && res.matches.length > 0 ? (
                                                <div className="d-flex flex-wrap gap-1">
                                                    {res.matches.map((match, i) => (
                                                        <span key={i} className={`badge ${match.proficiencyLevel === 'ADVANCED' ? 'bg-success' :
                                                                match.proficiencyLevel === 'INTERMEDIATE' ? 'bg-primary' :
                                                                    'bg-warning text-dark'
                                                            }`}>
                                                            {match.skillName}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className={`badge ${res.proficiencyLevel === 'ADVANCED' ? 'bg-success' :
                                                        res.proficiencyLevel === 'INTERMEDIATE' ? 'bg-primary' :
                                                            'bg-warning text-dark'
                                                    }`}>
                                                    {res.skillName}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${res.status === 'APPROVED' ? 'bg-success' :
                                                res.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger'
                                                }`}>
                                                {res.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    talentResults !== null && <p className="text-muted text-center small mt-4">No results found.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="container-fluid" style={{ fontFamily: 'Pompiere, cursive', backgroundColor: '#FCF6D9', minHeight: '100vh', padding: 0 }}>
            <div className="row g-0">
                {/* Sidebar */}
                <div className="col-md-3 col-lg-2 d-md-block shadow-sm" style={{ backgroundColor: '#fff', minHeight: '100vh', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
                    <div className="p-4">
                        <h4 className="fw-bold mb-4" style={{ color: '#CF4B00' }}>HR Portal</h4>
                        <div className="list-group list-group-flush">
                            <button
                                onClick={() => setActiveSection('overview')}
                                className={`list-group-item list-group-item-action border-0 py-3 ${activeSection === 'overview' ? 'active' : ''}`}
                                style={activeSection === 'overview' ? { backgroundColor: '#9CC6DB', color: '#fff' } : {}}
                            >
                                <i className="bi bi-speedometer2 me-2"></i> Overview
                            </button>
                            <button
                                onClick={() => setActiveSection('people')}
                                className={`list-group-item list-group-item-action border-0 py-3 ${activeSection === 'people' ? 'active' : ''}`}
                                style={activeSection === 'people' ? { backgroundColor: '#9CC6DB', color: '#fff' } : {}}
                            >
                                <i className="bi bi-people-fill me-2"></i> People Management
                            </button>
                            <button
                                onClick={() => setActiveSection('projects')}
                                className={`list-group-item list-group-item-action border-0 py-3 ${activeSection === 'projects' ? 'active' : ''}`}
                                style={activeSection === 'projects' ? { backgroundColor: '#9CC6DB', color: '#fff' } : {}}
                            >
                                <i className="bi bi-folder me-2"></i> Project Management
                            </button>
                            <button
                                onClick={() => setActiveSection('bench')}
                                className={`list-group-item list-group-item-action border-0 py-3 ${activeSection === 'bench' ? 'active' : ''}`}
                                style={activeSection === 'bench' ? { backgroundColor: '#9CC6DB', color: '#fff' } : {}}
                            >
                                <i className="bi bi-people me-2"></i> Bench & Allocation
                            </button>
                            <button
                                onClick={() => setActiveSection('catalog')}
                                className={`list-group-item list-group-item-action border-0 py-3 ${activeSection === 'catalog' ? 'active' : ''}`}
                                style={activeSection === 'catalog' ? { backgroundColor: '#9CC6DB', color: '#fff' } : {}}
                            >
                                <i className="bi bi-list-check me-2"></i> Skill Catalog
                            </button>
                            <button
                                onClick={() => setActiveSection('talent')}
                                className={`list-group-item list-group-item-action border-0 py-3 ${activeSection === 'talent' ? 'active' : ''}`}
                                style={activeSection === 'talent' ? { backgroundColor: '#9CC6DB', color: '#fff' } : {}}
                            >
                                <i className="bi bi-search me-2"></i> Talent Discovery
                            </button>

                        </div>
                    </div>
                    <div className="mt-auto p-4 border-top">
                        <small className="text-muted">Logged in as: <br /><strong>{user?.sub}</strong></small>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col-md-9 col-lg-10" style={{ padding: 0 }}>
                    <header className="px-5 py-4 mb-4 shadow-sm" style={{ backgroundColor: '#FCF6D9' }}>
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="display-6 fw-bold m-0" style={{ color: '#CF4B00' }}>
                                    {activeSection === 'overview' && 'Dashboard Overview'}
                                    {activeSection === 'people' && 'People Management'}
                                    {activeSection === 'projects' && 'Project Management'}
                                    {activeSection === 'bench' && 'Bench Management & Allocation'}
                                    {activeSection === 'catalog' && 'Skill Catalog'}
                                    {activeSection === 'talent' && 'Talent Discovery'}

                                </h1>
                                <p className="lead text-muted m-0 small">Manage your organization's workforce and projects from one place.</p>
                            </div>
                            <div className="text-end">
                                <small className="text-muted">Welcome, <strong>{user?.sub.split('@')[0]}</strong></small>
                            </div>
                        </div>
                    </header>

                    <div className="px-5 pb-5 fade-in">
                        {activeSection === 'overview' && renderOverview()}
                        {activeSection === 'people' && renderPeopleManagement()}
                        {activeSection === 'projects' && <ProjectManagement />}
                        {activeSection === 'bench' && <BenchAllocation />}
                        {activeSection === 'catalog' && <SkillCatalog />}
                        {activeSection === 'talent' && renderTalentDiscovery()}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
