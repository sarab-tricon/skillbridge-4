import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import BenchAllocation from '../components/BenchAllocation';
import ProjectManagement from '../components/ProjectManagement';

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

    const [searchSkill, setSearchSkill] = useState('');
    const [talentResults, setTalentResults] = useState(null);
    const [talentLoading, setTalentLoading] = useState(false);
    const [talentError, setTalentError] = useState(null);

    // -- Effects --
    useEffect(() => {
        if (role === 'HR') {
            fetchManagers();
        }
    }, [role]);

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
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search skill (e.g. Java)..."
                            value={searchSkill}
                            onChange={(e) => setSearchSkill(e.target.value)}
                            style={{ border: '2px solid #9CC6DB' }}
                        />
                        <button
                            type="submit"
                            className="btn text-white"
                            style={{ backgroundColor: '#CF4B00' }}
                            disabled={talentLoading || !searchSkill.trim()}
                        >
                            Search
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
                                </tr>
                            </thead>
                            <tbody>
                                {talentResults.map((res, idx) => (
                                    <tr key={idx}>
                                        <td>{res.employeeName}</td>
                                        <td>{res.skillName}</td>
                                        <td>{res.proficiencyLevel}</td>
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
                            {activeSection === 'talent' && 'Talent Discovery'}
                        </h1>
                        <p className="lead text-muted">Manage your organization's workforce and projects from one place.</p>
                    </header>

                    <div className="fade-in">
                        {activeSection === 'onboarding' && renderOnboarding()}
                        {activeSection === 'projects' && <ProjectManagement />}
                        {activeSection === 'bench' && <BenchAllocation />}
                        {activeSection === 'talent' && renderTalentDiscovery()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
