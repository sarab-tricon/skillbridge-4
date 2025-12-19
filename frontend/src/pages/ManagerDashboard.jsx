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
                api.get('/assignments/pending')
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
            setPendingAllocations(pendingAllocRes.data);
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

    const handleAllocationAction = async (id, status, billingType = 'BILLABLE') => {
        setActionLoading(true);
        try {
            if (status === 'APPROVED') {
                await api.put(`/assignments/${id}/approve`, { billingType });
            } else {
                await api.put(`/assignments/${id}/reject`);
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
        <div className="container-fluid py-4" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Pompiere, cursive' }}>
            {/* Header */}
            <header className="mb-5 text-center">
                <h1 className="display-4 fw-bold mb-0" style={{ color: '#CF4B00' }}>Manager Control Panel</h1>
                <p className="lead text-muted">Welcome back, {user?.sub?.split('@')[0] || 'Manager'}</p>
                <div className="d-flex justify-content-center gap-3 mt-3">
                    <span className="badge bg-white text-dark px-3 py-2 border rounded-pill shadow-sm">
                        <i className="bi bi-calendar3 me-2 text-primary"></i>
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                </div>
            </header>

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
                        title="Allocation Requests"
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
                        title="Skill Verifications"
                        count={loading.skills ? '...' : pendingSkills.length}
                        sectionId="pending_skills"
                        color="#CF4B00"
                    />
                </div>
            </div>

            {/* Active Section Content */}
            <div className="animate-fade-in">
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
                    <div className="row g-4 mb-5">
                        <div className="col-lg-8">
                            <div className="card shadow border-0 rounded-4 overflow-hidden h-100">
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
                        </div>
                        <div className="col-lg-4">
                            <div className="card shadow-sm border-0 rounded-4 p-4 h-100" style={{ borderTop: '6px solid #9CC6DB' }}>
                                <h4 className="fw-bold mb-4">Quick Assignment</h4>
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.target);
                                    const payload = {
                                        employeeId: formData.get('employeeId'),
                                        projectId: formData.get('projectId'),
                                        billingType: formData.get('billingType')
                                    };
                                    setActionLoading(true);
                                    try {
                                        await api.post('/assignments', payload);
                                        e.target.reset();
                                        fetchData();
                                    } catch (err) {
                                        console.error('Failed to assign employee', err);
                                        alert(err.response?.data?.message || 'Failed to assign employee.');
                                    } finally {
                                        setActionLoading(false);
                                    }
                                }}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Select Employee (Bench)</label>
                                        <select name="employeeId" className="form-select border-2 shadow-none" required>
                                            <option value="">-- Choose Employee --</option>
                                            {mergedTeam.filter(m => m.allocationStatus === 'BENCH').map(m => (
                                                <option key={m.id} value={m.id}>{m.email}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Select Project</label>
                                        <select name="projectId" className="form-select border-2 shadow-none" required>
                                            <option value="">-- Choose Project --</option>
                                            {mergedTeam.map(m => m.projectName).filter((v, i, a) => v && a.indexOf(v) === i).map((name, i) => (
                                                <option key={i} value={mergedTeam.find(m => m.projectName === name).projectId}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold">Billing Type</label>
                                        <select name="billingType" className="form-select border-2 shadow-none" required>
                                            <option value="BILLABLE">Billable</option>
                                            <option value="INVESTMENT">Investment</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="btn btn-dark w-100 py-2 rounded-pill fw-bold" disabled={actionLoading}>
                                        {actionLoading ? 'Assigning...' : 'Assign to Project'}
                                    </button>
                                </form>
                            </div>
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

            <style>{`
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
                .card { transition: transform 0.2s ease; }
                .card:hover { transform: translateY(-3px); }
            `}</style>
        </div>
    );
};

export default ManagerDashboard;
