import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import BenchAllocation from '../components/BenchAllocation';
import ProjectManagement from '../components/ProjectManagement';
import SkillCatalog from '../components/SkillCatalog';
import AllocationApprovals from '../components/AllocationApprovals';
import Sidebar from '../components/Sidebar';


const HRDashboard = () => {
    const { user, role } = useAuth();
    const [activeSection, setActiveSection] = useState(() => {
        return localStorage.getItem('hrActiveSection') || 'overview';
    });

    // Persist active section to localStorage
    useEffect(() => {
        localStorage.setItem('hrActiveSection', activeSection);
    }, [activeSection]);

    // HR menu items for sidebar
    const hrMenuItems = [
        { id: 'overview', label: 'Dashboard', icon: 'bi-speedometer2' },
        { id: 'people', label: 'People', icon: 'bi-people-fill' },
        { id: 'projects', label: 'Projects', icon: 'bi-folder' },
        { id: 'approvals', label: 'Approvals', icon: 'bi-check-circle' },
        { id: 'bench', label: 'Bench & Alloc', icon: 'bi-people' },
        { id: 'catalog', label: 'Skills', icon: 'bi-list-check' },
        { id: 'talent', label: 'Talent', icon: 'bi-search' }
    ];

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
    const [hrs, setHrs] = useState([]);
    const [onboardingLoading, setOnboardingLoading] = useState(false);
    const [onboardingSuccess, setOnboardingSuccess] = useState(null);
    const [onboardingError, setOnboardingError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Talent/Skill State
    const [searchSkills, setSearchSkills] = useState([]);
    const [catalogSkills, setCatalogSkills] = useState([]);
    const [talentResults, setTalentResults] = useState(null);
    const [talentLoading, setTalentLoading] = useState(false);
    const [talentError, setTalentError] = useState(null);

    const [peopleTab, setPeopleTab] = useState('EMPLOYEES'); // 'EMPLOYEES', 'MANAGERS', 'HRS'

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
            fetchHRs(),
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

    const fetchHRs = async () => {
        try {
            const response = await api.get('/users/hrs');
            setHrs(response.data);
        } catch (err) {
            console.error('Failed to fetch HRs:', err);
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
            fetchManagers();
            fetchHRs();

            // Switch to the relevant tab
            if (formData.role === 'MANAGER') setPeopleTab('MANAGERS');
            else if (formData.role === 'HR') setPeopleTab('HRS');
            else setPeopleTab('EMPLOYEES');

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

    const StatCard = ({ title, value, icon, onClick }) => (
        <div className="col-md-3 mb-4">
            <div
                className="card shadow-sm border-0 h-100 STAT-CARD"
                style={{ cursor: 'pointer', borderLeft: `5px solid var(--color-primary)` }}
                onClick={onClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
            >
                <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                            <h6 className="text-muted text-uppercase mb-2" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '700' }}>{title}</h6>
                            <h2 className="fw-bold mb-0 text-dark">{value}</h2>
                        </div>
                        <div className="rounded-circle p-3 d-flex align-items-center justify-content-center"
                            style={{ backgroundColor: 'rgba(181, 64, 0, 0.1)', width: '50px', height: '50px' }}>
                            <i className={`bi ${icon} fs-4`} style={{ color: 'var(--color-primary)' }}></i>
                        </div>
                    </div>
                    <div className="mt-auto">
                        <button
                            className="btn btn-outline-accent btn-sm rounded-pill px-4 fw-bold w-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick();
                            }}
                        >
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderOverview = () => (
        <div className="fade-in">
            <div className="row g-4">
                <StatCard
                    title="Employee Management"
                    value={employees.length + managers.length + hrs.length}
                    icon="bi-people-fill"
                    onClick={() => { setActiveSection('people'); setPeopleTab('EMPLOYEES'); }}
                />
                <StatCard
                    title="On Bench"
                    value={stats.benchCount}
                    icon="bi-hourglass-split"
                    onClick={() => setActiveSection('bench')}
                />
                <StatCard
                    title="Skill Catalog"
                    value={catalogSkills.length}
                    icon="bi-journal-code"
                    onClick={() => setActiveSection('catalog')}
                />

                {/* Force break to put Talent and Projects on next row */}
                <div className="w-100"></div>

                <StatCard
                    title="Talent Search"
                    value="Find"
                    icon="bi-search"
                    onClick={() => setActiveSection('talent')}
                />
                <StatCard
                    title="Projects"
                    value="Manage"
                    icon="bi-folder-fill"
                    onClick={() => setActiveSection('projects')}
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
                    {renderPeopleDirectory()}
                </div>
            </div>
        </div>
    );



    const renderPeopleDirectory = () => {
        const getList = () => {
            switch (peopleTab) {
                case 'MANAGERS': return managers;
                case 'HRS': return hrs;
                default: return employees;
            }
        };

        const currentList = getList();
        const title = peopleTab === 'MANAGERS' ? 'Managers' : peopleTab === 'HRS' ? 'HR Administrators' : 'Employee Directory';

        return (
            <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '5px solid var(--color-primary)' }}>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <h4 className="card-title fw-bold m-0 text-dark">
                            <i className="bi bi-people-fill me-2 text-primary"></i>{title}
                        </h4>
                        <div className="d-flex gap-2">
                            <div className="btn-group btn-group-sm" role="group">
                                <button
                                    type="button"
                                    className={`btn ${peopleTab === 'EMPLOYEES' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setPeopleTab('EMPLOYEES')}
                                >
                                    Employees
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${peopleTab === 'MANAGERS' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setPeopleTab('MANAGERS')}
                                >
                                    Managers
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${peopleTab === 'HRS' ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setPeopleTab('HRS')}
                                >
                                    HR Ops
                                </button>
                            </div>
                        </div>
                    </div>

                    <div
                        className="table-responsive"
                        style={{
                            maxHeight: 'calc(100vh - 350px)',
                            overflowY: 'auto',
                            overflowX: 'auto',
                            border: '1px solid #dee2e6'
                        }}
                    >
                        <table className="table table-sm table-hover align-middle mb-0 small">
                            <thead className="table-light sticky-top">
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    {peopleTab === 'EMPLOYEES' && <th>Manager Name</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {currentList.length > 0 ? (
                                    currentList.map(user => (
                                        <tr key={user.id}>
                                            <td className="fw-bold">{user.firstName} {user.lastName}</td>
                                            <td>{user.email}</td>
                                            {peopleTab === 'EMPLOYEES' && <td><small className="text-muted">{user.managerName || 'N/A'}</small></td>}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={peopleTab === 'EMPLOYEES' ? '3' : '2'} className="text-center py-4 text-muted">No users found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderOnboarding = () => (
        <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '5px solid var(--color-primary)' }}>
            <div className="card-body p-4">
                <h3 className="card-title fw-bold mb-4 text-dark">
                    <i className="bi bi-person-plus-fill me-2 text-primary"></i>New User
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
                        />
                    </div>

                    <div className="mb-2">
                        <label className="form-label fw-bold small">Initial Password</label>
                        <div className="position-relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="form-control form-control-sm"
                                style={{ paddingRight: '30px' }}
                                placeholder="••••••••"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                            />
                            <button
                                type="button"
                                className="btn position-absolute end-0 top-50 translate-middle-y border-0 bg-transparent py-0 px-2"
                                style={{ zIndex: 10 }}
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted small`}></i>
                            </button>
                        </div>
                    </div>

                    <div className="row g-2">
                        <div className={formData.role === 'EMPLOYEE' ? "col-md-6 mb-2" : "col-12 mb-2"}>
                            <label className="form-label fw-bold small">Role</label>
                            <select
                                name="role"
                                className="form-select form-select-sm"
                                value={formData.role}
                                onChange={handleInputChange}
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
                            className="btn btn-primary btn-sm w-100 fw-bold"
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
        <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '5px solid var(--color-primary)' }}>
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="card-title fw-bold m-0 text-dark">
                        <i className="bi bi-search me-2 text-primary"></i>
                    </h4>
                    <div className="d-flex gap-2">
                        <span className="badge bg-success small">Advanced</span>
                        <span className="badge bg-primary small">Intermediate</span>
                        <span className="badge bg-warning text-dark small">Beginner</span>
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
                                        onClick={() => setSearchSkills(prev => prev.filter(s => s !== skill))}
                                        aria-label={`Remove ${skill}`}
                                    ></button>
                                </span>
                            ))
                        )}
                    </div>
                    <div className="input-group input-group-sm">
                        <select
                            className="form-select border-primary"
                            onChange={(e) => {
                                const selected = e.target.value;
                                if (selected && !searchSkills.includes(selected)) {
                                    setSearchSkills(prev => [...prev, selected]);
                                }
                                e.target.value = '';
                            }}
                            aria-label="Add skill to search"
                        >
                            <option value="">+ Add Skill</option>
                            {catalogSkills.map(skill => (
                                <option key={skill.id} value={skill.name}>{skill.name}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="btn btn-accent btn-sm fw-bold static-btn"
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
        <>
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <div className="container-fluid p-0 overflow-hidden" style={{ height: 'calc(100vh - 65px)', backgroundColor: 'var(--color-bg)' }}>
                <div className="row g-0 h-100">
                    {/* Sidebar */}
                    <Sidebar
                        title="Menu"
                        menuItems={hrMenuItems}
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                    />

                    {/* Main Content */}
                    <main role="main" id="main-content" className="col h-100" style={{ overflowY: 'auto', scrollbarGutter: 'stable' }}>
                        <div className="p-4 p-md-5">
                            <div className="page-header mb-4">
                                <div>
                                    <h1 className="page-title fw-bold text-accent">
                                        {activeSection === 'overview' && 'Dashboard Overview'}
                                        {activeSection === 'people' && 'People Management'}
                                        {activeSection === 'projects' && 'Project Management'}
                                        {activeSection === 'approvals' && 'Allocation Approvals'}
                                        {activeSection === 'bench' && 'Bench Management'}
                                        {activeSection === 'catalog' && 'Skill Catalog'}
                                        {activeSection === 'talent' && 'Talent Discovery'}
                                    </h1>
                                    <p className="lead text-muted m-0 small">Manage your organization's workforce and projects from one place.</p>
                                </div>
                            </div>

                            <div className="fade-in">
                                {activeSection === 'overview' && renderOverview()}
                                {activeSection === 'people' && renderPeopleManagement()}
                                {activeSection === 'projects' && <ProjectManagement />}
                                {activeSection === 'approvals' && <AllocationApprovals />}
                                {activeSection === 'bench' && <BenchAllocation />}
                                {activeSection === 'catalog' && <SkillCatalog />}
                                {activeSection === 'talent' && renderTalentDiscovery()}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
            <style>{`
                .static-btn:hover, .static-btn:active, .static-btn:focus {
                    transform: none !important;
                    transition: none !important;
                }
            `}</style>
        </>
    );
};

export default HRDashboard;
