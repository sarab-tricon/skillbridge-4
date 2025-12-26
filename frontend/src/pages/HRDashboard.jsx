import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import BenchAllocation from '../components/BenchAllocation';
import ProjectManagement from '../components/ProjectManagement';
import SkillCatalog from '../components/SkillCatalog';
import AllocationApprovals from '../components/AllocationApprovals';


const HRDashboard = () => {
    const { user, role } = useAuth();
    const [activeSection, setActiveSection] = useState('overview');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
                    title="Employee Management"
                    value={employees.length + managers.length + hrs.length}
                    icon="bi-people-fill"
                    color="#0d6efd"
                    onClick={() => { setActiveSection('people'); setPeopleTab('EMPLOYEES'); }}
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
            <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '5px solid #0d6efd' }}>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <h4 className="card-title fw-bold m-0" style={{ color: '#0d6efd' }}>
                            <i className="bi bi-people-fill me-2"></i>{title}
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
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => { fetchEmployees(); fetchManagers(); fetchHRs(); }}>
                                <i className="bi bi-arrow-clockwise"></i>
                            </button>
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
                                    <th>Role</th>
                                    {peopleTab === 'EMPLOYEES' && <th>Manager Name</th>}
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentList.length > 0 ? (
                                    currentList.map(user => (
                                        <tr key={user.id}>
                                            <td className="fw-bold">{user.firstName} {user.lastName}</td>
                                            <td>{user.email}</td>
                                            <td><span className="badge bg-secondary">{user.role}</span></td>
                                            {peopleTab === 'EMPLOYEES' && <td><small className="text-muted">{user.managerName || 'N/A'}</small></td>}
                                            <td><span className="badge bg-success">Active</span></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">No users found.</td>
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
        <div className="container-fluid p-0 overflow-hidden" style={{ height: 'calc(100vh - 65px)', backgroundColor: 'var(--color-bg)' }}>
            <div className="row g-0 h-100">
                {/* Sidebar */}
                <div className={`col-auto sidebar transition-width ${isSidebarCollapsed ? 'sidebar-collapsed' : 'col-md-3 col-lg-2'}`} style={{ backgroundColor: '#fff', borderRight: '1px solid #dee2e6', overflowY: 'auto' }}>
                    <div className="d-flex flex-column px-2 px-md-3 pt-4 h-100">
                        <div className="sidebar-header d-flex align-items-center justify-content-between mb-4 px-2">
                            {!isSidebarCollapsed && <h4 className="sidebar-title m-0 fw-bold text-primary">HR Portal</h4>}
                            <button
                                className={`btn btn-sm ${isSidebarCollapsed ? 'btn-primary w-100' : 'btn-outline-primary border-0 ms-auto'} transition-all`}
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                title={isSidebarCollapsed ? "Expand" : "Collapse"}
                                style={{ width: isSidebarCollapsed ? 'auto' : '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <i className={`bi ${isSidebarCollapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'} fs-6`}></i>
                            </button>
                        </div>
                        <ul className="nav flex-column w-100 gap-2">
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('overview')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'overview' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "Overview" : ""}
                                >
                                    <i className="bi bi-speedometer2 icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">Overview</span>}
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('people')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'people' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "People" : ""}
                                >
                                    <i className="bi bi-people-fill icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">People</span>}
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('projects')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'projects' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "Projects" : ""}
                                >
                                    <i className="bi bi-folder icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">Projects</span>}
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('approvals')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'approvals' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "Approvals" : ""}
                                >
                                    <i className="bi bi-check-circle icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">Approvals</span>}
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('bench')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'bench' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "Bench & Alloc" : ""}
                                >
                                    <i className="bi bi-people icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">Bench & Alloc</span>}
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('catalog')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'catalog' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "Skills" : ""}
                                >
                                    <i className="bi bi-list-check icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">Skills</span>}
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('talent')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'talent' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "Talent" : ""}
                                >
                                    <i className="bi bi-search icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">Talent</span>}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Main Content */}
                <div className="col h-100" style={{ padding: 0, overflowY: 'auto', scrollbarGutter: 'stable' }}>
                    <header className="page-header px-5 pt-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h1 className="page-title text-dark">
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
                    </header>

                    <div className="px-5 pb-5 fade-in">
                        {activeSection === 'overview' && renderOverview()}
                        {activeSection === 'people' && renderPeopleManagement()}
                        {activeSection === 'projects' && <ProjectManagement />}
                        {activeSection === 'approvals' && <AllocationApprovals />}
                        {activeSection === 'bench' && <BenchAllocation />}
                        {activeSection === 'catalog' && <SkillCatalog />}
                        {activeSection === 'talent' && renderTalentDiscovery()}

                    </div>
                </div>
                <style>{`
                    .nav-link {
                        transition: all 0.2s ease;
                        border-radius: 8px !important;
                        font-weight: 500;
                        height: 48px;
                    }
                    .sidebar.transition-width {
                        transition: width 0.3s ease, flex-basis 0.3s ease;
                    }
                    .sidebar-collapsed {
                        width: 70px !important;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default HRDashboard;
