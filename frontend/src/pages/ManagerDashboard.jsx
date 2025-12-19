import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ManagerDashboard = () => {
    const { user, role } = useAuth();
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

            // Merge team members with their utilization data
            const merged = teamRes.data.map(member => {
                const util = utilRes.data.find(u => u.employeeId === member.id) || {};
                return {
                    ...member,
                    allocationStatus: util.allocationStatus || 'BENCH',
                    projectName: util.projectName || null,
                    status: util.projectName ? 'ACTIVE' : 'BENCH',
                    assignmentId: util.assignmentId || null // We might need this to end allocation
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
        <div className="d-flex" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Pompiere, cursive' }}>
            {/* Sidebar */}
            <div className="bg-white shadow-sm sidebar" style={{ width: '280px', minHeight: '100vh', position: 'fixed', zIndex: 1000, borderRight: '1px solid #e2e8f0' }}>
                <div className="p-4 border-bottom">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <div className="bg-primary rounded-3 p-2">
                            <i className="bi bi-grid-1x2-fill text-white fs-4"></i>
                        </div>
                        <h4 className="fw-bold mb-0 text-dark">SkillBridge</h4>
                    </div>
                    <p className="small text-muted mb-0 fw-bold">MANAGER PORTAL</p>
                </div>

                <div className="p-3">
                    <nav className="nav flex-column gap-2">
                        <button
                            className={`nav-link border-0 text-start rounded-3 px-4 py-3 transition-all ${activeSection === null ? 'bg-primary text-white shadow' : 'text-dark hover-bg-light'}`}
                            onClick={() => setActiveSection(null)}
                        >
                            <i className="bi bi-speedometer2 me-3"></i>Overview
                        </button>
                        <button
                            className={`nav-link border-0 text-start rounded-3 px-4 py-3 transition-all ${activeSection === 'team' ? 'bg-primary text-white shadow' : 'text-dark hover-bg-light'}`}
                            onClick={() => setActiveSection('team')}
                        >
                            <i className="bi bi-people me-3"></i>Team Insights
                        </button>
                        <button
                            className={`nav-link border-0 text-start rounded-3 px-4 py-3 transition-all ${activeSection === 'alloc_requests' ? 'bg-primary text-white shadow' : 'text-dark hover-bg-light'}`}
                            onClick={() => setActiveSection('alloc_requests')}
                        >
                            <i className="bi bi-envelope-paper me-3"></i>Alloc. Requests
                            {pendingAllocations.length > 0 && <span className="badge bg-danger rounded-pill float-end">{pendingAllocations.length}</span>}
                        </button>
                        <button
                            className={`nav-link border-0 text-start rounded-3 px-4 py-3 transition-all ${activeSection === 'allocations' ? 'bg-primary text-white shadow' : 'text-dark hover-bg-light'}`}
                            onClick={() => setActiveSection('allocations')}
                        >
                            <i className="bi bi-briefcase me-3"></i>Active Projects
                        </button>
                        <button
                            className={`nav-link border-0 text-start rounded-3 px-4 py-3 transition-all ${activeSection === 'pending_skills' ? 'bg-primary text-white shadow' : 'text-dark hover-bg-light'}`}
                            onClick={() => setActiveSection('pending_skills')}
                        >
                            <i className="bi bi-patch-check me-3"></i>Verifications
                            {pendingSkills.length > 0 && <span className="badge bg-danger rounded-pill float-end">{pendingSkills.length}</span>}
                        </button>
                        <button
                            className={`nav-link border-0 text-start rounded-3 px-4 py-3 transition-all ${activeSection === 'utilization' ? 'bg-primary text-white shadow' : 'text-dark hover-bg-light'}`}
                            onClick={() => setActiveSection('utilization')}
                        >
                            <i className="bi bi-pie-chart me-3"></i>Capacity View
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow-1" style={{ marginLeft: '280px' }}>
                {/* Header */}
                <header className="bg-white shadow-sm p-4 sticky-top mb-4 border-bottom">
                    <div className="container-fluid d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="fw-bold mb-0" style={{ color: '#CF4B00' }}>
                                {activeSection === null ? 'Operational Dashboard' :
                                    activeSection === 'team' ? 'Team Insights' :
                                        activeSection === 'alloc_requests' ? 'Allocation Requests' :
                                            activeSection === 'allocations' ? 'Project Management' :
                                                activeSection === 'pending_skills' ? 'Skill Verifications' : 'Capacity Analysis'}
                            </h2>
                            <p className="text-muted mb-0">System Authority: {user?.sub || 'Manager'}</p>
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <span className="badge bg-light text-dark px-3 py-2 border rounded-pill">
                                <i className="bi bi-calendar3 me-2"></i>
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="container-fluid p-4">
                    {/* Overview Section */}
                    {activeSection === null && (
                        <div className="row g-4">
                            <div className="col-md-3">
                                <SectionCard title="Team Managed" count={loading.data ? '...' : mergedTeam.length} sectionId="team" color="#9CC6DB" onViewDetails={setActiveSection} />
                            </div>
                            <div className="col-md-3">
                                <SectionCard title="Pending Alloc." count={loading.data ? '...' : pendingAllocations.length} sectionId="alloc_requests" color="#DDBA7D" onViewDetails={setActiveSection} />
                            </div>
                            <div className="col-md-3">
                                <SectionCard title="Working Resources" count={loading.data ? '...' : mergedTeam.filter(m => m.projectName).length} sectionId="allocations" color="#9CC6DB" onViewDetails={setActiveSection} />
                            </div>
                            <div className="col-md-3">
                                <SectionCard title="Pending Skills" count={loading.skills ? '...' : pendingSkills.length} sectionId="pending_skills" color="#CF4B00" onViewDetails={setActiveSection} />
                            </div>

                            <div className="col-lg-8 mt-5">
                                <div className="card shadow-sm border-0 rounded-4 overflow-hidden h-100">
                                    <div className="card-header bg-white p-4 border-0">
                                        <h4 className="fw-bold mb-0">Recent Activity Stream</h4>
                                    </div>
                                    <div className="card-body p-4">
                                        <div className="alert alert-light border-0 shadow-sm rounded-3 mb-3 d-flex align-items-center gap-3">
                                            <div className="bg-primary-subtle rounded-circle p-2">
                                                <i className="bi bi-info-circle text-primary"></i>
                                            </div>
                                            <div>
                                                <p className="mb-0 fw-bold small">System operational</p>
                                                <p className="mb-0 x-small text-muted">All backend services are responding normally.</p>
                                            </div>
                                        </div>
                                        {pendingAllocations.length > 0 && (
                                            <div className="alert alert-warning border-0 shadow-sm rounded-3 d-flex align-items-center gap-3">
                                                <div className="bg-warning-subtle rounded-circle p-2">
                                                    <i className="bi bi-exclamation-triangle text-warning"></i>
                                                </div>
                                                <div>
                                                    <p className="mb-0 fw-bold small">Pending action required</p>
                                                    <p className="mb-0 x-small text-muted">There are {pendingAllocations.length} new allocation requests.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-lg-4 mt-5">
                                <div className="card shadow-sm border-0 rounded-4 p-4 text-center bg-primary text-white h-100 d-flex flex-column justify-content-center">
                                    <h2 className="fw-bold display-5 mb-3">Efficiency</h2>
                                    <p className="lead mb-0">Team utilization at</p>
                                    <h1 className="fw-bold display-2">
                                        {mergedTeam.length > 0
                                            ? Math.round((mergedTeam.filter(m => m.allocationStatus !== 'BENCH').length / mergedTeam.length) * 100)
                                            : 0}%
                                    </h1>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section Content */}
                    <div className="mt-2">
                        {activeSection === 'team' && (
                            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                                <div className="card-header bg-white p-4 border-0">
                                    <h3 className="fw-bold mb-0">Managed Resources</h3>
                                </div>
                                <div className="card-body p-0">
                                    {loading.data ? renderLoading() :
                                        error.data ? renderError(error.data) :
                                            mergedTeam.length === 0 ? renderEmpty('Resource pool empty.') : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="px-4 py-3">Identity</th>
                                                                <th className="py-3">Current Assignment</th>
                                                                <th className="px-4 py-3 text-end">Operational Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {mergedTeam.map((member, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-4">
                                                                        <div className="fw-bold text-dark">{member.name || 'Anonymous'}</div>
                                                                        <div className="small text-muted">{member.email}</div>
                                                                    </td>
                                                                    <td>
                                                                        {member.projectName ? (
                                                                            <span className="badge bg-info-subtle text-info border border-info rounded-pill px-3">
                                                                                {member.projectName}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-muted italic small">Awaiting Deployment</span>
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
                            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                                <div className="card-header bg-white p-4 border-0">
                                    <h3 className="fw-bold mb-0">Deployment Requests</h3>
                                </div>
                                <div className="card-body p-0">
                                    {loading.data ? renderLoading() :
                                        error.data ? renderError(error.data) :
                                            pendingAllocations.length === 0 ? renderEmpty('Awaiting new requests.') : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="px-4 py-3">Originating Resource</th>
                                                                <th className="py-3">Target Objective</th>
                                                                <th className="py-3">Mode of Billing</th>
                                                                <th className="px-4 py-3 text-center">Authorization</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pendingAllocations.map((req) => (
                                                                <tr key={req.id}>
                                                                    <td className="px-4">
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
                                                                                Decline
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
                            <div className="row g-4">
                                <div className="col-lg-8">
                                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                                        <div className="card-header bg-white p-4 border-0">
                                            <h3 className="fw-bold mb-0">Active Project Deployments</h3>
                                        </div>
                                        <div className="card-body p-0">
                                            {loading.data ? renderLoading() :
                                                error.data ? renderError(error.data) :
                                                    mergedTeam.filter(m => m.projectName).length === 0 ? renderEmpty('Zero active deployments.') : (
                                                        <div className="table-responsive">
                                                            <table className="table table-hover align-middle mb-0">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th className="px-4 py-3">Resource</th>
                                                                        <th className="py-3">Objective</th>
                                                                        <th className="py-3">Classification</th>
                                                                        <th className="px-4 py-3 text-end">Commands</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {mergedTeam.filter(m => m.projectName).map((member, idx) => (
                                                                        <tr key={idx}>
                                                                            <td className="px-4">
                                                                                <div className="fw-bold">{member.name || 'Resource'}</div>
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
                                                                                    End Term
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
                                    <div className="card shadow-sm border-0 rounded-4 h-100" style={{ borderTop: '6px solid var(--color-primary)' }}>
                                        <div className="card-body p-4">
                                            <h4 className="fw-bold mb-4">Direct Deployment</h4>
                                            <p className="small text-muted mb-4">Assign a bench resource to an objective.</p>
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
                                                    console.error('Proactive assignment failed', err);
                                                    alert(err.response?.data?.message || 'Failed to assign employee.');
                                                } finally {
                                                    setActionLoading(false);
                                                }
                                            }}>
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold">Select Resource (Bench)</label>
                                                    <select name="employeeId" className="form-select border-2 shadow-none" required>
                                                        <option value="">-- Choose Agent --</option>
                                                        {mergedTeam.filter(m => m.allocationStatus === 'BENCH').map(m => (
                                                            <option key={m.id} value={m.id}>{m.email}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label small fw-bold">Select Objective</label>
                                                    <select name="projectId" className="form-select border-2 shadow-none" required>
                                                        <option value="">-- Choose Objective --</option>
                                                        {mergedTeam.map(m => m.projectName).filter((v, i, a) => v && a.indexOf(v) === i).map((name, i) => (
                                                            <option key={i} value={mergedTeam.find(m => m.projectName === name).projectId}>{name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="mb-4">
                                                    <label className="form-label small fw-bold">Billing Class</label>
                                                    <select name="billingType" className="form-select border-2 shadow-none" required>
                                                        <option value="BILLABLE">Billable</option>
                                                        <option value="INVESTMENT">Investment</option>
                                                    </select>
                                                </div>
                                                <button type="submit" className="btn btn-dark w-100 py-2 rounded-pill fw-bold shadow-sm" disabled={actionLoading}>
                                                    {actionLoading ? 'Deploying...' : 'Authorize Deployment'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'pending_skills' && (
                            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                                <div className="card-header bg-white p-4 border-0">
                                    <h3 className="fw-bold mb-0 text-danger">Pending Verifications</h3>
                                </div>
                                <div className="card-body p-0">
                                    {loading.skills ? renderLoading() :
                                        error.skills ? renderError(error.skills) :
                                            pendingSkills.length === 0 ? renderEmpty('Verification queue clear.') : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="px-4 py-3">Agent Identity</th>
                                                                <th className="py-3">Skill Assessment</th>
                                                                <th className="py-3">Claimed Tier</th>
                                                                <th className="px-4 py-3 text-center">Final Decision</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pendingSkills.map((skill) => (
                                                                <tr key={skill.id}>
                                                                    <td className="px-4">
                                                                        <div className="fw-bold">{skill.employeeName}</div>
                                                                        <div className="small text-muted">{skill.employeeEmail}</div>
                                                                    </td>
                                                                    <td className="fw-bold">{skill.skillName}</td>
                                                                    <td><span className="badge border border-dark text-dark fw-normal rounded-pill px-3">{skill.proficiencyLevel}</span></td>
                                                                    <td className="px-4 text-center">
                                                                        <div className="d-flex justify-content-center gap-2">
                                                                            <button
                                                                                className="btn btn-success btn-sm rounded-pill px-3"
                                                                                onClick={() => handleSkillAction(skill.id, 'APPROVED')}
                                                                                disabled={actionLoading}
                                                                            >
                                                                                Accept
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-outline-danger btn-sm rounded-pill px-3"
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

                        {activeSection === 'utilization' && (
                            <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                                <div className="card-header bg-white p-4 border-0">
                                    <h3 className="fw-bold mb-0">Capacity Analysis</h3>
                                </div>
                                <div className="card-body p-0">
                                    {loading.data ? renderLoading() :
                                        error.data ? renderError(error.data) :
                                            mergedTeam.length === 0 ? renderEmpty('Metrics offline.') : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th className="px-4 py-3">Resource Identifier</th>
                                                                <th className="px-4 py-3 text-end">Utilization Segment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {mergedTeam.map((item, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-4">
                                                                        <div className="fw-bold">{item.email}</div>
                                                                        <div className="small text-muted">{item.name || 'Team Member'}</div>
                                                                    </td>
                                                                    <td className="px-4 text-end">
                                                                        <span className={`badge rounded-pill px-4 py-2 ${item.allocationStatus === 'BILLABLE' ? 'bg-success' :
                                                                            item.allocationStatus === 'INVESTMENT' ? 'bg-primary' :
                                                                                'bg-danger shadow-sm'
                                                                            }`}>
                                                                            {item.allocationStatus}
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
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
