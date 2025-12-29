import React, { useState, useEffect } from 'react';
import { usersApi } from '../../../api/users';

const PeopleManagement = ({ setActiveSection }) => { // Accept setActiveSection if needed, or handle navigation internally
    const [employees, setEmployees] = useState([]);
    const [managers, setManagers] = useState([]);
    const [hrs, setHrs] = useState([]);
    const [peopleTab, setPeopleTab] = useState('EMPLOYEES'); // 'EMPLOYEES', 'MANAGERS', 'HRS'
    const [loading, setLoading] = useState(false);

    // Onboarding State
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'EMPLOYEE',
        managerId: ''
    });
    const [onboardingLoading, setOnboardingLoading] = useState(false);
    const [onboardingSuccess, setOnboardingSuccess] = useState(null);
    const [onboardingError, setOnboardingError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchEmployees(),
                fetchManagers(),
                fetchHRs()
            ]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchManagers = async () => {
        try {
            const response = await usersApi.getManagers();
            setManagers(response.data);
        } catch (err) {
            console.error('Failed to fetch managers:', err);
        }
    };

    const fetchHRs = async () => {
        try {
            const response = await usersApi.getHRs();
            setHrs(response.data);
        } catch (err) {
            console.error('Failed to fetch HRs:', err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await usersApi.getEmployees();
            setEmployees(response.data);
        } catch (err) {
            console.error('Failed to fetch employees:', err);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            await usersApi.createUser({
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
            fetchEmployees();
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
                            <button className="btn btn-outline-secondary btn-sm" onClick={() => { fetchEmployees(); fetchManagers(); fetchHRs(); }} aria-label="Refresh Directory">
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
        <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '5px solid var(--color-primary)' }}>
            <div className="card-body p-4">
                <h3 className="card-title fw-bold mb-4 text-dark">
                    <i className="bi bi-person-plus-fill me-2 text-primary"></i>Add New User
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
                        <input
                            type="password"
                            name="password"
                            className="form-control form-control-sm"
                            placeholder="••••••••"
                            required
                            value={formData.password}
                            onChange={handleInputChange}
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

    return (
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
};

export default PeopleManagement;
