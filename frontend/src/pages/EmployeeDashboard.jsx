import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { allocationsApi } from '../api/allocations';
import ProfileSection from '../components/ProfileSection';
import Sidebar from '../components/Sidebar';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [activeSection, setActiveSection] = useState('overview');

    // Section States
    // Section States
    const [skills, setSkills] = useState([]);
    const [allocation, setAllocation] = useState(null);
    const [utilization, setUtilization] = useState(null);
    const [profile, setProfile] = useState(null);

    // New Skill Form State
    const [newSkill, setNewSkill] = useState({ skillName: '', proficiencyLevel: 'BEGINNER' });
    const [editingSkill, setEditingSkill] = useState(null); // Track skill being edited
    const [addingSkill, setAddingSkill] = useState(false);
    const [addSkillError, setAddSkillError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedSkillLevel, setSelectedSkillLevel] = useState('BEGINNER'); // Tab state

    // Allocation States
    const [availableProjects, setAvailableProjects] = useState([]);
    const [requestingAlloc, setRequestingAlloc] = useState(false);
    const [requestAllocError, setRequestAllocError] = useState(null);
    const [selectedProject, setSelectedProject] = useState('');
    const [myRequests, setMyRequests] = useState([]); // New state for tracking requests

    // Loading & Error States
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [loadingAlloc, setLoadingAlloc] = useState(true);
    const [loadingUtil, setLoadingUtil] = useState(true);
    const [errorSkills, setErrorSkills] = useState(null);
    const [errorAlloc, setErrorAlloc] = useState(null);
    const [errorUtil, setErrorUtil] = useState(null);

    // Employee menu items for sidebar
    const employeeMenuItems = [
        { id: 'overview', label: 'Dashboard', icon: 'bi-speedometer2' },
        { id: 'skills', label: 'My Skills', icon: 'bi-star' },
        { id: 'allocation', label: 'Allocation', icon: 'bi-diagram-3' },
        { id: 'utilization', label: 'Utilization', icon: 'bi-graph-up' },
        { id: 'profile', label: 'My Profile', icon: 'bi-person-circle' }
    ];

    useEffect(() => {
        fetchSkills();
        fetchAllocation();
        fetchMyRequests(); // Fetch pending requests
        fetchUtilization();
        fetchAvailableProjects();
        fetchCatalog();
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/users/me');
            setProfile(response.data);
        } catch (err) {
            console.error('Failed to load profile', err);
        }
    };

    const [catalogSkills, setCatalogSkills] = useState([]);
    const fetchCatalog = async () => {
        try {
            const response = await api.get('/catalog/skills');
            setCatalogSkills(response.data);
        } catch (err) {
            console.error('Failed to load catalog', err);
        }
    };

    const fetchSkills = async () => {
        setLoadingSkills(true);
        try {
            const response = await api.get('/skills/my');
            setSkills(response.data);
            setErrorSkills(null);
        } catch (err) {
            setErrorSkills('Failed to load skills.');
            console.error(err);
        } finally {
            setLoadingSkills(false);
        }
    };

    const fetchAllocation = async () => {
        setLoadingAlloc(true);
        try {
            const response = await api.get('/assignments/my');
            setAllocation(response.data);
            setErrorAlloc(null);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 404) {
                setAllocation([]);
            } else {
                setErrorAlloc('Failed to load project details.');
                setAllocation([]);
            }
        } finally {
            setLoadingAlloc(false);
        }
    };

    const fetchMyRequests = async () => {
        try {
            const response = await allocationsApi.getMyRequests();
            setMyRequests(response.data);
        } catch (err) {
            console.error('Failed to load my requests', err);
        }
    };

    const fetchAvailableProjects = async () => {
        try {
            const response = await api.get('/projects/active');
            setAvailableProjects(response.data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
        }
    };

    const fetchUtilization = async () => {
        setLoadingUtil(true);
        try {
            const response = await api.get('/utilization/me');
            setUtilization(response.data);
            setErrorUtil(null);
        } catch (err) {
            setErrorUtil('Failed to load utilization.');
            console.error(err);
        } finally {
            setLoadingUtil(false);
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();

        // Client-side uniqueness check
        const isDuplicate = skills.some(s => s.skillName.toLowerCase() === newSkill.skillName.toLowerCase());
        if (isDuplicate) {
            setAddSkillError(`You already have "${newSkill.skillName}" in your list.`);
            return;
        }

        setAddingSkill(true);
        setAddSkillError(null);
        setSuccessMessage(null);
        try {
            await api.post('/skills', newSkill);
            setNewSkill({ skillName: '', proficiencyLevel: 'BEGINNER' });
            setSuccessMessage('Skill added successfully!');
            fetchSkills(); // Refresh the list
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setAddSkillError(err.response?.data?.message || 'Failed to add skill.');
            console.error(err);
        } finally {
            setAddingSkill(false);
        }
    };

    const handleUpdateSkill = async (e) => {
        e.preventDefault();
        setAddingSkill(true);
        setAddSkillError(null);
        setSuccessMessage(null);
        try {
            await api.put(`/skills/${editingSkill.id}`, {
                skillName: editingSkill.skillName,
                proficiencyLevel: editingSkill.proficiencyLevel
            });
            setSuccessMessage('Skill updated successfully! (Status reset to PENDING)');
            setEditingSkill(null);
            fetchSkills();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setAddSkillError(err.response?.data?.message || 'Failed to update skill.');
        } finally {
            setAddingSkill(false);
        }
    };

    const handleDeleteSkill = async (id) => {
        if (!window.confirm('Are you sure you want to delete this skill?')) return;
        setAddSkillError(null);
        setSuccessMessage(null);
        try {
            await api.delete(`/skills/${id}`);
            setSuccessMessage('Skill deleted successfully.');
            fetchSkills();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setAddSkillError(err.response?.data?.message || 'Failed to delete skill.');
            console.error('Failed to delete skill', err);
        }
    };

    const handleRequestAllocation = async (e) => {
        e.preventDefault();
        if (!selectedProject) return;
        setRequestingAlloc(true);
        setRequestAllocError(null);
        try {
            await allocationsApi.createRequest(selectedProject); // Use new API
            setSelectedProject('');
            fetchMyRequests(); // Refresh requests list
            alert('Request submitted to Manager for approval.');
        } catch (err) {
            setRequestAllocError(err.response?.data?.message || err.response?.data?.error || 'Failed to request allocation.');
            console.error(err);
        } finally {
            setRequestingAlloc(false);
        }
    };

    const renderOverview = () => {
        // Calculate metrics directly from allocation state for consistency
        const activeAssignments = Array.isArray(allocation)
            ? allocation.filter(a => a.assignmentStatus === 'ACTIVE')
            : [];

        const projectCount = activeAssignments.length;
        const totalUtilization = activeAssignments.reduce((sum, a) => sum + (a.allocationPercent || 0), 0);

        return (
            <div className="row g-3 g-md-4">
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm border-0 border-top-primary">
                        <div className="card-body p-3 p-md-4 text-center d-flex flex-column">
                            <i className="bi bi-person-badge h1 text-accent mb-2"></i>
                            <h5 className="card-title fw-bold">My Skills</h5>
                            <div className="mb-3">
                                <p className="h2 fw-bold text-accent mb-0">{skills.filter(s => s.status === 'APPROVED').length}</p>
                            </div>
                            <div className="mt-auto">
                                <button className="btn btn-outline-accent btn-sm px-4" onClick={() => setActiveSection('skills')}>Manage</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm border-0 border-top-primary">
                        <div className="card-body p-4 text-center d-flex flex-column">
                            <i className="bi bi-briefcase display-4 text-accent mb-3"></i>
                            <h5 className="card-title fw-bold">Assignments</h5>
                            <div className="mb-3">
                                <p className="h2 fw-bold text-accent mb-0">{projectCount}</p>
                            </div>
                            <div className="mt-auto">
                                <button className="btn btn-outline-accent btn-sm mt-3" onClick={() => setActiveSection('utilization')}>View Details</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card h-100 shadow-sm border-0 border-top-primary">
                        <div className="card-body p-3 p-md-4 text-center d-flex flex-column">
                            <i className="bi bi-graph-up h1 text-accent mb-2"></i>
                            <h5 className="card-title fw-bold">Utilization</h5>
                            <p className="display-6 fw-bold text-accent mt-3 mb-3">
                                {totalUtilization}%
                            </p>
                            <div className="mt-auto">
                                <button className="btn btn-outline-accent btn-sm mt-2" onClick={() => setActiveSection('utilization')}>Detailed Stats</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSkills = () => {
        const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
        const groupedSkills = levels.reduce((acc, level) => {
            acc[level] = skills.filter(s => s.proficiencyLevel === level);
            return acc;
        }, {});

        return (
            <div>
                <div className="row g-4 h-100">
                    <div className="col-lg-4 h-100">
                        <div id="skill-form-container" className="card shadow-sm border-0 p-4 sticky-top scrollable-form" style={{ top: '0', zIndex: 1, backgroundColor: '#fff', borderLeft: '5px solid var(--color-accent)', maxHeight: '100%', overflowY: 'auto' }}>
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
                                {addSkillError && <div className="alert alert-danger p-2 small mb-3">{addSkillError}</div>}
                                {successMessage && <div className="alert alert-success p-2 small mb-3">{successMessage}</div>}
                                <div className="d-flex gap-2">
                                    <button type="submit" className={`btn btn-accent w-100 fw-bold py-2 ${editingSkill ? 'btn-info text-white' : ''}`} disabled={addingSkill}>
                                        {addingSkill ? 'Processing...' : editingSkill ? 'Update Skill' : 'Add Skill'}
                                    </button>
                                    {editingSkill && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary w-50 fw-bold"
                                            onClick={() => {
                                                setEditingSkill(null);
                                                setAddSkillError(null);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="col-lg-8">
                        {/* Tab Navigation */}
                        <div className="nav nav-pills mb-4 bg-white p-2 rounded-4 shadow-sm d-flex justify-content-between gap-2">
                            {levels.map(level => (
                                <button
                                    key={level}
                                    className={`nav-link flex-grow-1 fw-bold rounded-pill py-2 transition-all ${selectedSkillLevel === level ? 'active-accent text-white' : 'text-muted hover-light'}`}
                                    onClick={() => setSelectedSkillLevel(level)}
                                >
                                    {level}
                                    <span className={`ms-2 badge rounded-pill ${selectedSkillLevel === level ? 'bg-white text-dark' : 'bg-light text-muted'}`}>
                                        {groupedSkills[level]?.length || 0}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {loadingSkills ? (
                            <div className="card shadow-sm border-0 p-5 text-center">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted">Loading your skills...</p>
                            </div>
                        ) : errorSkills ? (
                            <div className="alert alert-warning">{errorSkills}</div>
                        ) : (
                            <div className="animate-fade-in">
                                <div className="card shadow-sm border-0 overflow-hidden rounded-4">
                                    <div className="card-header py-3 px-4 border-0 d-flex justify-content-between align-items-center bg-accent-header">
                                        <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                            <i className={`bi ${selectedSkillLevel === 'ADVANCED' ? 'bi-award-fill' : selectedSkillLevel === 'INTERMEDIATE' ? 'bi-shield-check' : 'bi-speedometer'}`}></i>
                                            {selectedSkillLevel} Skills
                                        </h5>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="table-responsive scrollable-table-container" style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
                                            <table className="table table-hover align-middle mb-0">
                                                <thead className="table-light small text-uppercase fw-bold text-muted sticky-top" style={{ zIndex: 5, background: '#f8f9fa' }}>
                                                    <tr>
                                                        <th className="px-4 py-3">Skill Name</th>
                                                        <th className="px-4 py-3 text-center">Status</th>
                                                        <th className="px-4 py-3 text-end">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {groupedSkills[selectedSkillLevel] && groupedSkills[selectedSkillLevel].length > 0 ? (
                                                        groupedSkills[selectedSkillLevel].map((skill) => (
                                                            <tr key={skill.id} className={editingSkill?.id === skill.id ? 'table-info' : ''}>
                                                                <td className="px-4 py-3">
                                                                    <div className="fw-bold text-dark">{skill.skillName}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <span className={`badge px-3 py-2 rounded-pill ${skill.status === 'APPROVED' ? 'bg-success' :
                                                                        skill.status === 'PENDING' ? 'bg-secondary' : 'bg-danger'
                                                                        }`} style={{ minWidth: '90px', letterSpacing: '0.5px' }}>
                                                                        {skill.status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 text-end">
                                                                    <button
                                                                        className="btn btn-sm btn-outline-accent rounded-pill px-4 shadow-sm"
                                                                        onClick={() => {
                                                                            setEditingSkill(skill);
                                                                            setAddSkillError(null);
                                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                        }}
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
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderAllocation = () => (
        <div className="py-2">
            {loadingAlloc ? (
                <div className="text-center py-4">
                    <div className="spinner-border text-accent" role="status"></div>
                </div>
            ) : errorAlloc ? (
                <div className="alert alert-danger">{errorAlloc}</div>
            ) : (!allocation || (Array.isArray(allocation) && allocation.length === 0)) ? (
                <div className="row justify-content-center g-3">
                    <div className="col-md-6">
                        <div className="text-center mb-4">
                            <i className="bi bi-briefcase h1 text-muted opacity-25"></i>
                            <h3 className="text-muted">Currently on Bench</h3>
                            <p className="small text-muted mb-0">
                                Select a project to request an allocation.
                            </p>
                        </div>

                        <div className="card shadow-sm border-0 p-4 bg-light">
                            <h4 className="fw-bold mb-3 text-center">Request Allocation</h4>

                            {myRequests.some(r => r.requestStatus.startsWith('PENDING')) && (
                                <div className="alert alert-info border-info text-dark mb-4">
                                    <h6 className="fw-bold">
                                        <i className="bi bi-info-circle-fill me-2"></i>
                                        Pending Request
                                    </h6>
                                    {myRequests
                                        .filter(r => r.requestStatus.startsWith('PENDING'))
                                        .map(req => (
                                            <div key={req.assignmentId}>
                                                <p className="mb-1">
                                                    You have requested allocation for{' '}
                                                    <strong>{req.projectName}</strong>.
                                                </p>
                                                <span className="badge bg-accent">
                                                    {req.requestStatus === 'PENDING_MANAGER'
                                                        ? 'Waiting for Manager Review'
                                                        : req.requestStatus === 'PENDING_HR'
                                                            ? 'Waiting for HR Approval'
                                                            : req.requestStatus}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {myRequests.some(r => r.requestStatus === 'REJECTED') && (
                                <div className="alert alert-danger border-danger mb-4">
                                    <h6 className="fw-bold">
                                        <i className="bi bi-x-circle-fill me-2"></i>
                                        Request Rejected
                                    </h6>
                                    {myRequests
                                        .filter(r => r.requestStatus === 'REJECTED')
                                        .map(req => (
                                            <div
                                                key={req.assignmentId}
                                                className="mb-2 border-bottom border-danger-subtle pb-2"
                                            >
                                                <p className="mb-1">
                                                    Request for <strong>{req.projectName}</strong> was rejected.
                                                </p>
                                                <small>Please contact your manager for details.</small>
                                            </div>
                                        ))}
                                </div>
                            )}

                            <form onSubmit={handleRequestAllocation}>
                                <div className="mb-3">
                                    <select
                                        className="form-select shadow-none border-2"
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        required
                                        disabled={myRequests.some(r =>
                                            r.requestStatus.startsWith('PENDING')
                                        )}
                                    >
                                        <option value="">-- Choose a Project --</option>
                                        {availableProjects.map(proj => (
                                            <option key={proj.id} value={proj.id}>
                                                {proj.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {requestAllocError && (
                                    <div className="alert alert-danger p-2 small mb-3">
                                        {requestAllocError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-accent w-100 py-2 shadow-sm"
                                    disabled={
                                        requestingAlloc ||
                                        !selectedProject ||
                                        myRequests.some(r =>
                                            r.requestStatus.startsWith('PENDING')
                                        )
                                    }
                                >
                                    {requestingAlloc ? 'Submitting...' : 'Send Request'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="row justify-content-center g-4">
                    {(Array.isArray(allocation) ? allocation : [allocation]).map(alloc => (
                        <div key={alloc.assignmentId || alloc.id || Math.random()} className="col-md-10 col-lg-8">
                            <div
                                className={`card border-2 shadow-sm rounded-4 overflow-hidden ${alloc.assignmentStatus === 'PENDING'
                                    ? 'border-warning'
                                    : 'border-accent'
                                    }`}
                            >
                                <div
                                    className={`card-header text-white p-3 text-center border-0 ${alloc.assignmentStatus === 'PENDING'
                                        ? 'bg-warning text-dark'
                                        : 'bg-accent'
                                        }`}
                                >
                                    <h4 className="mb-0">Project Details</h4>
                                </div>

                                <div className="card-body p-3 p-md-4 text-center">
                                    <div className="mb-3">
                                        <span
                                            className={`badge rounded-pill px-4 py-2 fs-6 ${alloc.assignmentStatus === 'ACTIVE'
                                                ? 'bg-success'
                                                : alloc.assignmentStatus === 'PENDING'
                                                    ? 'bg-warning text-dark'
                                                    : 'bg-secondary'
                                                }`}
                                        >
                                            {alloc.assignmentStatus}
                                        </span>
                                    </div>

                                    <div className="border-top pt-3">
                                        <p className="text-muted small text-uppercase fw-bold mb-1">
                                            Current Status
                                        </p>
                                        <p className="h4 mb-0">
                                            {alloc.assignmentStatus === 'ACTIVE'
                                                ? 'Allocated to Project'
                                                : 'Awaiting Approval'}
                                        </p>
                                    </div>

                                    {alloc.assignmentStatus === 'ACTIVE' && (
                                        <div className="mt-4 pt-3 border-top">
                                            <h5 className="fw-bold text-accent mb-3">{alloc.projectName}</h5>
                                            <div className="row g-2 justify-content-center">
                                                <div className="col-6">
                                                    <div className="p-2 bg-light rounded-3">
                                                        <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Billing</small>
                                                        <span className="fw-bold text-dark">{alloc.billingType || 'Billable'}</span>
                                                    </div>
                                                </div>
                                                <div className="col-6">
                                                    <div className="p-2 bg-light rounded-3">
                                                        <small className="text-muted d-block text-uppercase fw-bold" style={{ fontSize: '0.7rem' }}>Allocation</small>
                                                        <span className="fw-bold text-dark">{alloc.allocationPercent || '100'}%</span>
                                                    </div>
                                                </div>
                                                {(alloc.startDate || alloc.endDate) && (
                                                    <div className="col-12 mt-2">
                                                        <div className="small text-muted">
                                                            <i className="bi bi-calendar-event me-1"></i>
                                                            {alloc.startDate ? new Date(alloc.startDate).toLocaleDateString() : 'Start'}
                                                            {' - '}
                                                            {alloc.endDate ? new Date(alloc.endDate).toLocaleDateString() : 'Present'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderUtilization = () => (
        <div className="card shadow-sm border-0 p-4">
            <h2 className="fw-bold mb-4">Utilization Overview</h2>
            {loadingUtil ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            ) : errorUtil ? (
                <div className="alert alert-danger">{errorUtil}</div>
            ) : (
                <div className="row g-4">
                    {/* Left Column: Chart & Summary */}
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
                                    {utilization?.totalUtilization || 0}%
                                </span>
                            </div>
                            <h3 className="fw-bold text-dark mt-3">{utilization?.allocationStatus || 'BENCH'}</h3>
                            <p className="text-muted small mx-auto" style={{ maxWidth: '300px' }}>
                                Your total utilization based on active project assignments.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Allocation Details */}
                    <div className="col-lg-8">
                        {utilization?.assignments && utilization.assignments.length > 0 ? (
                            <div className="h-100">
                                <h5 className="fw-bold mb-3 text-muted text-uppercase small">Active Allocations</h5>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="py-2 ps-3">Project</th>
                                                <th className="py-2">Allocation</th>
                                                <th className="py-2">Dates</th>
                                                <th className="py-2 pe-3 text-end">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {utilization.assignments.map((assign, idx) => (
                                                <tr key={idx}>
                                                    <td className="ps-3 fw-bold text-accent">{assign.projectName}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="progress flex-grow-1" style={{ height: '6px', maxWidth: '80px' }}>
                                                                <div
                                                                    className="progress-bar bg-accent"
                                                                    role="progressbar"
                                                                    style={{ width: `${assign.allocationPercent}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="ms-2 small fw-bold">{assign.allocationPercent}%</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="small text-muted">
                                                            {new Date(assign.startDate).toLocaleDateString()}
                                                        </div>
                                                    </td>
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
                            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted border rounded bg-light p-4">
                                <i className="bi bi-clipboard-x display-4 mb-3 opacity-25"></i>
                                <p>No active project allocations found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <div className="container-fluid p-0 overflow-hidden" style={{ height: 'calc(100vh - 65px)', width: '100%' }}>
                <div className="row g-0 h-100">
                    {/* SIDEBAR */}
                    <Sidebar
                        title="Menu"
                        menuItems={employeeMenuItems}
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                    />

                    {/* MAIN CONTENT AREA */}
                    <main role="main" id="main-content" className="col h-100 p-4 p-md-5" style={{ backgroundColor: 'var(--color-bg)', overflowY: 'auto', scrollbarGutter: 'stable' }}>
                        <div className="max-width-xl mx-auto">
                            <div className="page-header mb-4">
                                {activeSection === 'overview' && (
                                    <h4 className="text-muted mb-1">Welcome back, {user?.sub?.split('@')[0]}</h4>
                                )}
                                <h1 className="page-title fw-bold text-accent">
                                    {activeSection === 'overview' && 'Dashboard Overview'}
                                    {activeSection === 'skills' && 'Skill Management'}
                                    {activeSection === 'allocation' && 'My Projects'}
                                    {activeSection === 'utilization' && 'Personal Utilization'}
                                    {activeSection === 'profile' && 'My Profile'}
                                </h1>
                            </div>

                            <div className="animate-fade-in">
                                {activeSection === 'overview' && renderOverview()}
                                {activeSection === 'skills' && renderSkills()}
                                {activeSection === 'allocation' && renderAllocation()}
                                {activeSection === 'utilization' && renderUtilization()}
                                {activeSection === 'profile' && (
                                    <div style={{
                                        '--profile-theme-color': 'var(--color-primary)',
                                        '--profile-theme-dark': '#802d00',
                                        '--profile-theme-rgb': '181, 64, 0'
                                    }}>
                                        <ProfileSection
                                            profile={profile}
                                            utilization={utilization}
                                            onNavigateToSkills={() => setActiveSection('skills')}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <style>{`
                .nav-link {
                    transition: none; /* Disable transition to prevent shaking during state changes */
                    border-radius: 8px !important;
                    font-weight: 500;
                    box-sizing: border-box;
                    border: 1px solid transparent; /* Reserve space for active border */
                    height: 48px;
                }
                .sidebar.transition-width {
                    transition: width 0.3s ease, flex-basis 0.3s ease;
                }
                .sidebar-collapsed {
                    width: 70px !important;
                }
                .nav-link:hover:not(.active) {
                    background-color: rgba(181, 64, 0, 0.1);
                    border: 1px solid var(--color-primary);
                    color: var(--color-primary) !important;
                }
                .bg-accent {
                    background-color: var(--color-primary) !important;
                    color: white;
                }
                .border-accent {
                    border-color: var(--color-primary) !important;
                }
                .border-top-primary {
                    border-top: 4px solid var(--color-primary) !important;
                }
                .text-accent {
                    color: var(--color-primary) !important;
                }
                .btn-outline-accent {
                    color: var(--color-primary);
                    border-color: var(--color-primary);
                }
                .btn-outline-accent:hover {
                    background-color: var(--color-primary);
                    color: white;
                }
                .nav-link.sidebar-link.active {
                    background-color: var(--color-primary) !important;
                    color: #fff !important;
                }
                .spinner-border.text-primary {
                    color: var(--color-primary) !important;
                }
                .text-accent {
                    color: var(--color-primary);
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .max-width-xl {
                    max-width: 1200px;
                }
                .sidebar-container {
                    width: 280px;
                    flex-shrink: 0;
                    background-color: #fff;
                    border-right: 1px solid #eee;
                    overflow-y: auto;
                }
                .main-content-area {
                    flex-grow: 1;
                    min-width: 0; /* Important for flex-child overflow */
                }
                .scrollable-table-container::-webkit-scrollbar,
                .scrollable-form::-webkit-scrollbar {
                    width: 6px;
                }
                .scrollable-table-container::-webkit-scrollbar-track,
                .scrollable-form::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                .scrollable-table-container::-webkit-scrollbar-thumb,
                .scrollable-form::-webkit-scrollbar-thumb {
                    background: #ccc;
                    border-radius: 10px;
                }
                .scrollable-table-container::-webkit-scrollbar-thumb:hover,
                .scrollable-form::-webkit-scrollbar-thumb:hover {
                    background: var(--color-accent);
                }
                .nav-link.active-accent {
                    background-color: rgba(181, 64, 0, 0.12) !important;
                    color: var(--color-accent) !important;
                    border: 1px solid var(--color-accent) !important;
                }
                .bg-accent-header {
                    background-color: rgba(181, 64, 0, 0.08) !important;
                    color: var(--color-accent) !important;
                    border-bottom: 1px solid rgba(181, 64, 0, 0.15);
                }
                .bg-accent-header h5 {
                    color: var(--color-accent) !important;
                }
                .nav-link i {
                    font-size: 1.25rem;
                }
            `}</style>
        </>
    );
};

export default EmployeeDashboard;
