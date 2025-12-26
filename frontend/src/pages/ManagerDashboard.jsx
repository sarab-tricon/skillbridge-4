import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { allocationsApi } from '../api/allocations';


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
    const [allActiveProjects, setAllActiveProjects] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
        <div className="container-fluid p-0 overflow-hidden" style={{ height: 'calc(100vh - 65px)', backgroundColor: 'var(--color-bg)' }}>
            <div className="row g-0 h-100">
                {/* SIDEBAR */}
                <div className={`col-auto sidebar transition-width ${isSidebarCollapsed ? 'sidebar-collapsed' : 'col-md-3 col-lg-2'}`} style={{ backgroundColor: '#fff', borderRight: '1px solid #dee2e6', overflowY: 'auto' }}>
                    <div className="d-flex flex-column px-2 px-md-3 pt-4 h-100">
                        <div className="sidebar-header d-flex align-items-center justify-content-between mb-4 px-2">
                            {!isSidebarCollapsed && <h4 className="sidebar-title m-0 fw-bold text-accent">Menu</h4>}
                            <button
                                className={`btn btn-sm ${isSidebarCollapsed ? 'btn-accent w-100' : 'btn-outline-accent border-0 ms-auto'} transition-all`}
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                title={isSidebarCollapsed ? "Expand" : "Collapse"}
                                style={{ width: isSidebarCollapsed ? 'auto' : '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <i className={`bi ${isSidebarCollapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'} fs-6 text-accent`}></i>
                            </button>
                        </div>
                        <ul className="nav flex-column w-100 gap-2" id="menu">
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection(null)}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === null ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "Dashboard" : ""}
                                >
                                    <i className="bi bi-speedometer2 icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">Dashboard</span>}
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('team')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'team' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "My Team" : ""}
                                >
                                    <i className="bi bi-people icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">My Team</span>}
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('alloc_requests')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'alloc_requests' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "Allocations" : ""}
                                >
                                    <i className="bi bi-patch-check icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">Allocations</span>}
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('pending_skills')}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === 'pending_skills' ? 'active' : ''} ${isSidebarCollapsed ? 'justify-content-center px-0' : 'px-3'}`}
                                    title={isSidebarCollapsed ? "Verifications" : ""}
                                >
                                    <i className="bi bi-star icon-std fs-5"></i>
                                    {!isSidebarCollapsed && <span className="ms-2">Verifications</span>}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                {/* MAIN CONTENT AREA */}
                <div className="col h-100 p-4 p-md-5" style={{ overflowY: 'auto', scrollbarGutter: 'stable' }}>
                    <header className="page-header text-center">
                        <h1 className="page-title">
                            Manager Control Panel
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
                                        count={loading.data ? '...' : allActiveProjects.length}
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
                                        <div className="row g-4">
                                            {/* Organization Projects */}
                                            <div className="col-lg-6">
                                                <div className="card shadow border-0 rounded-4 h-100 overflow-hidden">
                                                    <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                                        <h4 className="fw-bold mb-0">Organization Projects</h4>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        {loading.data ? renderLoading() :
                                                            error.data ? renderError(error.data) :
                                                                allActiveProjects.length === 0 ? renderEmpty('No active organization projects found.') : (
                                                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'scroll', overflowX: 'hidden' }}>
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
                                                                                            <span className="badge bg-success-subtle text-success border border-success rounded-pill px-3">
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
                                                        <h4 className="fw-bold mb-0">Active Team Assignments</h4>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        {loading.data ? renderLoading() :
                                                            error.data ? renderError(error.data) :
                                                                mergedTeam.filter(m => m.projectName).length === 0 ? renderEmpty('No active team assignments.') : (
                                                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'scroll', overflowX: 'hidden' }}>
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
                                        <div className="text-center mt-4">
                                            <button className="btn btn-outline-secondary btn-sm rounded-pill px-4" onClick={() => setActiveSection(null)}>Close Projects View</button>
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
                                    className="form-control mb-3"
                                    rows="3"
                                    value={modalComment}
                                    onChange={(e) => setModalComment(e.target.value)}
                                    placeholder="e.g., Recommend approval based on skills..."
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
                                    className="form-control"
                                    rows="3"
                                    value={modalReason}
                                    onChange={(e) => setModalReason(e.target.value)}
                                    placeholder="e.g., Skills do not match project requirements..."
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
                .nav-link {
                    transition: all 0.2s ease;
                    border-radius: 8px !important;
                    font-weight: 500;
                    border: none;
                    background: none;
                    height: 48px;
                }
                .sidebar.transition-width {
                    transition: width 0.3s ease, flex-basis 0.3s ease;
                }
                .sidebar-collapsed {
                    width: 70px !important;
                }
                .nav-link.active {
                    background-color: #CF4B00 !important;
                    color: white !important;
                }
                .nav-link:hover:not(.active) {
                    background-color: rgba(207, 75, 0, 0.1);
                    border: 1px solid #CF4B00;
                    color: #CF4B00 !important;
                }
                .text-accent {
                    color: #CF4B00 !important;
                }
                .btn-accent {
                    background-color: #CF4B00;
                    color: white;
                    border: 1px solid #CF4B00;
                }
                .btn-outline-accent {
                    color: #CF4B00;
                    border: 1px solid #CF4B00;
                    background: transparent;
                }
                .btn-outline-accent:hover {
                    background-color: #CF4B00;
                    color: white;
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
