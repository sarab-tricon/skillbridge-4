import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import BenchAllocation from '../components/BenchAllocation';
import ProjectManagement from '../components/ProjectManagement';
import SkillCatalog from '../components/SkillCatalog';
import AllocationApprovals from '../components/AllocationApprovals';
import Sidebar from '../components/Sidebar';
import { allocationsApi } from '../api/allocations';


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

    // State
    const [stats, setStats] = useState({
        benchCount: 0,
        activeRequests: 0
    });
    const [employees, setEmployees] = useState([]);


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


    // Edit/Delete State
    const [isEditing, setIsEditing] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        managerId: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [deletingUser, setDeletingUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);
    const [errors, setErrors] = useState({});

    const [peopleTab, setPeopleTab] = useState('EMPLOYEES'); // 'EMPLOYEES', 'MANAGERS', 'HRS'

    // Effects
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
            fetchCatalog(),
            fetchPendingRequestsCount()
        ]);
    };

    const fetchPendingRequestsCount = async () => {
        try {
            const response = await allocationsApi.getPendingRequests();
            setStats(prev => ({ ...prev, activeRequests: response.data.length }));
        } catch (err) {
            console.error('Failed to fetch pending requests count:', err);
        }
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
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        }
    };

    const fetchBenchUsers = async () => {
        try {
            const response = await api.get('/users/bench');
            // setBenchUsers(response.data);
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

    const validateOnboardingForm = () => {
        const newErrors = {};
        if (!formData.firstName.trim()) newErrors.onboardingFirstName = 'First Name is required';
        if (!formData.lastName.trim()) newErrors.onboardingLastName = 'Last Name is required';
        if (!formData.email.trim()) newErrors.onboardingEmail = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.onboardingEmail = 'Invalid email format';
        if (!formData.password) newErrors.onboardingPassword = 'Password is required';

        if (formData.role === 'EMPLOYEE' && !formData.managerId) {
            newErrors.onboardingManagerId = 'Please select a manager';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOnboardingSubmit = async (e) => {
        e.preventDefault();

        if (!validateOnboardingForm()) return;

        setOnboardingLoading(true);
        setOnboardingSuccess(null);
        setOnboardingError(null);

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

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            managerId: user.managerId || ''
        });
        setIsEditing(true);
        setActionError(null);
        setActionSuccess(null);
    };

    const validateEditForm = () => {
        const newErrors = {};
        if (!editFormData.firstName.trim()) newErrors.firstName = 'First Name is required';
        if (!editFormData.lastName.trim()) newErrors.lastName = 'Last Name is required';
        if (!editFormData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(editFormData.email)) newErrors.email = 'Invalid email format';

        if (editFormData.role === 'EMPLOYEE' && !editFormData.managerId) {
            newErrors.managerId = 'Please select a manager for the employee';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();

        if (!validateEditForm()) return;

        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            await api.put(`/users/${editingUser.id}`, editFormData);
            setActionSuccess('User updated successfully!');
            fetchInitialData(); // Refresh all lists
            setTimeout(() => setIsEditing(false), 1500);
        } catch (err) {
            console.error('Failed to update user:', err);
            setActionError(err.response?.data?.message || 'Failed to update user.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteClick = (user) => {
        setDeletingUser(user);
        setIsDeleting(true);
        setActionError(null);
        setActionSuccess(null);
    };

    const confirmDelete = async () => {
        setActionLoading(true);
        setActionError(null);
        setActionSuccess(null);

        try {
            await api.delete(`/users/${deletingUser.id}`);
            setActionSuccess('User deleted successfully!');
            fetchInitialData(); // Refresh all lists
            setTimeout(() => setIsDeleting(false), 1500);
        } catch (err) {
            console.error('Failed to delete user:', err);
            setActionError(err.response?.data?.message || 'Failed to delete user.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleTalentSearch = async (e) => {
        e.preventDefault();
        if (searchSkills.length === 0) return;

        setTalentLoading(true);
        setTalentResults([]);

        try {
            const skillsQuery = searchSkills.map(s => `skills=${encodeURIComponent(s)}`).join('&');
            const response = await api.get(`/skills/search?${skillsQuery}`);
            setTalentResults(response.data);
        } catch (err) {
            console.error('Failed to search talent:', err);
            // setTalentError('Error occurred while searching for talent.');
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
                style={{ borderLeft: `5px solid var(--color-primary)` }}
            >
                <div className="card-body d-flex flex-column">
                    <div className="d-flex align-items-center justify-content-between mb-3" onClick={onClick} style={{ cursor: 'pointer' }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }} aria-label={`View details for ${title}`}>
                        <div>
                            <span className="text-muted text-uppercase mb-2 d-block" style={{ fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '700' }}>{title}</span>
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
            <div className="row g-4 mb-4">
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
                <StatCard
                    title="Approvals"
                    value={stats.activeRequests}
                    icon="bi-check-circle"
                    onClick={() => setActiveSection('approvals')}
                />
            </div>
            <div className="row g-4">
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

        const currentList = getList().filter(u => u.id !== user.userId);
        const title = peopleTab === 'MANAGERS' ? 'Managers' : peopleTab === 'HRS' ? 'HR Administrators' : 'Employee Directory';

        return (
            <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '5px solid var(--color-primary)' }}>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <h2 className="card-title fw-bold m-0 text-dark">
                            <i className="bi bi-people-fill me-2 text-primary"></i>{title || 'Directory'}
                        </h2>
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
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentList.length > 0 ? (
                                    currentList.map(listUser => (
                                        <tr key={listUser.id}>
                                            <td className="fw-bold">{listUser.firstName} {listUser.lastName}</td>
                                            <td>{listUser.email}</td>
                                            {peopleTab === 'EMPLOYEES' && <td><small className="text-muted">{listUser.managerName || 'N/A'}</small></td>}
                                            <td className="text-end">
                                                {listUser.id !== user.userId && (
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleEditClick(listUser)}
                                                            title="Edit User"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDeleteClick(listUser)}
                                                            title="Delete User"
                                                            style={{ color: '#b02a37', borderColor: '#b02a37' }}
                                                            aria-label={`Delete ${listUser.firstName} ${listUser.lastName}`}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={peopleTab === 'EMPLOYEES' ? '4' : '3'} className="text-center py-4 text-muted">No users found.</td>
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
                <h2 className="card-title fw-bold mb-4 text-dark">
                    <i className="bi bi-person-plus-fill me-2 text-primary"></i>New User
                </h2>

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
                            <label htmlFor="firstName" className="form-label fw-bold small">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                autoComplete="given-name"
                                className={`form-control form-control-sm ${errors.onboardingFirstName ? 'is-invalid' : ''}`}
                                placeholder="John"
                                value={formData.firstName}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    if (errors.onboardingFirstName) setErrors({ ...errors, onboardingFirstName: null });
                                }}
                            />
                            {errors.onboardingFirstName && <div className="invalid-feedback">{errors.onboardingFirstName}</div>}
                        </div>
                        <div className="col-md-6 mb-2">
                            <label htmlFor="lastName" className="form-label fw-bold small">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                autoComplete="family-name"
                                className={`form-control form-control-sm ${errors.onboardingLastName ? 'is-invalid' : ''}`}
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    if (errors.onboardingLastName) setErrors({ ...errors, onboardingLastName: null });
                                }}
                            />
                            {errors.onboardingLastName && <div className="invalid-feedback">{errors.onboardingLastName}</div>}
                        </div>
                    </div>

                    <div className="mb-2">
                        <label htmlFor="email" className="form-label fw-bold small">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            autoComplete="email"
                            className={`form-control form-control-sm ${errors.onboardingEmail ? 'is-invalid' : ''}`}
                            placeholder="user@skillbridge.com"
                            value={formData.email}
                            onChange={(e) => {
                                handleInputChange(e);
                                if (errors.onboardingEmail) setErrors({ ...errors, onboardingEmail: null });
                            }}
                        />
                        {errors.onboardingEmail && <div className="invalid-feedback">{errors.onboardingEmail}</div>}
                    </div>

                    <div className="mb-2">
                        <label htmlFor="password" className="form-label fw-bold small">Initial Password</label>
                        <div className="position-relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                autoComplete="new-password"
                                className={`form-control form-control-sm ${errors.onboardingPassword ? 'is-invalid' : ''}`}
                                style={{ paddingRight: '30px' }}
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => {
                                    handleInputChange(e);
                                    if (errors.onboardingPassword) setErrors({ ...errors, onboardingPassword: null });
                                }}
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
                            {errors.onboardingPassword && <div className="invalid-feedback d-block">{errors.onboardingPassword}</div>}
                        </div>
                    </div>

                    <div className="row g-2">
                        <div className={formData.role === 'EMPLOYEE' ? "col-md-6 mb-2" : "col-12 mb-2"}>
                            <label htmlFor="role" className="form-label fw-bold small">Role</label>
                            <select
                                id="role"
                                name="role"
                                autoComplete="organization-title"
                                className="form-select form-select-sm"
                                style={{ backgroundColor: '#fff', color: '#212529', backgroundImage: 'none', appearance: 'auto', WebkitAppearance: 'revert' }}
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
                                <label htmlFor="managerId" className="form-label fw-bold small">Manager</label>
                                <select
                                    id="managerId"
                                    name="managerId"
                                    autoComplete="off"
                                    className={`form-select form-select-sm ${errors.onboardingManagerId ? 'is-invalid' : ''}`}
                                    style={{ backgroundColor: '#fff', color: '#212529', backgroundImage: 'none', appearance: 'auto', WebkitAppearance: 'revert' }}
                                    value={formData.managerId}
                                    onChange={(e) => {
                                        handleInputChange(e);
                                        if (errors.onboardingManagerId) setErrors({ ...errors, onboardingManagerId: null });
                                    }}
                                >
                                    <option value="">Choose...</option>
                                    {managers.map(mgr => (
                                        <option key={mgr.id} value={mgr.id}>
                                            {mgr.firstName} {mgr.lastName}
                                        </option>
                                    ))}
                                </select>
                                {errors.onboardingManagerId && <div className="invalid-feedback">{errors.onboardingManagerId}</div>}
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
                    <h2 className="card-title fw-bold m-0 text-dark h4">
                        <i className="bi bi-search me-2 text-primary"></i>Talent Discovery
                    </h2>
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
                            aria-label="Add skill to search"
                            autoComplete="off"
                            style={{ backgroundColor: '#fff', backgroundImage: 'none', appearance: 'auto' }}
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

    const renderEditModal = () => (
        <div className={`modal fade ${isEditing ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title fw-bold">Edit User Details</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setIsEditing(false)} aria-label="Close"></button>
                    </div>
                    <form onSubmit={handleEditSubmit}>
                        <div className="modal-body p-4">
                            {actionError && <div className="alert alert-danger small py-2">{actionError}</div>}
                            {actionSuccess && <div className="alert alert-success small py-2">{actionSuccess}</div>}

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label htmlFor="editFirstName" className="form-label small fw-bold">First Name</label>
                                    <input
                                        type="text"
                                        id="editFirstName"
                                        autoComplete="given-name"
                                        className={`form-control form-control-sm ${errors.firstName ? 'is-invalid' : ''}`}
                                        value={editFormData.firstName}
                                        onChange={(e) => {
                                            setEditFormData({ ...editFormData, firstName: e.target.value });
                                            if (errors.firstName) setErrors({ ...errors, firstName: null });
                                        }}
                                    />
                                    {errors.firstName && <div className="invalid-feedback">{errors.firstName}</div>}
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="editLastName" className="form-label small fw-bold">Last Name</label>
                                    <input
                                        type="text"
                                        id="editLastName"
                                        autoComplete="family-name"
                                        className={`form-control form-control-sm ${errors.lastName ? 'is-invalid' : ''}`}
                                        value={editFormData.lastName}
                                        onChange={(e) => {
                                            setEditFormData({ ...editFormData, lastName: e.target.value });
                                            if (errors.lastName) setErrors({ ...errors, lastName: null });
                                        }}
                                    />
                                    {errors.lastName && <div className="invalid-feedback">{errors.lastName}</div>}
                                </div>
                                <div className="col-12">
                                    <label htmlFor="editEmail" className="form-label small fw-bold">Email Address</label>
                                    <input
                                        type="email"
                                        id="editEmail"
                                        autoComplete="email"
                                        className={`form-control form-control-sm ${errors.email ? 'is-invalid' : ''}`}
                                        value={editFormData.email}
                                        onChange={(e) => {
                                            setEditFormData({ ...editFormData, email: e.target.value });
                                            if (errors.email) setErrors({ ...errors, email: null });
                                        }}
                                    />
                                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="editRole" className="form-label small fw-bold">Role</label>
                                    <select
                                        id="editRole"
                                        autoComplete="organization-title"
                                        className="form-select form-select-sm"
                                        style={{ backgroundColor: '#fff', color: '#212529', backgroundImage: 'none', appearance: 'auto', WebkitAppearance: 'revert' }}
                                        value={editFormData.role}
                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                        required
                                    >
                                        <option value="EMPLOYEE">EMPLOYEE</option>
                                        <option value="MANAGER">MANAGER</option>
                                        <option value="HR">HR</option>
                                    </select>
                                </div>
                                {editFormData.role === 'EMPLOYEE' && (
                                    <div className="col-md-6">
                                        <label htmlFor="editManagerId" className="form-label small fw-bold">Manager</label>
                                        <select
                                            id="editManagerId"
                                            autoComplete="off"
                                            className={`form-select form-select-sm ${errors.managerId ? 'is-invalid' : ''}`}
                                            style={{ backgroundColor: '#fff', color: '#212529', backgroundImage: 'none', appearance: 'auto', WebkitAppearance: 'revert' }}
                                            value={editFormData.managerId}
                                            onChange={(e) => {
                                                setEditFormData({ ...editFormData, managerId: e.target.value });
                                                if (errors.managerId) setErrors({ ...errors, managerId: null });
                                            }}
                                        >
                                            <option value="">Select Manager...</option>
                                            {managers.map(mgr => (
                                                <option key={mgr.id} value={mgr.id}>{mgr.firstName} {mgr.lastName}</option>
                                            ))}
                                        </select>
                                        {errors.managerId && <div className="invalid-feedback">{errors.managerId}</div>}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer border-0 p-4 pt-0">
                            <button type="button" className="btn btn-sm btn-light px-4" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button type="submit" className="btn btn-sm btn-primary px-4" disabled={actionLoading}>
                                {actionLoading ? 'Updating...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    const renderDeleteModal = () => (
        <div className={`modal fade ${isDeleting ? 'show d-block' : ''}`} tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered border-0">
                <div className="modal-content border-0 shadow">
                    <div className="modal-header border-0 pb-0">
                        <button type="button" className="btn-close" onClick={() => setIsDeleting(false)} aria-label="Close"></button>
                    </div>
                    <div className="modal-body p-4 text-center">
                        <i className="bi bi-exclamation-triangle-fill text-danger fs-1 mb-3 d-block"></i>
                        <h4 className="fw-bold mb-2">Delete User?</h4>
                        <p className="text-muted small px-3">
                            Are you sure you want to delete <strong>{deletingUser?.firstName} {deletingUser?.lastName}</strong>?
                            This action cannot be undone and will remove all related skills and assignments.
                        </p>

                        {actionError && <div className="alert alert-danger small py-2 mt-3">{actionError}</div>}
                        {actionSuccess && <div className="alert alert-success small py-2 mt-3">{actionSuccess}</div>}
                    </div>
                    {!actionSuccess && (
                        <div className="modal-footer border-0 p-4 pt-0 justify-content-center">
                            <button type="button" className="btn btn-sm btn-light px-4" onClick={() => setIsDeleting(false)}>Cancel</button>
                            <button type="button" className="btn btn-sm btn-danger px-4" onClick={confirmDelete} disabled={actionLoading}>
                                {actionLoading ? 'Deleting...' : 'Confirm Deletion'}
                            </button>
                        </div>
                    )}
                </div>
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
                    <main role="main" id="main-content" aria-label="HR Dashboard Content" className="col h-100" style={{ overflowY: 'auto', scrollbarGutter: 'stable' }} tabIndex="0">
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

            {isEditing && renderEditModal()}
            {isDeleting && renderDeleteModal()}

            <style>{`
                .static-btn:hover, .static-btn:active, .static-btn:focus {
                    transform: none !important;
                    transition: none !important;
                }
                #main-content::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </>
    );
};

export default HRDashboard;
