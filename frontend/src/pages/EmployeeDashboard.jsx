import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import ProfileSection from '../components/ProfileSection';

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

    // Allocation States
    const [availableProjects, setAvailableProjects] = useState([]);
    const [requestingAlloc, setRequestingAlloc] = useState(false);
    const [requestAllocError, setRequestAllocError] = useState(null);
    const [selectedProject, setSelectedProject] = useState('');

    // Loading & Error States
    const [loadingSkills, setLoadingSkills] = useState(true);
    const [loadingAlloc, setLoadingAlloc] = useState(true);
    const [loadingUtil, setLoadingUtil] = useState(true);
    const [errorSkills, setErrorSkills] = useState(null);
    const [errorAlloc, setErrorAlloc] = useState(null);
    const [errorUtil, setErrorUtil] = useState(null);

    useEffect(() => {
        fetchSkills();
        fetchAllocation();
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
            // Note: 404 is expected if on bench
            if (err.response?.status === 404) {
                setAllocation(null);
            } else {
                setErrorAlloc('Failed to load allocation.');
            }
            console.error(err);
        } finally {
            setLoadingAlloc(false);
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
            await api.post('/allocation-requests', { projectId: selectedProject });
            setSelectedProject('');
            fetchAllocation();
        } catch (err) {
            setRequestAllocError(err.response?.data?.message || 'Failed to request allocation.');
            console.error(err);
        } finally {
            setRequestingAlloc(false);
        }
    };

    const renderOverview = () => (
        <div className="row g-4">
            <div className="col-md-4">
                <div className="card h-100 shadow-sm border-0 border-top-primary">
                    <div className="card-body p-4 text-center">
                        <i className="bi bi-person-badge display-4 text-primary mb-3"></i>
                        <h5 className="card-title fw-bold">My Skills</h5>
                        <p className="display-6 fw-bold text-accent">{skills.length}</p>
                        <button className="btn btn-outline-primary btn-sm mt-2" onClick={() => setActiveSection('skills')}>Manage Skills</button>
                    </div>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card h-100 shadow-sm border-0 border-top-primary">
                    <div className="card-body p-4 text-center">
                        <i className="bi bi-briefcase display-4 text-primary mb-3"></i>
                        <h5 className="card-title fw-bold">Assignment</h5>
                        <p className="h4 mt-3 text-muted">{allocation?.projectName || 'Bench'}</p>
                        <button className="btn btn-outline-primary btn-sm mt-2" onClick={() => setActiveSection('allocation')}>View Details</button>
                    </div>
                </div>
            </div>
            <div className="col-md-4">
                <div className="card h-100 shadow-sm border-0 border-top-primary">
                    <div className="card-body p-4 text-center">
                        <i className="bi bi-graph-up display-4 text-primary mb-3"></i>
                        <h5 className="card-title fw-bold">Utilization</h5>
                        <p className="display-6 fw-bold text-accent">
                            {utilization?.allocationStatus === 'BILLABLE' ? '100%' : utilization?.allocationStatus === 'INVESTMENT' ? '100%' : '0%'}
                        </p>
                        <button className="btn btn-outline-primary btn-sm mt-2" onClick={() => setActiveSection('utilization')}>Detailed Stats</button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSkills = () => {
        const levels = ['ADVANCED', 'INTERMEDIATE', 'BEGINNER'];
        const groupedSkills = levels.reduce((acc, level) => {
            acc[level] = skills.filter(s => s.proficiencyLevel === level);
            return acc;
        }, {});

        return (
            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold">My Personal Skills</h2>
                </div>

                <div className="row g-4">
                    <div className="col-lg-4">
                        <div id="skill-form-container" className="card shadow-sm border-0 p-4 sticky-top" style={{ top: '100px', zIndex: 1, backgroundColor: '#fff', borderLeft: '5px solid var(--color-accent)' }}>
                            <h4 className="fw-bold mb-3">{editingSkill ? 'Edit Skill' : 'Add New Skill'}</h4>
                            <form onSubmit={editingSkill ? handleUpdateSkill : handleAddSkill}>
                                <div className="mb-3">
                                    <label className="form-label small text-muted text-uppercase fw-bold">Skill Name</label>
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
                        {loadingSkills ? (
                            <div className="card shadow-sm border-0 p-5 text-center">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted">Loading your skills...</p>
                            </div>
                        ) : errorSkills ? (
                            <div className="alert alert-warning">{errorSkills}</div>
                        ) : skills.length === 0 ? (
                            <div className="card shadow-sm border-0 p-5 text-center">
                                <p className="text-muted italic mb-0">You haven't added any skills yet.</p>
                            </div>
                        ) : (
                            <div className="d-flex flex-column gap-4">
                                {levels.map(level => (
                                    groupedSkills[level].length > 0 && (
                                        <div key={level} className="card shadow-sm border-0 overflow-hidden rounded-4">
                                            <div className={`card-header py-3 px-4 border-0 d-flex justify-content-between align-items-center ${level === 'ADVANCED' ? 'bg-success text-white' :
                                                level === 'INTERMEDIATE' ? 'bg-info text-dark' : 'bg-secondary text-white'
                                                }`}>
                                                <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                                    <i className={`bi ${level === 'ADVANCED' ? 'bi-award-fill' : level === 'INTERMEDIATE' ? 'bi-shield-check' : 'bi-speedometer'}`}></i>
                                                    {level}
                                                </h5>
                                                <span className="badge bg-white text-dark rounded-pill px-3">{groupedSkills[level].length}</span>
                                            </div>
                                            <div className="card-body p-0">
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle mb-0">
                                                        <thead className="table-light small text-uppercase fw-bold text-muted">
                                                            <tr>
                                                                <th className="px-4 py-3">Skill Definition</th>
                                                                <th className="px-4 py-3 text-center">Verification</th>
                                                                <th className="px-4 py-3 text-end">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {groupedSkills[level].map((skill) => (
                                                                <tr key={skill.id} className={editingSkill?.id === skill.id ? 'table-info' : ''}>
                                                                    <td className="px-4 py-3">
                                                                        <div className="fw-bold fs-5 text-dark">{skill.skillName}</div>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <span className={`badge px-3 py-2 rounded-pill ${skill.status === 'APPROVED' ? 'bg-success' :
                                                                            skill.status === 'PENDING' ? 'bg-secondary' : 'bg-danger'
                                                                            }`} style={{ fontSize: '0.75rem', minWidth: '90px', letterSpacing: '0.5px' }}>
                                                                            {skill.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-end">
                                                                        <div className="d-flex justify-content-end gap-2">
                                                                            <button
                                                                                className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm"
                                                                                onClick={() => {
                                                                                    setEditingSkill(skill);
                                                                                    setAddSkillError(null);
                                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                                }}
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            {skill.status === 'PENDING' && (
                                                                                <button
                                                                                    className="btn btn-sm btn-danger rounded-pill px-3 shadow-sm"
                                                                                    onClick={() => handleDeleteSkill(skill.id)}
                                                                                >
                                                                                    Delete
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderAllocation = () => (
        <div className="card shadow-sm border-0 p-4">
            <h2 className="fw-bold mb-4 text-center">Project Assignment</h2>
            {loadingAlloc ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                </div>
            ) : errorAlloc ? (
                <div className="alert alert-danger">{errorAlloc}</div>
            ) : (!allocation || allocation.assignmentStatus === 'ENDED' || allocation.assignmentStatus === 'REJECTED') ? (
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <div className="text-center mb-5">
                            <div className="display-4 text-muted mb-3 opacity-25">
                                <i className="bi bi-briefcase"></i>
                            </div>
                            <h3 className="text-muted">Currently on Bench</h3>
                            {allocation?.assignmentStatus === 'REJECTED' && (
                                <div className="alert alert-warning small mt-2">Your previous request was not approved.</div>
                            )}
                            <p className="lead">Select a project below to request an allocation.</p>
                        </div>

                        <div className="card shadow-sm border-0 p-4 bg-light">
                            <h4 className="fw-bold mb-3 text-center">Request Allocation</h4>
                            <form onSubmit={handleRequestAllocation}>
                                <div className="mb-4">
                                    <label className="form-label small text-muted text-uppercase fw-bold">Select Project</label>
                                    <select
                                        className="form-select shadow-none border-2"
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Choose a Project --</option>
                                        {availableProjects.map(proj => (
                                            <option key={proj.id} value={proj.id}>{proj.name}</option>
                                        ))}
                                    </select>
                                </div>
                                {requestAllocError && <div className="alert alert-danger p-2 small mb-3">{requestAllocError}</div>}
                                <button type="submit" className="btn btn-accent w-100 py-2 shadow-sm" disabled={requestingAlloc || !selectedProject}>
                                    {requestingAlloc ? 'Submitting...' : 'Send Request'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="row justify-content-center">
                    <div className="col-md-8">
                        <div className={`card border-2 shadow-sm rounded-4 overflow-hidden ${allocation.assignmentStatus === 'PENDING' ? 'border-warning' : 'border-primary'}`}>
                            <div className={`card-header text-white p-4 text-center border-0 ${allocation.assignmentStatus === 'PENDING' ? 'bg-warning text-dark' : 'bg-primary'}`}>
                                <h3 className="mb-0">Project Details</h3>
                            </div>
                            <div className="card-body p-4 text-center">
                                <div className="mb-4">
                                    <span className={`badge rounded-pill px-4 py-2 fs-6 ${allocation.assignmentStatus === 'ACTIVE' ? 'bg-success' :
                                        allocation.assignmentStatus === 'PENDING' ? 'bg-warning text-dark' : 'bg-secondary'
                                        }`}>
                                        {allocation.assignmentStatus}
                                    </span>
                                </div>
                                <div className="row g-3">
                                    <div className="col-12 border-bottom pb-3">
                                        <p className="text-muted small text-uppercase fw-bold mb-1">Status</p>
                                        <p className="h4 mb-0">{allocation.assignmentStatus === 'ACTIVE' ? 'Allocated' : 'Awaiting Approval'}</p>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const renderUtilization = () => (
        <div className="card shadow-sm border-0 p-4 text-center">
            <h2 className="fw-bold mb-5">Utilization Overview</h2>
            {loadingUtil ? (
                <div className="spinner-border text-primary" role="status"></div>
            ) : errorUtil ? (
                <div className="alert alert-danger">{errorUtil}</div>
            ) : (
                <div className="py-5">
                    <div className="utilization-disk mx-auto mb-4" style={{
                        width: '200px',
                        height: '200px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--color-bg)',
                        border: '10px solid var(--color-primary)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}>
                        <span className="display-4 fw-bold text-accent">
                            {utilization?.allocationStatus === 'BILLABLE' ? '100%' : utilization?.allocationStatus === 'INVESTMENT' ? '100%' : '0%'}
                        </span>
                    </div>
                    <h3 className="fw-bold text-dark mt-4">{utilization?.allocationStatus || 'UNKNOWN'}</h3>
                    <p className="text-muted max-width-600 mx-auto">
                        Your utilization is calculated based on your active project assignments and their billing status.
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <div className="container-fluid p-0 overflow-hidden" style={{ minHeight: 'calc(100vh - 70px)' }}>
            <div className="row g-0">
                {/* SIDEBAR */}
                <div className="col-auto col-md-3 col-xl-2 px-sm-2 px-0 bg-white shadow-sm" style={{ borderRight: '1px solid #eee' }}>
                    <div className="d-flex flex-column align-items-center align-items-sm-start px-3 pt-4 text-white min-vh-100 sticky-top" style={{ top: '70px' }}>
                        <div className="mb-4 d-none d-sm-block">
                            <h6 className="text-muted text-uppercase small fw-bold mb-3">Menu</h6>
                        </div>
                        <ul className="nav nav-pills flex-column mb-sm-auto mb-0 align-items-center align-items-sm-start w-100" id="menu">
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('overview')}
                                    className={`nav-link align-middle px-3 py-2 w-100 text-start d-flex align-items-center gap-2 ${activeSection === 'overview' ? 'active bg-primary' : 'text-dark'}`}
                                >
                                    <i className="bi bi-speedometer2"></i>
                                    <span className="ms-1 d-none d-sm-inline">Dashboard</span>
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('skills')}
                                    className={`nav-link align-middle px-3 py-2 w-100 text-start d-flex align-items-center gap-2 ${activeSection === 'skills' ? 'active bg-primary' : 'text-dark'}`}
                                >
                                    <i className="bi bi-star"></i>
                                    <span className="ms-1 d-none d-sm-inline">My Skills</span>
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('allocation')}
                                    className={`nav-link align-middle px-3 py-2 w-100 text-start d-flex align-items-center gap-2 ${activeSection === 'allocation' ? 'active bg-primary' : 'text-dark'}`}
                                >
                                    <i className="bi bi-briefcase"></i>
                                    <span className="ms-1 d-none d-sm-inline">Allocation</span>
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('utilization')}
                                    className={`nav-link align-middle px-3 py-2 w-100 text-start d-flex align-items-center gap-2 ${activeSection === 'utilization' ? 'active bg-primary' : 'text-dark'}`}
                                >
                                    <i className="bi bi-graph-up"></i>
                                    <span className="ms-1 d-none d-sm-inline">Utilization</span>
                                </button>
                            </li>
                            <li className="nav-item w-100 mb-2">
                                <button
                                    onClick={() => setActiveSection('profile')}
                                    className={`nav-link align-middle px-3 py-2 w-100 text-start d-flex align-items-center gap-2 ${activeSection === 'profile' ? 'active bg-primary' : 'text-dark'}`}
                                >
                                    <i className="bi bi-person-circle"></i>
                                    <span className="ms-1 d-none d-sm-inline">My Profile</span>
                                </button>
                            </li>
                        </ul>
                        <div className="sidebar-footer mt-auto pb-5 d-none d-sm-block border-top w-100 pt-3">
                            <p className="small text-muted mb-1">Logged in as</p>
                            <p className="small fw-bold text-dark text-truncate mb-0">{user?.sub}</p>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="col p-4 p-md-5" style={{ backgroundColor: '#f8f9fa' }}>
                    <div className="max-width-xl mx-auto">
                        <header className="mb-4">
                            <h4 className="text-muted mb-1">
                                Welcome back, {user?.sub?.split('@')[0]}
                                {profile?.managerName && (
                                    <span className="ms-2 small text-muted">
                                        [reports to: <span className="fw-semibold text-dark">{profile.managerName}</span>]
                                    </span>
                                )}
                            </h4>
                            <h1 className="display-5 fw-bold text-dark">
                                {activeSection === 'overview' && 'Dashboard Overview'}
                                {activeSection === 'skills' && 'Skill Management'}
                                {activeSection === 'allocation' && 'My Projects'}
                                {activeSection === 'utilization' && 'Personal Utilization'}
                                {activeSection === 'profile' && 'My Profile'}
                            </h1>
                        </header>

                        <div className="animate-fade-in">
                            {activeSection === 'overview' && renderOverview()}
                            {activeSection === 'skills' && renderSkills()}
                            {activeSection === 'allocation' && renderAllocation()}
                            {activeSection === 'utilization' && renderUtilization()}
                            {activeSection === 'profile' && <ProfileSection />}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .nav-link {
                    transition: all 0.2s ease;
                    border-radius: 8px !important;
                    font-weight: 500;
                }
                .nav-link:hover:not(.active) {
                    background-color: #f0f7ff;
                    color: var(--color-accent) !important;
                }
                .border-top-primary {
                    border-top: 4px solid var(--color-primary) !important;
                }
                .text-accent {
                    color: var(--color-accent);
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
                .nav-link i {
                    font-size: 1.25rem;
                }
            `}</style>
        </div>
    );
};

export default EmployeeDashboard;
