import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import BenchAllocation from '../components/BenchAllocation';
import ProjectManagement from '../components/ProjectManagement';
import SkillCatalog from '../components/SkillCatalog';

const HRDashboard = () => {
    const { user, role } = useAuth();
    const [activeSection, setActiveSection] = useState('onboarding');

    // -- State Management for User Onboarding --
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'EMPLOYEE',
        managerId: ''
    });
    const [managers, setManagers] = useState([]);
    const [onboardingLoading, setOnboardingLoading] = useState(false);
    const [onboardingSuccess, setOnboardingSuccess] = useState(null);
    const [onboardingError, setOnboardingError] = useState(null);

    const [searchSkills, setSearchSkills] = useState([]); // Changed from searchSkill string
    const [catalogSkills, setCatalogSkills] = useState([]);
    const [talentResults, setTalentResults] = useState(null);
    const [talentLoading, setTalentLoading] = useState(false);
    const [talentError, setTalentError] = useState(null);

    // -- Effects --
    useEffect(() => {
        if (role === 'HR') {
            fetchManagers();
            fetchCatalog();
        }
    }, [role]);

    const fetchCatalog = async () => {
        try {
            const response = await api.get('/catalog/skills');
            setCatalogSkills(response.data);
        } catch (err) {
            console.error('Failed to load skill catalog', err);
        }
    };

    // -- API Calls --
    const fetchManagers = async () => {
        try {
            const response = await api.get('/users/managers');
            setManagers(response.data);
        } catch (err) {
            console.error('Failed to fetch managers:', err);
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
            setOnboardingSuccess(`User ${formData.email} created successfully!`);
            setFormData({
                email: '',
                password: '',
                role: 'EMPLOYEE',
                managerId: ''
            });
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
                    <div className="mb-3">
                        <label className="form-label fw-bold">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            placeholder="user@skillbridge.com"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            style={{ border: '2px solid #9CC6DB' }}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Initial Password</label>
                        <input
                            type="password"
                            name="password"
                            className="form-control"
                            placeholder="••••••••"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
                            style={{ border: '2px solid #9CC6DB' }}
                        />
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold">Role</label>
                            <select
                                name="role"
                                className="form-select"
                                value={formData.role}
                                onChange={handleInputChange}
                                style={{ border: '2px solid #9CC6DB' }}
                            >
                                <option value="EMPLOYEE">EMPLOYEE</option>
                                <option value="MANAGER">MANAGER</option>
                                <option value="HR">HR</option>
                            </select>
                        </div>

                        {formData.role === 'EMPLOYEE' && (
                            <div className="col-md-6 mb-3">
                                <label className="form-label fw-bold">Assign Manager</label>
                                <select
                                    name="managerId"
                                    className="form-select"
                                    required
                                    value={formData.managerId}
                                    onChange={handleInputChange}
                                    style={{ border: '2px solid #9CC6DB' }}
                                >
                                    <option value="">Select a Manager...</option>
                                    {managers.map(mgr => (
                                        <option key={mgr.id} value={mgr.id}>
                                            {mgr.email}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="mt-4">
                        <button
                            type="submit"
                            className="btn btn-lg w-100 text-white fw-bold"
                            style={{ backgroundColor: '#CF4B00' }}
                            disabled={onboardingLoading}
                        >
                            {onboardingLoading ? 'Onboarding...' : 'Onboard User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderTalentDiscovery = () => (
        <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '5px solid #9CC6DB' }}>
            <div className="card-body p-4">
                <h3 className="card-title fw-bold mb-4" style={{ color: '#CF4B00' }}>
                    <i className="bi bi-search me-2"></i>Talent Discovery
                </h3>

                <form onSubmit={handleTalentSearch} className="mb-4">
                    <label className="form-label fw-bold">Search by Skills</label>
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
                    <div className="input-group">
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
                            <option value="">+ Add Skill to Search</option>
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
                            <i className="bi bi-search me-2"></i>Search Talent
                        </button>
                    </div>
                </form>

                {talentLoading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-info" role="status"></div>
                    </div>
                ) : talentResults && talentResults.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-sm table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>Name</th>
                                    <th>Skill</th>
                                    <th>Level</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {talentResults.map((res, idx) => (
                                    <tr key={idx}>
                                        <td>{res.employeeName}</td>
                                        <td>{res.skillName}</td>
                                        <td>
                                            <span className={`badge ${res.proficiencyLevel === 'ADVANCED' ? 'bg-success' :
                                                    res.proficiencyLevel === 'INTERMEDIATE' ? 'bg-info text-dark' : 'bg-secondary'
                                                }`}>
                                                {res.proficiencyLevel}
                                            </span>
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
                    talentResults !== null && <p className="text-muted text-center">No results found.</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="container-fluid" style={{ fontFamily: 'Pompiere, cursive', backgroundColor: '#FCF6D9', minHeight: '100vh', padding: 0 }}>
            <div className="row g-0">
                {/* Sidebar */}
                <div className="col-md-3 col-lg-2 d-md-block shadow-sm" style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
                    <div className="p-4">
                        <h4 className="fw-bold mb-4" style={{ color: '#CF4B00' }}>HR Portal</h4>
                        <div className="list-group list-group-flush">
                            <button
                                onClick={() => setActiveSection('onboarding')}
                                className={`list-group-item list-group-item-action border-0 py-3 ${activeSection === 'onboarding' ? 'active' : ''}`}
                                style={activeSection === 'onboarding' ? { backgroundColor: '#9CC6DB', color: '#fff' } : {}}
                            >
                                <i className="bi bi-person-plus me-2"></i> User Onboarding
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
                <div className="col-md-9 col-lg-10 p-5">
                    <header className="mb-5">
                        <h1 className="display-5 fw-bold" style={{ color: '#CF4B00' }}>
                            {activeSection === 'onboarding' && 'User Onboarding'}
                            {activeSection === 'projects' && 'Project Management'}
                            {activeSection === 'bench' && 'Bench Management & Allocation'}
                            {activeSection === 'catalog' && 'Skill Catalog'}
                            {activeSection === 'talent' && 'Talent Discovery'}
                        </h1>
                        <p className="lead text-muted">Manage your organization's workforce and projects from one place.</p>
                    </header>

                    <div className="fade-in">
                        {activeSection === 'onboarding' && renderOnboarding()}
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
