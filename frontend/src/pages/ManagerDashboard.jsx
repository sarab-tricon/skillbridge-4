import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { allocationsApi } from '../api/allocations';
import Sidebar from '../components/Sidebar';


const ManagerDashboard = () => {
    const { user } = useAuth();
    const [mergedTeam, setMergedTeam] = useState([]);
    const [pendingSkills, setPendingSkills] = useState([]);
    const [activeSection, setActiveSection] = useState(() => {
        const saved = localStorage.getItem('managerActiveSection');
        return (saved === 'null' || saved === null) ? null : saved;
    });

    // Persist active section to localStorage
    useEffect(() => {
        localStorage.setItem('managerActiveSection', activeSection);
    }, [activeSection]);
    const [loading, setLoading] = useState({
        data: true,
        skills: true
    });
    const [error, setError] = useState({
        data: null,
        skills: null
    });
    const [pendingAllocations, setPendingAllocations] = useState([]);
    const [allActiveProjects, setAllActiveProjects] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Manager menu items for sidebar
    const managerMenuItems = [
        { id: null, label: 'Dashboard', icon: 'bi-speedometer2' },
        { id: 'team', label: 'My Team', icon: 'bi-people' },
        { id: 'allocations', label: 'Active Projects', icon: 'bi-journal-code' },
        { id: 'alloc_requests', label: 'Allocations', icon: 'bi-patch-check' },
        { id: 'pending_skills', label: 'Verifications', icon: 'bi-star' }
    ];

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [modalComment, setModalComment] = useState('');
    const [modalReason, setModalReason] = useState('');

    const fetchData = async () => {
        try {
            setLoading(prev => ({ ...prev, data: true }));
            const [teamRes, utilRes, pendingAllocRes, allProjRes] = await Promise.all([
                api.get('/users/team'),
                api.get('/utilization/team'),
                api.get('/allocation-requests/pending'),
                api.get('/projects/active')
            ]);

            const merged = teamRes.data.map(member => {
                const util = utilRes.data?.find(u => u.employeeId === member.id);
                return {
                    ...member,
                    name: `${member.firstName} ${member.lastName}`.trim() || 'Employee',
                    projectName: util ? util.projectName : null,
                    allocationStatus: util ? util.allocationStatus : 'BENCH',
                    status: util ? 'ACTIVE' : 'BENCH',
                    assignmentId: util ? util.assignmentId : null
                };
            });

            setMergedTeam(merged);
            setPendingAllocations(pendingAllocRes.data.map(req => ({
                ...req,
                id: req.id || req.assignmentId,
                selectedBillingType: req.billingType || 'BILLABLE' // Initialize with default
            })));
            setAllActiveProjects(allProjRes.data);
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

    // New functions for allocation request actions
    const handleForward = async () => {
        setActionLoading(true);
        try {
            // Find current state of this request to get latest billing type selection
            const requestState = pendingAllocations.find(r => r.id === selectedRequest.id);
            const billingTypeToSubmit = requestState?.selectedBillingType || 'BILLABLE';

            await allocationsApi.forwardToHr(selectedRequest.id, modalComment, billingTypeToSubmit);
            setShowForwardModal(false);
            setModalComment('');
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Failed to forward request:', error);
            alert(error.response?.data || 'Failed to forward request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!modalReason.trim()) {
            alert('Rejection reason is mandatory');
            return;
        }
        setActionLoading(true);
        try {
            await allocationsApi.rejectRequest(selectedRequest.id, modalReason); // Use selectedRequest.id
            setShowRejectModal(false);
            setModalReason('');
            fetchData(); // Refresh list
        } catch (error) {
            console.error('Failed to reject request:', error);
            alert(error.response?.data || 'Failed to reject request');
        } finally {
            setActionLoading(false);
        }
    };

    const openForwardModal = (req) => {
        // Ensure billing type is set in state (it is by default, but UI selector updates it)
        setSelectedRequest(req);
        setModalComment('');
        setShowForwardModal(true);
    };

    const openRejectModal = (req) => {
        setSelectedRequest(req);
        setModalReason('');
        setShowRejectModal(true);
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
            className={`card h-100 shadow-sm border-0 cursor-pointer summary-card ${activeSection === sectionId ? 'ring-2' : ''}`}
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
                <h2 className="text-muted text-uppercase mb-3 fw-bold h6" style={{ letterSpacing: '1.5px' }}>{title}</h2>
                <p className="display-4 fw-bold mb-0" style={{ color: 'var(--color-primary)' }}>{count}</p>
                <div className="mt-3">
                    <button
                        className="btn px-4 py-2 rounded-pill fw-bold summary-btn"
                        style={{
                            '--btn-theme-color': color,
                            backgroundColor: `${color.slice(0, 7)}1F`,
                            color: color,
                            border: `1px solid ${color}`,
                            fontSize: '0.875rem',
                            transition: 'all 0.2s ease-in-out'
                        }}
                        aria-label={`${activeSection === sectionId ? 'Hide' : 'View'} details for ${title}`}
                        aria-expanded={activeSection === sectionId}
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveSection(activeSection === sectionId ? null : sectionId);
                        }}
                    >
                        {activeSection === sectionId ? 'Hide Details' : 'View Details'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container-fluid p-0 overflow-hidden" style={{ height: 'calc(100vh - 65px)', backgroundColor: 'var(--color-bg)' }}>
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <div className="row g-0 h-100">
                {/* SIDEBAR */}
                <Sidebar
                    title="Menu"
                    menuItems={managerMenuItems}
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                />

                <main id="main-content" className="col h-100 p-4 p-md-5" style={{ overflowY: 'auto', scrollbarGutter: 'stable' }} tabIndex="-1">
                    <header className="page-header mb-4">
                        <h1 className="page-title fw-bold text-accent">
                            {activeSection === null && 'Manager Control Panel'}
                            {activeSection === 'team' && 'Team Management'}
                            {activeSection === 'allocations' && 'Active Projects'}
                            {activeSection === 'alloc_requests' && 'Allocation Requests'}
                            {activeSection === 'pending_skills' && 'Skill Verifications'}
                        </h1>
                        <p className="lead text-muted">
                            {activeSection === null
                                ? `Welcome back, ${user?.sub?.split('@')[0] || 'Manager'}`
                                : 'Manage your organization\'s workforce and projects from one place.'}
                        </p>
                    </header>

                    <div className="animate-fade-in">
                        <>
                            {/* Dashboard Overview - Summary Cards + Hint */}
                            {activeSection === null && (
                                <>
                                    <div className="row g-4 mb-5">
                                        <div className="col-md-3">
                                            <SectionCard
                                                title="Team Size"
                                                count={loading.data ? '...' : mergedTeam.length}
                                                sectionId="team"
                                                color="#CF4B00"
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <SectionCard
                                                title="Allocations"
                                                count={loading.data ? '...' : pendingAllocations.length}
                                                sectionId="alloc_requests"
                                                color="#CF4B00"
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <SectionCard
                                                title="Active Projects"
                                                count={loading.data ? '...' : allActiveProjects.length}
                                                sectionId="allocations"
                                                color="#CF4B00"
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

                                    <div className="row justify-content-center mt-5">
                                        <div className="col-md-8 text-center">
                                            <div className="p-5 border-2 border-dashed rounded-4 bg-white shadow-sm">
                                                <i className="bi bi-arrow-up-circle display-1 text-muted opacity-25 mb-4"></i>
                                                <h2 className="text-muted fw-bold h3">Select a metric above to view detailed insights</h2>
                                                <p className="text-muted">You can manage team allocations, verify skill requests, and track project deployments from this panel.</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Active Section Content */}
                            <div>

                                {activeSection === 'team' && (
                                    <div className="card shadow border-0 rounded-4 overflow-hidden mb-5">
                                        <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                            <h2 className="fw-bold mb-0 h3">Team Directory</h2>
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setActiveSection(null)} title="Close"><i className="bi bi-x-lg"></i></button>
                                        </div>
                                        <div className="card-body p-0">
                                            {loading.data ? renderLoading() :
                                                error.data ? renderError(error.data) :
                                                    mergedTeam.length === 0 ? renderEmpty('No team members found.') : (
                                                        <div className="table-responsive" tabIndex="0" role="region" aria-label="Team Directory table">
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
                                                                                    <span className="badge bg-info-subtle text-dark border border-info rounded-pill px-3">
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
                                            <h2 className="fw-bold mb-0 h3">Pending Allocation Requests</h2>
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setActiveSection(null)} title="Close"><i className="bi bi-x-lg"></i></button>
                                        </div>
                                        <div className="card-body p-0">
                                            {loading.data ? renderLoading() :
                                                error.data ? renderError(error.data) :
                                                    pendingAllocations.length === 0 ? renderEmpty('No pending allocation requests.') : (
                                                        <div className="table-responsive" tabIndex="0" role="region" aria-label="Pending Allocation Requests table">
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
                                                                                    value={req.selectedBillingType}
                                                                                    onChange={(e) => {
                                                                                        const newVal = e.target.value;
                                                                                        setPendingAllocations(prev => prev.map(p =>
                                                                                            p.id === req.id ? { ...p, selectedBillingType: newVal } : p
                                                                                        ));
                                                                                    }}
                                                                                >
                                                                                    <option value="BILLABLE">Billable</option>
                                                                                    <option value="INVESTMENT">Investment</option>
                                                                                </select>
                                                                            </td>
                                                                            <td className="px-4 text-center">
                                                                                <div className="d-flex justify-content-center gap-2">
                                                                                    <button
                                                                                        className="btn btn-outline-primary btn-sm rounded-pill px-4"
                                                                                        onClick={() => openForwardModal(req)}
                                                                                        disabled={actionLoading}
                                                                                    >
                                                                                        Forward to HR
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn btn-outline-danger btn-sm rounded-pill px-4"
                                                                                        onClick={() => openRejectModal(req)}
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
                                    <div className="animate-fade-in">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h2 className="fw-bold mb-0 h3">Active Projects & Assignments</h2>
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setActiveSection(null)} title="Close"><i className="bi bi-x-lg"></i></button>
                                        </div>
                                        <div className="row g-4">
                                            {/* Organization Projects */}
                                            <div className="col-lg-6">
                                                <div className="card shadow border-0 rounded-4 h-100 overflow-hidden">
                                                    <div className="card-header bg-white p-4 border-0">
                                                        <h3 className="fw-bold mb-0 text-muted small text-uppercase" style={{ letterSpacing: '1px' }}>Organization Projects</h3>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        {loading.data ? renderLoading() :
                                                            error.data ? renderError(error.data) :
                                                                allActiveProjects.length === 0 ? renderEmpty('No active organization projects found.') : (
                                                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'scroll', overflowX: 'hidden' }} tabIndex="0" role="region" aria-label="Organization Projects table">
                                                                        <table className="table table-hover align-middle mb-0">
                                                                            <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                                                                                <tr>
                                                                                    <th className="px-4 py-3">Project Name</th>
                                                                                    <th className="py-3">Company</th>
                                                                                    <th className="px-4 py-3 text-end">Status</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {allActiveProjects.map((proj, idx) => (
                                                                                    <tr key={idx}>
                                                                                        <td className="px-4 py-3 fw-bold text-primary">{proj.name}</td>
                                                                                        <td>{proj.companyName}</td>
                                                                                        <td className="px-4 text-end">
                                                                                            <span className="badge bg-success-subtle text-success-emphasis border border-success rounded-pill px-3">
                                                                                                {proj.status}
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
                                            </div>

                                            {/* Team Assignments */}
                                            <div className="col-lg-6">
                                                <div className="card shadow border-0 rounded-4 h-100 overflow-hidden">
                                                    <div className="card-header bg-white p-4 border-0">
                                                        <h3 className="fw-bold mb-0 text-muted small text-uppercase" style={{ letterSpacing: '1px' }}>Active Team Assignments</h3>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        {loading.data ? renderLoading() :
                                                            error.data ? renderError(error.data) :
                                                                mergedTeam.filter(m => m.projectName).length === 0 ? renderEmpty('No active team assignments.') : (
                                                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'scroll', overflowX: 'hidden' }} tabIndex="0" role="region" aria-label="Active Team Assignments table">
                                                                        <table className="table table-hover align-middle mb-0">
                                                                            <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                                                                                <tr>
                                                                                    <th className="px-4 py-3">Employee</th>
                                                                                    <th className="py-3 px-4 text-end">Project</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {mergedTeam.filter(m => m.projectName).map((member, idx) => (
                                                                                    <tr key={idx}>
                                                                                        <td className="px-4 py-3">
                                                                                            <div className="fw-bold small">{member.name || 'Employee'}</div>
                                                                                            <div className="text-muted">{member.email}</div>
                                                                                        </td>
                                                                                        <td className="fw-bold small px-4 text-end">{member.projectName}</td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeSection === 'pending_skills' && (
                                    <div className="card shadow border-0 rounded-4 overflow-hidden mb-5">
                                        <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                            <h2 className="fw-bold mb-0 h3">Pending Skill Verifications</h2>
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill" onClick={() => setActiveSection(null)} title="Close"><i className="bi bi-x-lg"></i></button>
                                        </div>
                                        <div className="card-body p-0">
                                            {loading.skills ? renderLoading() :
                                                error.skills ? renderError(error.skills) :
                                                    pendingSkills.length === 0 ? renderEmpty('All skill requests have been processed.') : (
                                                        <div className="table-responsive" tabIndex="0" role="region" aria-label="Pending Skill Verifications table">
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
                </main>
            </div>

            {/* Forward Modal */}
            {showForwardModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Forward to HR</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForwardModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-3">Add comments for HR (optional):</p>
                                <textarea
                                    id="forward-comment"
                                    className="form-control mb-3"
                                    rows="3"
                                    value={modalComment}
                                    onChange={(e) => setModalComment(e.target.value)}
                                    placeholder="e.g., Recommend approval based on skills..."
                                    aria-label="Comments for HR"
                                ></textarea>

                                <div className="alert alert-light border small">
                                    <strong>Confirm Forwarding:</strong>
                                    <br />
                                    Assigning <strong>{pendingAllocations.find(r => r.id === selectedRequest?.id)?.selectedBillingType}</strong> billing type.
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowForwardModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary rounded-pill px-4" onClick={handleForward} disabled={actionLoading}>
                                    {actionLoading ? 'Forwarding...' : 'Forward Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-danger">Reject Request</h5>
                                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-3">Please provide a reason for rejection (mandatory):</p>
                                <textarea
                                    id="reject-reason"
                                    className="form-control"
                                    rows="3"
                                    value={modalReason}
                                    onChange={(e) => setModalReason(e.target.value)}
                                    placeholder="e.g., Skills do not match project requirements..."
                                    aria-label="Rejection reason"
                                    required
                                ></textarea>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowRejectModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-danger rounded-pill px-4" onClick={handleReject} disabled={actionLoading}>
                                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                .card { transition: transform 0.2s ease-in-out; }
                .summary-card:hover {
                    transform: translateY(-8px) !important;
                    box-shadow: 0 15px 30px rgba(0,0,0,0.12) !important;
                }
                .summary-btn:hover {
                    background-color: var(--btn-theme-color) !important;
                    color: white !important;
                    transform: scale(1.05);
                }
                .skip-link {
                    position: absolute;
                    top: -40px;
                    left: 0;
                    background: #212529;
                    color: white;
                    padding: 8px;
                    z-index: 100;
                    transition: top 0.3s;
                }
                .skip-link:focus {
                    top: 0;
                }
            `}</style>
        </div>
    );
};

export default ManagerDashboard;
