import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { allocationsApi } from '../api/allocations';
import Sidebar from '../components/Sidebar';
import ProfileSection from '../components/ProfileSection';


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
        skills: true,
        mySkills: false,
        myAlloc: false,
        myUtil: false
    });
    const [error, setError] = useState({
        data: null,
        skills: null,
        mySkills: null,
        myAlloc: null,
        myUtil: null
    });
    const [pendingAllocations, setPendingAllocations] = useState([]);
    const [allActiveProjects, setAllActiveProjects] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);

    // Personal section states (My Skills, Allocation, Utilization, Profile)
    const [mySkills, setMySkills] = useState([]);
    const [myAllocation, setMyAllocation] = useState([]);
    const [myUtilization, setMyUtilization] = useState(null);
    const [profile, setProfile] = useState(null);
    const [catalogSkills, setCatalogSkills] = useState([]);
    const [newSkill, setNewSkill] = useState({ skillName: '', proficiencyLevel: 'BEGINNER' });
    const [editingSkill, setEditingSkill] = useState(null);
    const [addingSkill, setAddingSkill] = useState(false);
    const [skillSuccess, setSkillSuccess] = useState(null);
    const [skillError, setSkillError] = useState(null);
    const [selectedSkillLevel, setSelectedSkillLevel] = useState('BEGINNER');

    // Manager menu items for sidebar (Personal + Team Management)
    const managerMenuItems = [
        { id: null, label: 'Dashboard', icon: 'bi-speedometer2' },
        { id: 'my_skills', label: 'My Skills', icon: 'bi-star-fill' },
        { id: 'my_utilization', label: 'My Utilization', icon: 'bi-graph-up' },
        { id: 'team', label: 'My Team', icon: 'bi-people' },
        { id: 'allocations', label: 'Active Projects', icon: 'bi-journal-code' },
        { id: 'alloc_requests', label: 'Allocations', icon: 'bi-patch-check' },
        { id: 'pending_skills', label: 'Verifications', icon: 'bi-star' },
        { id: 'my_profile', label: 'My Profile', icon: 'bi-person-circle' }
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

    // Personal data fetch functions
    const fetchMySkills = async () => {
        setLoading(prev => ({ ...prev, mySkills: true }));
        try {
            const response = await api.get('/skills/my');
            setMySkills(response.data);
            setError(prev => ({ ...prev, mySkills: null }));
        } catch (err) {
            console.error('Error fetching my skills:', err);
            setError(prev => ({ ...prev, mySkills: 'Failed to load skills.' }));
        } finally {
            setLoading(prev => ({ ...prev, mySkills: false }));
        }
    };

    const fetchMyAllocation = async () => {
        setLoading(prev => ({ ...prev, myAlloc: true }));
        try {
            const response = await api.get('/assignments/my');
            setMyAllocation(response.data);
            setError(prev => ({ ...prev, myAlloc: null }));
        } catch (err) {
            console.error('Error fetching my allocation:', err);
            if (err.response?.status === 404) {
                setMyAllocation([]);
            } else {
                setError(prev => ({ ...prev, myAlloc: 'Failed to load allocation.' }));
            }
        } finally {
            setLoading(prev => ({ ...prev, myAlloc: false }));
        }
    };

    const fetchMyUtilization = async () => {
        setLoading(prev => ({ ...prev, myUtil: true }));
        try {
            const response = await api.get('/utilization/me');
            setMyUtilization(response.data);
            setError(prev => ({ ...prev, myUtil: null }));
        } catch (err) {
            console.error('Error fetching my utilization:', err);
            setError(prev => ({ ...prev, myUtil: 'Failed to load utilization.' }));
        } finally {
            setLoading(prev => ({ ...prev, myUtil: false }));
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me');
            setProfile(response.data);
        } catch (err) {
            console.error('Failed to load profile:', err);
        }
    };

    const fetchCatalog = async () => {
        try {
            const response = await api.get('/catalog/skills');
            setCatalogSkills(response.data);
        } catch (err) {
            console.error('Failed to load catalog:', err);
        }
    };

    // Skill handlers for manager's own skills
    const handleAddSkill = async (e) => {
        e.preventDefault();
        const isDuplicate = mySkills.some(s => s.skillName.toLowerCase() === newSkill.skillName.toLowerCase());
        if (isDuplicate) {
            setSkillError(`You already have "${newSkill.skillName}" in your list.`);
            return;
        }
        setAddingSkill(true);
        setSkillError(null);
        setSkillSuccess(null);
        try {
            await api.post('/skills', newSkill);
            setNewSkill({ skillName: '', proficiencyLevel: 'BEGINNER' });
            setSkillSuccess('Skill added (auto-approved)!');
            fetchMySkills();
            setTimeout(() => setSkillSuccess(null), 3000);
        } catch (err) {
            setSkillError(err.response?.data?.message || 'Failed to add skill.');
        } finally {
            setAddingSkill(false);
        }
    };

    const handleUpdateSkill = async (e) => {
        e.preventDefault();
        setAddingSkill(true);
        setSkillError(null);
        setSkillSuccess(null);
        try {
            await api.put(`/skills/${editingSkill.id}`, {
                skillName: editingSkill.skillName,
                proficiencyLevel: editingSkill.proficiencyLevel
            });
            setSkillSuccess('Skill updated!');
            setEditingSkill(null);
            fetchMySkills();
            setTimeout(() => setSkillSuccess(null), 3000);
        } catch (err) {
            setSkillError(err.response?.data?.message || 'Failed to update skill.');
        } finally {
            setAddingSkill(false);
        }
    };

    const handleDeleteSkill = async (id) => {
        if (!window.confirm('Are you sure you want to delete this skill?')) return;
        try {
            await api.delete(`/skills/${id}`);
            setSkillSuccess('Skill deleted.');
            fetchMySkills();
            setTimeout(() => setSkillSuccess(null), 3000);
        } catch (err) {
            setSkillError(err.response?.data?.message || 'Failed to delete skill.');
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
        // Personal data for manager
        fetchMySkills();
        fetchMyAllocation();
        fetchMyUtilization();
        fetchProfile();
        fetchCatalog();
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
                            {activeSection === 'my_skills' && 'My Skills'}
                            {activeSection === 'my_allocation' && 'My Allocation'}
                            {activeSection === 'my_utilization' && 'My Utilization'}
                            {activeSection === 'my_profile' && 'My Profile'}
                        </h1>
                        <p className="lead text-muted">
                            {activeSection === null
                                ? `Welcome back, ${user?.sub?.split('@')[0] || 'Manager'}`
                                : activeSection?.startsWith('my_')
                                    ? 'Manage your personal skills, allocations and profile.'
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

                                {/* =============== PERSONAL SECTIONS =============== */}

                                {/* MY SKILLS */}
                                {activeSection === 'my_skills' && (
                                    <div className="row g-4">
                                        <div className="col-lg-4">
                                            <div className="card shadow-sm border-0 p-4 sticky-top" style={{ top: '0', backgroundColor: '#fff', borderLeft: '5px solid var(--color-accent)' }}>
                                                <h4 className="fw-bold mb-3">{editingSkill ? 'Edit Skill' : 'Add New Skill'}</h4>
                                                <form onSubmit={editingSkill ? handleUpdateSkill : handleAddSkill}>
                                                    <div className="mb-3">
                                                        <label className="form-label small text-muted text-uppercase fw-bold">Skill Name</label>
                                                        <select
                                                            className="form-select border-2 shadow-none"
                                                            value={editingSkill ? editingSkill.skillName : newSkill.skillName}
                                                            onChange={(e) => editingSkill
                                                                ? setEditingSkill({ ...editingSkill, skillName: e.target.value })
                                                                : setNewSkill({ ...newSkill, skillName: e.target.value })
                                                            }
                                                            required
                                                        >
                                                            <option value="">Select a skill...</option>
                                                            {catalogSkills.map(s => (
                                                                <option key={s.id} value={s.name}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="mb-4">
                                                        <label className="form-label small text-muted text-uppercase fw-bold">Proficiency Level</label>
                                                        <select
                                                            className="form-select border-2 shadow-none"
                                                            value={editingSkill ? editingSkill.proficiencyLevel : newSkill.proficiencyLevel}
                                                            onChange={(e) => editingSkill
                                                                ? setEditingSkill({ ...editingSkill, proficiencyLevel: e.target.value })
                                                                : setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })
                                                            }
                                                        >
                                                            <option value="BEGINNER">Beginner</option>
                                                            <option value="INTERMEDIATE">Intermediate</option>
                                                            <option value="ADVANCED">Advanced</option>
                                                        </select>
                                                    </div>
                                                    {skillError && <div className="alert alert-danger p-2 small mb-3">{skillError}</div>}
                                                    {skillSuccess && <div className="alert alert-success p-2 small mb-3">{skillSuccess}</div>}
                                                    <div className="d-flex gap-2">
                                                        <button type="submit" className={`btn btn-accent w-100 fw-bold py-2 ${editingSkill ? 'btn-info text-white' : ''}`} disabled={addingSkill}>
                                                            {addingSkill ? 'Processing...' : editingSkill ? 'Update Skill' : 'Add Skill'}
                                                        </button>
                                                        {editingSkill && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-secondary w-50 fw-bold"
                                                                onClick={() => { setEditingSkill(null); setSkillError(null); }}
                                                            >
                                                                Cancel
                                                            </button>
                                                        )}
                                                    </div>
                                                </form>
                                                <div className="mt-3 text-center">
                                                    <small className="text-success"><i className="bi bi-check-circle me-1"></i>Manager skills are auto-approved</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-8">
                                            {/* Tab Navigation */}
                                            <div className="nav nav-pills mb-4 bg-white p-2 rounded-4 shadow-sm d-flex justify-content-between gap-2">
                                                {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(level => (
                                                    <button
                                                        key={level}
                                                        className={`nav-link flex-grow-1 fw-bold rounded-pill py-2 ${selectedSkillLevel === level ? 'active bg-accent text-white' : 'text-muted'}`}
                                                        onClick={() => setSelectedSkillLevel(level)}
                                                    >
                                                        {level}
                                                        <span className={`ms-2 badge rounded-pill ${selectedSkillLevel === level ? 'bg-white text-dark' : 'bg-light text-muted'}`}>
                                                            {mySkills.filter(s => s.proficiencyLevel === level).length}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                            {loading.mySkills ? renderLoading() : error.mySkills ? renderError(error.mySkills) : (
                                                <div className="card shadow-sm border-0 overflow-hidden rounded-4">
                                                    <div className="card-header py-3 px-4 border-0 d-flex justify-content-between align-items-center bg-white" style={{ borderBottom: '2px solid var(--color-accent)' }}>
                                                        <h5 className="mb-0 fw-bold">{selectedSkillLevel} Skills</h5>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        <div className="table-responsive">
                                                            <table className="table table-hover align-middle mb-0">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th className="px-4 py-3">Skill Name</th>
                                                                        <th className="px-4 py-3 text-center">Status</th>
                                                                        <th className="px-4 py-3 text-end">Actions</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {mySkills.filter(s => s.proficiencyLevel === selectedSkillLevel).length > 0 ? (
                                                                        mySkills.filter(s => s.proficiencyLevel === selectedSkillLevel).map((skill) => (
                                                                            <tr key={skill.id}>
                                                                                <td className="px-4 py-3 fw-bold text-dark">{skill.skillName}</td>
                                                                                <td className="px-4 py-3 text-center">
                                                                                    <span className={`badge px-3 py-2 rounded-pill ${skill.status === 'APPROVED' ? 'bg-success' : skill.status === 'PENDING' ? 'bg-secondary' : 'bg-danger'}`}>
                                                                                        {skill.status}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-end">
                                                                                    <button
                                                                                        className="btn btn-sm btn-outline-accent rounded-pill px-4"
                                                                                        onClick={() => { setEditingSkill(skill); setSkillError(null); }}
                                                                                    >
                                                                                        <i className="bi bi-pencil-square me-1"></i> Edit
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr>
                                                                            <td colSpan="3" className="text-center py-5 text-muted">
                                                                                No {selectedSkillLevel.toLowerCase()} skills found.
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* MY ALLOCATION */}
                                {activeSection === 'my_allocation' && (
                                    <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
                                        <div className="card-header bg-white p-4 border-0">
                                            <h2 className="fw-bold mb-0 h4">My Project Assignments</h2>
                                        </div>
                                        <div className="card-body p-4">
                                            {loading.myAlloc ? renderLoading() : error.myAlloc ? renderError(error.myAlloc) :
                                                (!myAllocation || (Array.isArray(myAllocation) && myAllocation.length === 0)) ? (
                                                    <div className="text-center py-5">
                                                        <i className="bi bi-briefcase display-1 text-muted opacity-25"></i>
                                                        <h3 className="text-muted mt-3">Currently on Bench</h3>
                                                        <p className="text-muted">You are not currently allocated to any project.</p>
                                                    </div>
                                                ) : (
                                                    <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                                                        {(Array.isArray(myAllocation) ? myAllocation : [myAllocation]).map((alloc, idx) => (
                                                            <div key={idx} className="col">
                                                                <div className="card h-100 shadow-sm border-0" style={{ borderRadius: '15px', borderTop: '4px solid var(--color-accent)' }}>
                                                                    <div className="card-body p-4">
                                                                        <h5 className="fw-bold text-accent mb-2">{alloc.projectName}</h5>
                                                                        <div className="mb-3">
                                                                            <span className={`badge rounded-pill px-3 py-2 ${alloc.assignmentStatus === 'ACTIVE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                                                {alloc.assignmentStatus}
                                                                            </span>
                                                                        </div>
                                                                        <div className="small text-muted">
                                                                            <p className="mb-1"><strong>Billing:</strong> {alloc.billingType || 'N/A'}</p>
                                                                            <p className="mb-1"><strong>Start:</strong> {alloc.startDate ? new Date(alloc.startDate).toLocaleDateString() : 'N/A'}</p>
                                                                            <p className="mb-0"><strong>End:</strong> {alloc.endDate ? new Date(alloc.endDate).toLocaleDateString() : 'Ongoing'}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* MY UTILIZATION */}
                                {activeSection === 'my_utilization' && (
                                    <div className="card shadow-sm border-0 p-4 rounded-4">
                                        {loading.myUtil ? renderLoading() : error.myUtil ? renderError(error.myUtil) : (
                                            <div className="row g-4">
                                                <div className="col-lg-4 text-center border-end">
                                                    <div className="py-3">
                                                        <div className="utilization-disk mx-auto mb-4 p-4" style={{
                                                            width: '200px',
                                                            height: '200px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            backgroundColor: 'var(--color-bg)',
                                                            border: '12px solid var(--color-accent)',
                                                            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                                        }}>
                                                            <span className="display-4 fw-bold text-accent">
                                                                {myUtilization?.totalUtilization || 0}%
                                                            </span>
                                                        </div>
                                                        <h3 className="fw-bold text-dark mt-3">{myUtilization?.allocationStatus || 'BENCH'}</h3>
                                                        <p className="text-muted small">Your total utilization based on active project assignments.</p>
                                                    </div>
                                                </div>
                                                <div className="col-lg-8">
                                                    {myUtilization?.assignments && myUtilization.assignments.length > 0 ? (
                                                        <div>
                                                            <h5 className="fw-bold mb-3 text-muted text-uppercase small">Active Allocations</h5>
                                                            <div className="table-responsive">
                                                                <table className="table table-hover align-middle mb-0">
                                                                    <thead className="table-light">
                                                                        <tr>
                                                                            <th className="py-2 ps-3">Project</th>
                                                                            <th className="py-2">Allocation</th>
                                                                            <th className="py-2">Start Date</th>
                                                                            <th className="py-2 pe-3 text-end">Type</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {myUtilization.assignments.map((assign, idx) => (
                                                                            <tr key={idx}>
                                                                                <td className="ps-3 fw-bold text-accent">{assign.projectName}</td>
                                                                                <td>
                                                                                    <div className="d-flex align-items-center">
                                                                                        <div className="progress flex-grow-1" style={{ height: '6px', maxWidth: '80px' }}>
                                                                                            <div className="progress-bar bg-accent" style={{ width: `${assign.allocationPercent}%` }}></div>
                                                                                        </div>
                                                                                        <span className="ms-2 small fw-bold">{assign.allocationPercent}%</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="small text-muted">{new Date(assign.startDate).toLocaleDateString()}</td>
                                                                                <td className="pe-3 text-end">
                                                                                    <span className={`badge rounded-pill px-2 py-1 small ${assign.billingType === 'BILLABLE' ? 'bg-success' : 'bg-secondary'}`}>
                                                                                        {assign.billingType || 'N/A'}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-5 text-muted">
                                                            <i className="bi bi-pie-chart display-4 opacity-25"></i>
                                                            <p className="mt-3">No active allocations at this time.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* MY PROFILE */}
                                {activeSection === 'my_profile' && (
                                    <ProfileSection profile={profile} utilization={myUtilization} />
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
