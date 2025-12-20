import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const HRDashboard = () => {
    const { user, role } = useAuth();

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

        // Client-side validation for Employee role
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

    return (
        <div className="container py-5" style={{ fontFamily: 'Pompiere, cursive', backgroundColor: '#FCF6D9', minHeight: '100vh' }}>
            <header className="mb-5 border-bottom pb-3" style={{ borderColor: '#9CC6DB' }}>
                <h1 className="display-4 fw-bold" style={{ color: '#CF4B00' }}>User Administration</h1>
                <p className="lead text-muted">
                    Welcome, {user?.sub || 'HR Administrator'}. Manage organization onboarding and talent.
                </p>
            </header>

            <div className="row g-5">
                {/* Section 1: Add New User */}
                <div className="col-lg-7">
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
                                        {onboardingLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Creating User...
                                            </>
                                        ) : (
                                            'Onboard User'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Section 2: Talent Discovery */}
                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '5px solid #DDBA7D' }}>
                        <div className="card-body p-4">
                            <h3 className="card-title fw-bold mb-4" style={{ color: '#DDBA7D' }}>
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
                                        style={{ border: '2px solid #DDBA7D' }}
                                    />
                                    <button
                                        type="submit"
                                        className="btn text-white"
                                        style={{ backgroundColor: '#DDBA7D' }}
                                        disabled={talentLoading || !searchSkill.trim()}
                                    >
                                        Search
                                    </button>
                                </div>
                            </form>

                            {talentLoading && (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-warning" role="status"></div>
                                </div>
                            )}

                            {talentError && (
                                <div className="alert alert-danger p-2 small">{talentError}</div>
                            )}

                            {talentResults && talentResults.length > 0 ? (
                                <div className="table-responsive" style={{ maxHeight: '300px' }}>
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
                                talentResults !== null && !talentLoading && <p className="text-muted text-center">No results found.</p>
                            )}

                            {talentResults === null && !talentLoading && (
                                <p className="text-muted text-center py-4">Search for employees by their skills to view talent availability.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
