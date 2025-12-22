import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';


const ManagerDashboard = () => {
    const { user } = useAuth();
    const [mergedTeam, setMergedTeam] = useState([]);
    const [pendingSkills, setPendingSkills] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const [loading, setLoading] = useState({
        data: true,
        skills: true
    });
    const [error, setError] = useState({
        data: null,
        skills: null
    });
    const [pendingAllocations, setPendingAllocations] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(prev => ({ ...prev, data: true }));
            const [teamRes, utilRes, pendingAllocRes] = await Promise.all([
                api.get('/users/team'),
                api.get('/utilization/team'),
                api.get('/allocation-requests/pending')
            ]);

            const merged = teamRes.data.map(member => {
                const util = utilRes.data.find(u => u.employeeId === member.id) || {};
                return {
                    ...member,
                    allocationStatus: util.allocationStatus || 'BENCH',
                    projectName: util.projectName || null,
                    status: util.projectName ? 'ACTIVE' : 'BENCH',
                    assignmentId: util.assignmentId || null
                };
            });

            setMergedTeam(merged);
            setPendingAllocations(pendingAllocRes.data.map(req => ({
                ...req,
                id: req.id || req.assignmentId
            })));
            setError(prev => ({ ...prev, data: null }));
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(prev => ({ ...prev, data: 'Failed to load team data.' }));
        } finally {
            setLoading(prev => ({ ...prev, data: false }));
        }
    };

    const fetchPendingSkills = async () => {
        try {
            setLoading(prev => ({ ...prev, skills: true }));
            const response = await api.get('/skills/pending');
            setPendingSkills(response.data);
            setError(prev => ({ ...prev, skills: null }));
        } catch (err) {
            console.error('Error fetching pending skills:', err);
            setError(prev => ({ ...prev, skills: 'Failed to load pending skills.' }));
        } finally {
            setLoading(prev => ({ ...prev, skills: false }));
        }
    };

    useEffect(() => {
        fetchData();
        fetchPendingSkills();
    }, []);

    const handleSkillAction = async (skillId, status) => {
        setActionLoading(true);
        try {
            await api.put(`/skills/${skillId}/verify`, { status });
            fetchPendingSkills();
        } catch (err) {
            console.error(`Error ${status}ing skill:`, err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAllocationAction = async (requestId, status, billingType = 'BILLABLE') => {
        setActionLoading(true);
        try {
            if (status === 'APPROVED') {
                await api.put(`/allocation-requests/${requestId}/approve`, { billingType });
            } else {
                await api.put(`/allocation-requests/${requestId}/reject`);
            }
            fetchData();
        } catch (err) {
            console.error(`Error ${status}ing allocation:`, err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEndAllocation = async (assignmentId) => {
        if (!window.confirm('Are you sure you want to end this project allocation?')) return;
        setActionLoading(true);
        try {
            await api.put(`/assignments/${assignmentId}/end`);
            fetchData();
        } catch (err) {
            console.error('Error ending allocation:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const renderLoading = () => (
        <div className="text-center py-4">
            <div className="spinner-border" style={{ color: '#9CC6DB' }} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    const renderError = (message) => (
        <div className="alert alert-danger" role="alert">
            {message}
        </div>
    );

    const renderEmpty = (message) => (
        <div className="text-center py-5 text-muted border rounded bg-white shadow-sm">
            <p className="mb-0 fs-4">{message}</p>
        </div>
    );

    const SectionCard = ({ title, count, sectionId, color }) => (
        <div
            className={`card h-100 shadow-sm border-0 cursor-pointer transition-all ${activeSection === sectionId ? 'ring-2' : ''}`}
            onClick={() => setActiveSection(activeSection === sectionId ? null : sectionId)}
            style={{
                backgroundColor: 'white',
                borderTop: `6px solid ${color}`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: activeSection === sectionId ? 'translateY(-5px)' : 'none',
                boxShadow: activeSection === sectionId ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
            }}
        >
            <div className="card-body p-4 text-center">
                <h6 className="text-muted text-uppercase mb-3 fw-bold" style={{ letterSpacing: '1.5px' }}>{title}</h6>
                <h2 className="display-4 fw-bold mb-0" style={{ color: '#CF4B00' }}>{count}</h2>
                <div className="mt-3">
                    <button className="btn btn-sm px-4 rounded-pill" style={{ backgroundColor: color, color: 'white' }}>
                        {activeSection === sectionId ? 'Hide Details' : 'View Details'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container-fluid p-0" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Pompiere, cursive' }}>
            <div className="row g-0">
                {/* SIDEBAR */}
                <div className="col-auto col-md-3 col-lg-2 px-sm-2 px-0 bg-white shadow-sm" style={{ borderRight: '1px solid #eee' }}>
                    <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-4 min-vh-100 sticky-top" style={{ top: '0' }}>
                        <div className="mb-4 d-none d-sm-block">
                            <h4 className="fw-bold" style={{ color: '#CF4B00' }}>Manager Hub</h4>
                        </div>
                        <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start w-100" id="menu">
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection(null)}
                                    className={`nav-link align-middle px-3 py-2 w-100 text-start d-flex align-items-center gap-2 ${activeSection === null ? 'active' : 'text-dark'}`}
                                    style={activeSection === null ? { backgroundColor: '#CF4B00', color: '#fff' } : {}}
                                >
                                    <i className="bi bi-speedometer2"></i>
                                    <span className="ms-1 d-none d-sm-inline">Dashboard</span>
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('team')}
                                    className={`nav-link align-middle px-3 py-2 w-100 text-start d-flex align-items-center gap-2 ${activeSection === 'team' ? 'active' : 'text-dark'}`}
                                    style={activeSection === 'team' ? { backgroundColor: '#CF4B00', color: '#fff' } : {}}
                                >
                                    <i className="bi bi-people"></i>
                                    <span className="ms-1 d-none d-sm-inline">My Team</span>
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('alloc_requests')}
                                    className={`nav-link align-middle px-3 py-2 w-100 text-start d-flex align-items-center gap-2 ${activeSection === 'alloc_requests' ? 'active' : 'text-dark'}`}
                                    style={activeSection === 'alloc_requests' ? { backgroundColor: '#CF4B00', color: '#fff' } : {}}
                                >
                                    <i className="bi bi-patch-check"></i>
                                    <span className="ms-1 d-none d-sm-inline">Allocations</span>
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('pending_skills')}
                                    className={`nav-link align-middle px-3 py-2 w-100 text-start d-flex align-items-center gap-2 ${activeSection === 'pending_skills' ? 'active' : 'text-dark'}`}
                                    style={activeSection === 'pending_skills' ? { backgroundColor: '#CF4B00', color: '#fff' } : {}}
                                >
                                    <i className="bi bi-star"></i>
                                    <span className="ms-1 d-none d-sm-inline">Verifications</span>
                                </button>
                            </li>

                        </ul>
                        <div className="sidebar-footer mt-auto pb-5 d-none d-sm-block border-top w-100 pt-3">
                            <p className="small text-muted mb-1">Manager Session</p>
                            <p className="small fw-bold text-dark text-truncate mb-0">{user?.sub}</p>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="col p-4 p-md-5">
                    <header className="mb-5 text-center">
                        <h1 className="display-4 fw-bold mb-0" style={{ color: '#CF4B00' }}>
                            {'Manager Control Panel'}
                        </h1>
                        <p className="lead text-muted">Welcome back, {user?.sub?.split('@')[0] || 'Manager'}</p>
                    </header>

                    <div className="animate-fade-in">
                        <>
                            {/* Summary Cards Grid */}
                            <div className="row g-4 mb-5">
                                <div className="col-md-3">
                                    <SectionCard
                                        title="Team Size"
                                        count={loading.data ? '...' : mergedTeam.length}
                                        sectionId="team"
                                        color="#9CC6DB"
                                    />
                                </div>
                                <div className="col-md-3">
                                    <SectionCard
                                        title="Allocations"
                                        count={loading.data ? '...' : pendingAllocations.length}
                                        sectionId="alloc_requests"
                                        color="#DDBA7D"
                                    />
                                </div>
                                <div className="col-md-3">
                                    <SectionCard
                                        title="Active Projects"
                                        count={loading.data ? '...' : mergedTeam.filter(m => m.projectName).length}
                                        sectionId="allocations"
                                        color="#9CC6DB"
                                    />
                                </div>
                                <div className="col-md-3">
                                    <SectionCard
                                        title="Verifications"
                                        count={loading.skills ? '...' : pendingSkills.length}
                                        sectionId="pending_skills"
                                        color="#CF4B00"
                                    />
                                </div>
                            </div>

                            {/* Active Section Content */}
                            <div>
                                {!activeSection && (
                                    <div className="row justify-content-center mt-5">
                                        <div className="col-md-8 text-center">
                                            <div className="p-5 border-2 border-dashed rounded-4 bg-white shadow-sm">
                                                <i className="bi bi-arrow-up-circle display-1 text-muted opacity-25 mb-4"></i>
                                                <h3 className="text-muted fw-bold">Select a metric above to view detailed insights</h3>
                                                <p className="text-muted">You can manage team allocations, verify skill requests, and track project deployments from this panel.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'team' && (
                                    <div className="card shadow border-0 rounded-4 overflow-hidden mb-5">
                                        <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                            <h3 className="fw-bold mb-0">Team Directory</h3>
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setActiveSection(null)}>Close</button>
                                        </div>
                                        <div className="card-body p-0">
                                            {loading.data ? renderLoading() :
                                                error.data ? renderError(error.data) :
                                                    mergedTeam.length === 0 ? renderEmpty('No team members found.') : (
                                                        <div className="table-responsive">
                                                            <table className="table table-hover align-middle mb-0">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th className="px-4 py-3">Employee</th>
                                                                        <th className="py-3">Current Assignment</th>
                                                                        <th className="px-4 py-3 text-end">Status</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {mergedTeam.map((member, idx) => (
                                                                        <tr key={idx}>
                                                                            <td className="px-4 py-3">
                                                                                <div className="fw-bold text-dark">{member.name || 'Anonymous'}</div>
                                                                                <div className="small text-muted">{member.email}</div>
                                                                            </td>
                                                                            <td>
                                                                                {member.projectName ? (
                                                                                    <span className="badge bg-info-subtle text-info border border-info rounded-pill px-3">
                                                                                        {member.projectName}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-muted italic small">On Bench</span>
                                                                                )}
                                                                            </td>
                                                                            <td className="px-4 text-end">
                                                                                <span className={`badge rounded-pill px-3 ${member.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                                                                                    {member.status}
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
                                )}

                                {activeSection === 'alloc_requests' && (
                                    <div className="card shadow border-0 rounded-4 overflow-hidden mb-5">
                                        <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                            <h3 className="fw-bold mb-0">Pending Allocation Requests</h3>
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setActiveSection(null)}>Close</button>
                                        </div>
                                        <div className="card-body p-0">
                                            {loading.data ? renderLoading() :
                                                error.data ? renderError(error.data) :
                                                    pendingAllocations.length === 0 ? renderEmpty('No pending allocation requests.') : (
                                                        <div className="table-responsive">
                                                            <table className="table table-hover align-middle mb-0">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th className="px-4 py-3">Employee</th>
                                                                        <th className="py-3">Requested Project</th>
                                                                        <th className="py-3">Billing Type</th>
                                                                        <th className="px-4 py-3 text-center">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {pendingAllocations.map((req) => (
                                                                        <tr key={req.id}>
                                                                            <td className="px-4 py-3">
                                                                                <div className="fw-bold">{req.employeeName}</div>
                                                                                <div className="small text-muted">{req.employeeEmail}</div>
                                                                            </td>
                                                                            <td className="fw-bold text-primary">{req.projectName}</td>
                                                                            <td>
                                                                                <select
                                                                                    id={`billing-${req.id}`}
                                                                                    className="form-select form-select-sm border-2 rounded-3"
                                                                                    style={{ maxWidth: '140px' }}
                                                                                >
                                                                                    <option value="BILLABLE">Billable</option>
                                                                                    <option value="INVESTMENT">Investment</option>
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-4 text-center">
                                                                                <div className="d-flex justify-content-center gap-2">
                                                                                    <button
                                                                                        className="btn btn-success btn-sm rounded-pill px-4"
                                                                                        onClick={() => handleAllocationAction(req.id, 'APPROVED', document.getElementById(`billing-${req.id}`).value)}
                                                                                        disabled={actionLoading}
                                                                                    >
                                                                                        Approve
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn btn-outline-danger btn-sm rounded-pill px-4"
                                                                                        onClick={() => handleAllocationAction(req.id, 'REJECTED')}
                                                                                        disabled={actionLoading}
                                                                                    >
                                                                                        Reject
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'allocations' && (
                                    <div className="card shadow border-0 rounded-4 overflow-hidden mb-5">
                                        <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                            <h3 className="fw-bold mb-0">Active Project Assignments</h3>
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setActiveSection(null)}>Close</button>
                                        </div>
                                        <div className="card-body p-0">
                                            {loading.data ? renderLoading() :
                                                error.data ? renderError(error.data) :
                                                    mergedTeam.filter(m => m.projectName).length === 0 ? renderEmpty('No active project assignments.') : (
                                                        <div className="table-responsive">
                                                            <table className="table table-hover align-middle mb-0">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th className="px-4 py-3">Employee</th>
                                                                        <th className="py-3">Project</th>
                                                                        <th className="py-3">Billing</th>
                                                                        <th className="px-4 py-3 text-end">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {mergedTeam.filter(m => m.projectName).map((member, idx) => (
                                                                        <tr key={idx}>
                                                                            <td className="px-4 py-3">
                                                                                <div className="fw-bold">{member.name || 'Employee'}</div>
                                                                                <div className="small text-muted">{member.email}</div>
                                                                            </td>
                                                                            <td className="fw-bold">{member.projectName}</td>
                                                                            <td>
                                                                                <span className={`badge rounded-pill ${member.allocationStatus === 'BILLABLE' ? 'bg-success' : 'bg-primary'}`}>
                                                                                    {member.allocationStatus}
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 text-end">
                                                                                <button
                                                                                    className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                                                                    onClick={() => handleEndAllocation(member.assignmentId)}
                                                                                    disabled={actionLoading || !member.assignmentId}
                                                                                >
                                                                                    End Assignment
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'pending_skills' && (
                                    <div className="card shadow border-0 rounded-4 overflow-hidden mb-5">
                                        <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                            <h3 className="fw-bold mb-0">Pending Skill Verifications</h3>
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setActiveSection(null)}>Close</button>
                                        </div>
                                        <div className="card-body p-0">
                                            {loading.skills ? renderLoading() :
                                                error.skills ? renderError(error.skills) :
                                                    pendingSkills.length === 0 ? renderEmpty('All skill requests have been processed.') : (
                                                        <div className="table-responsive">
                                                            <table className="table table-hover align-middle mb-0">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th className="px-4 py-3">Employee</th>
                                                                        <th className="py-3">Skill</th>
                                                                        <th className="py-3">Level</th>
                                                                        <th className="px-4 py-3 text-center">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {pendingSkills.map((skill) => (
                                                                        <tr key={skill.id}>
                                                                            <td className="px-4 py-3">
                                                                                <div className="fw-bold">{skill.employeeName}</div>
                                                                                <div className="small text-muted">{skill.employeeEmail}</div>
                                                                            </td>
                                                                            <td className="fw-bold">{skill.skillName}</td>
                                                                            <td><span className="badge border border-dark text-dark fw-normal rounded-pill px-3">{skill.proficiencyLevel}</span></td>
                                                                            <td className="px-4 text-center">
                                                                                <div className="d-flex justify-content-center gap-2">
                                                                                    <button
                                                                                        className="btn btn-success btn-sm rounded-pill px-4"
                                                                                        onClick={() => handleSkillAction(skill.id, 'APPROVED')}
                                                                                        disabled={actionLoading}
                                                                                    >
                                                                                        Verify
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn btn-outline-danger btn-sm rounded-pill px-4"
                                                                                        onClick={() => handleSkillAction(skill.id, 'REJECTED')}
                                                                                        disabled={actionLoading}
                                                                                    >
                                                                                        Reject
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    </div>
                </div>
            </div>

            <style>{`
                .nav-link {
                    transition: all 0.2s ease;
                    border-radius: 8px !important;
                    font-weight: 500;
                    border: none;
                    background: none;
                }
                .nav-link.active {
                    background-color: #CF4B00 !important;
                    color: white !important;
                }
                .nav-link:hover:not(.active) {
                    background-color: #f0f7ff;
                    color: #CF4B00 !important;
                }
                .cursor-pointer { cursor: pointer; }
                .transition-all { transition: all 0.3s ease; }
                .ring-2 { box-shadow: 0 0 0 3px rgba(207, 75, 0, 0.2); }
                .animate-fade-in {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .card { transition: transform 0.2s ease-in-out; }
            `}</style>
        </div>
    );
};

export default ManagerDashboard;
