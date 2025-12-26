import { useState, useEffect } from 'react';
import api from '../api/axios';

const ProjectManagement = () => {
    const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE', 'UPCOMING', 'COMPLETED'
    const [projects, setProjects] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        techStack: [],
        startDate: '',
        endDate: '',
        employeesRequired: 1,
        status: 'PLANNED'
    });

    const [catalogSkills, setCatalogSkills] = useState([]);

    useEffect(() => {
        fetchData();
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            const response = await api.get('/catalog/skills');
            setCatalogSkills(response.data);
        } catch (err) {
            console.error('Failed to load skill catalog', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projectsRes, employeesRes] = await Promise.all([
                api.get('/projects'),
                api.get('/users/employees')
            ]);
            setProjects(projectsRes.data);

            // Fetch utilization for each employee to get assignments
            const employeesWithUtil = await Promise.all(
                employeesRes.data.map(async (emp) => {
                    try {
                        const utilRes = await api.get(`/assignments/employee/${emp.id}/utilization`);
                        return {
                            ...emp,
                            assignments: utilRes.data.assignments || []
                        };
                    } catch {
                        return { ...emp, assignments: [] };
                    }
                })
            );
            setAllEmployees(employeesWithUtil);

        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load projects data.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await api.post('/projects', formData);
            setSuccess('Project created successfully!');
            setFormData({
                name: '',
                companyName: '',
                techStack: [],
                startDate: '',
                endDate: '',
                employeesRequired: 1,
                status: 'PLANNED'
            });
            fetchData();
            setShowAddModal(false);
        } catch (err) {
            console.error('Failed to create project:', err);
            setError(err.response?.data?.message || 'Failed to create project.');
        } finally {
            setLoading(false);
        }
    };

    const handleEndProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to end this project?')) return;

        try {
            await api.put(`/projects/${projectId}/status`, { status: 'COMPLETED' });
            setSuccess('Project ended successfully!');
            fetchData();
            setSelectedProject(null); // Close modal if open
        } catch (err) {
            console.error('Failed to end project:', err);
            setError(err.response?.data?.message || 'Failed to end project.');
        }
    };

    // Callback when card is clicked
    const handleProjectClick = (project) => {
        setSelectedProject(project);
    };

    // Filter projects based on active tab
    const getFilteredProjects = () => {
        switch (activeTab) {
            case 'UPCOMING':
                return projects.filter(p => p.status === 'PLANNED');
            case 'ACTIVE':
                return projects.filter(p => p.status === 'ACTIVE');
            case 'COMPLETED':
                return projects.filter(p => p.status === 'COMPLETED');
            default:
                return projects;
        }
    };

    const filteredProjects = getFilteredProjects();

    // Tab configuration
    const tabs = [
        { key: 'ACTIVE', label: 'Active Projects', icon: 'bi-play-circle-fill', color: 'var(--color-primary)' },
        { key: 'UPCOMING', label: 'Upcoming Projects', icon: 'bi-calendar-plus', color: 'var(--color-primary)' },
        { key: 'COMPLETED', label: 'Completed Projects', icon: 'bi-check-circle-fill', color: '#6c757d' }
    ];

    // Helper to get allocation count
    const getAllocatedCount = (projectId) => {
        return allEmployees.filter(emp =>
            emp.assignments && emp.assignments.some(a => a.projectId === projectId)
        ).length;
    };

    return (
        <div className="container-fluid px-0">
            {/* Success/Error Messages */}
            {success && (
                <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i> {success}
                    <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
                </div>
            )}

            {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="mb-4">
                <div className="d-flex gap-2 flex-wrap align-items-center justify-content-between">
                    <div className="btn-group" role="group">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                className={`btn btn-lg ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setActiveTab(tab.key)}
                                style={activeTab === tab.key ? {
                                    backgroundColor: tab.color,
                                    borderColor: tab.color,
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    boxShadow: `0 4px 12px ${tab.color === 'var(--color-primary)' ? 'rgba(220, 53, 69, 0.4)' : tab.color + '40'}`
                                } : { borderColor: tab.color, color: tab.color }}
                            >
                                <i className={`bi ${tab.icon} me-2`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Add Upcoming Project Button */}
                    {activeTab === 'UPCOMING' && (
                        <button
                            className="btn btn-primary btn-lg text-white fw-bold"
                            onClick={() => setShowAddModal(true)}
                            style={{ boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)' }}
                        >
                            <i className="bi bi-plus-circle-fill me-2"></i>
                            Add Upcoming Project
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="card shadow-sm border-0"
                style={{
                    borderTop: `5px solid ${tabs.find(t => t.key === activeTab)?.color}`,
                    minHeight: '500px'
                }}>
                <div className="card-body p-4">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div className="text-center py-5">
                            <i className={`bi ${tabs.find(t => t.key === activeTab)?.icon} display-1 text-muted mb-3`}></i>
                            <h4 className="text-muted">No {activeTab.toLowerCase()} projects found</h4>
                        </div>
                    ) : (
                        <div className="row g-4">
                            {filteredProjects.map(project => (
                                <div key={project.id} className="col-md-6 col-lg-4">
                                    <ProjectCard
                                        project={project}
                                        allocatedCount={getAllocatedCount(project.id)}
                                        onEndProject={handleEndProject}
                                        onClick={() => handleProjectClick(project)}
                                    // tabColor prop removed/ignored in favor of internal logic
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Project Modal */}
            {showAddModal && (
                <AddProjectModal
                    formData={formData}
                    setFormData={setFormData}
                    catalogSkills={catalogSkills}
                    onSubmit={handleSubmit}
                    onClose={() => setShowAddModal(false)}
                    loading={loading}
                    handleInputChange={handleInputChange}
                />
            )}

            {/* Project Details Modal */}
            {selectedProject && (
                <ProjectDetailsModal
                    project={selectedProject}
                    employees={allEmployees}
                    onClose={() => setSelectedProject(null)}
                    onEndProject={handleEndProject}
                    // Pass specific color based on project status, not just active tab
                    tabColor={
                        selectedProject.status === 'ACTIVE' ? '#28a745' :
                            selectedProject.status === 'PLANNED' ? '#ffc107' : '#6c757d'
                    }
                />
            )}
        </div>
    );
};

// ProjectCard Component
const ProjectCard = ({ project, allocatedCount = 0, onEndProject, onClick }) => {
    // Define Semantic Colors Locally
    const statusColors = {
        ACTIVE: '#28a745',    // Green
        PLANNED: '#ffc107',   // Yellow
        COMPLETED: '#6c757d'  // Grey
    };

    // Determine color based on project status
    const cardColor = statusColors[project.status] || '#6c757d';

    const getStatusBadge = (status) => {
        const badges = {
            ACTIVE: { bg: 'success', text: 'Active' },
            PLANNED: { bg: 'warning text-dark', text: 'Upcoming' },
            COMPLETED: { bg: 'secondary', text: 'Completed' }
        };
        return badges[status] || { bg: 'secondary', text: status };
    };

    const badge = getStatusBadge(project.status);
    const progressPercent = Math.min(100, Math.round((allocatedCount / project.employeesRequired) * 100));

    return (
        <div
            className="card h-100 shadow-sm hover-card"
            style={{
                border: `2px solid ${cardColor}20`,
                borderRadius: '12px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
            }}
            onClick={onClick}
        >
            <div className="card-body d-flex flex-column">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1" style={{ minWidth: 0, marginRight: '8px' }}>
                        <h5 className="card-title fw-bold mb-1 text-dark" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }} title={project.name}>
                            {project.name}
                        </h5>
                        <p className="text-muted small mb-0" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }} title={project.companyName}>
                            <i className="bi bi-building me-1"></i>
                            {project.companyName}
                        </p>
                    </div>
                </div>

                <div className="mb-3 d-flex align-items-center flex-wrap gap-2">
                    <span className={`badge bg-${badge.bg}`}>{badge.text}</span>
                    <small className="text-muted d-flex align-items-center">
                        <i className="bi bi-calendar-range me-1"></i>
                        {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                        {' - '}
                        {project.endDate ? new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Ongoing'}
                    </small>
                </div>

                {/* Progress Bar (Tube) */}
                <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <small className="text-muted fw-bold" style={{ fontSize: '0.75rem' }}>Team Allocation</small>
                        <small className="text-dark fw-bold" style={{ fontSize: '0.75rem' }}>{allocatedCount} / {project.employeesRequired}</small>
                    </div>
                    <div className="progress" style={{ height: '8px', borderRadius: '4px', backgroundColor: '#e9ecef' }}>
                        <div
                            className="progress-bar"
                            role="progressbar"
                            style={{
                                width: `${progressPercent}%`,
                                transition: 'width 0.5s ease',
                                backgroundColor: 'var(--color-primary)'
                            }}
                            aria-valuenow={progressPercent}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        ></div>
                    </div>
                </div>

                {/* Tech Stack */}
                {project.techStack && project.techStack.length > 0 && (
                    <div className="mb-3">
                        <div className="d-flex flex-wrap gap-1">
                            {project.techStack.slice(0, 4).map((tech, idx) => (
                                <span
                                    key={idx}
                                    className="badge bg-light text-dark border"
                                    style={{ fontSize: '0.7rem' }}
                                >
                                    {tech}
                                </span>
                            ))}
                            {project.techStack.length > 4 && (
                                <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                                    +{project.techStack.length - 4} more
                                </span>
                            )}
                        </div>
                    </div>
                )}

                <p className="small text-muted mt-auto mb-0 text-center">
                    <i className="bi bi-info-circle me-1"></i>Click for details & team
                </p>
            </div>


        </div>
    );
};

// Project Details Modal
const ProjectDetailsModal = ({ project, employees, onClose, onEndProject, tabColor }) => {
    // Find team members
    // Find team members
    const teamMembers = employees.filter(emp =>
        emp.assignments && emp.assignments.some(a => a.projectId === project.id)
    );

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-light">
                        <h5 className="modal-title fw-bold text-primary">
                            <i className="bi bi-folder-fill me-2"></i>{project.name}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">
                        <div className="row g-4">
                            {/* Left: Metadata */}
                            <div className="col-md-5 border-end">
                                <h6 className="fw-bold mb-3 text-muted">Project Details</h6>

                                <div className="mb-3">
                                    <small className="text-muted d-block">Company</small>
                                    <span className="fw-bold fs-5">{project.companyName}</span>
                                </div>

                                <div className="mb-3">
                                    <small className="text-muted d-block">Timeline</small>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-light text-dark border">{new Date(project.startDate).toLocaleDateString()}</span>
                                        <i className="bi bi-arrow-right text-muted small"></i>
                                        <span className="badge bg-light text-dark border">{new Date(project.endDate).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <small className="text-muted d-block">Status</small>
                                    <span className={`badge ${project.status === 'ACTIVE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                        {project.status}
                                    </span>
                                </div>

                                <div className="mb-3">
                                    <small className="text-muted d-block">Tech Stack</small>
                                    <div className="d-flex flex-wrap gap-1 mt-1">
                                        {project.techStack?.map((t, i) => (
                                            <span
                                                key={i}
                                                className="badge"
                                                style={{
                                                    fontSize: '0.7rem',
                                                    backgroundColor: `${tabColor}15`,
                                                    color: tabColor,
                                                    border: `1px solid ${tabColor}40`
                                                }}
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {project.status === 'ACTIVE' && (
                                    <div className="mt-4">
                                        <button
                                            className="btn btn-outline-danger btn-sm w-100"
                                            onClick={() => onEndProject(project.id)}
                                        >
                                            <i className="bi bi-stop-circle me-2"></i>End Project
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Right: Allocated Team */}
                            <div className="col-md-7">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold mb-0 text-muted">Allocated Team</h6>
                                    <span className="badge bg-primary">{teamMembers.length} / {project.employeesRequired}</span>
                                </div>

                                {teamMembers.length > 0 ? (
                                    <div className="list-group list-group-flush border rounded overflow-auto" style={{ maxHeight: '300px' }}>
                                        {teamMembers.map(emp => {
                                            const projectAssignments = emp.assignments.filter(a => a.projectId === project.id);
                                            const totalAlloc = projectAssignments.reduce((acc, curr) => acc + (curr.allocationPercent || 0), 0);

                                            return (
                                                <div key={emp.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold">{emp.firstName} {emp.lastName}</div>
                                                        {projectAssignments.map((assign, idx) => (
                                                            <div key={idx} className="small text-muted d-flex align-items-center gap-2">
                                                                <span>{assign.projectRole || 'No Role'}</span>
                                                                {projectAssignments.length > 1 && (
                                                                    <span className="badge bg-light text-dark border py-0" style={{ fontSize: '0.65rem' }}>
                                                                        {assign.allocationPercent}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <span className={`badge ${totalAlloc > 100 ? 'bg-danger' : 'bg-success'}`}>
                                                        {totalAlloc}%
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 border rounded bg-light">
                                        <i className="bi bi-people text-muted fs-3 mb-2 d-block"></i>
                                        <span className="text-muted small">No team members allocated yet.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// AddProjectModal Component
const AddProjectModal = ({ formData, setFormData, catalogSkills, onSubmit, onClose, loading, handleInputChange }) => {
    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content" style={{ borderRadius: '15px' }}>
                    <div className="modal-header" style={{ borderBottom: '3px solid var(--color-primary)' }}>
                        <h5 className="modal-title fw-bold text-dark">
                            <i className="bi bi-plus-circle-fill me-2 text-primary"></i>
                            Add Upcoming Project
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body p-4">
                        <form onSubmit={onSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Project Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., E-Commerce Platform"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Company</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        className="form-control"
                                        required
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Tech Corp"
                                    />
                                </div>
                            </div>

                            <div className="mt-3">
                                <label className="form-label fw-bold">Tech Stack</label>
                                <div className="d-flex flex-wrap gap-1 mb-2 p-2 border rounded" style={{ minHeight: '45px', backgroundColor: '#f8f9fa' }}>
                                    {formData.techStack.length === 0 ? (
                                        <span className="text-muted small align-self-center">No skills selected</span>
                                    ) : (
                                        formData.techStack.map(tech => (
                                            <span key={tech} className="badge bg-secondary d-flex align-items-center gap-2">
                                                {tech}
                                                <button
                                                    type="button"
                                                    className="btn-close btn-close-white"
                                                    style={{ fontSize: '0.6rem' }}
                                                    onClick={() => setFormData(prev => ({
                                                        ...prev,
                                                        techStack: prev.techStack.filter(t => t !== tech)
                                                    }))}
                                                ></button>
                                            </span>
                                        ))
                                    )}
                                </div>
                                <select
                                    className="form-select"
                                    onChange={(e) => {
                                        const selectedSkill = e.target.value;
                                        if (selectedSkill && !formData.techStack.includes(selectedSkill)) {
                                            setFormData(prev => ({ ...prev, techStack: [...prev.techStack, selectedSkill] }));
                                        }
                                        e.target.value = '';
                                    }}
                                >
                                    <option value="">+ Add Skill...</option>
                                    {catalogSkills.map(skill => (
                                        <option key={skill.id} value={skill.name}>{skill.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="row g-3 mt-2">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        className="form-control"
                                        required
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold">End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        className="form-control"
                                        required
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="mt-3">
                                <label className="form-label fw-bold">Employees Required</label>
                                <input
                                    type="number"
                                    name="employeesRequired"
                                    className="form-control"
                                    min="1"
                                    required
                                    value={formData.employeesRequired}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="mt-4 d-flex gap-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg text-white fw-bold flex-grow-1"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Project'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary btn-lg"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectManagement;
