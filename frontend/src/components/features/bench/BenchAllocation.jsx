import { useState, useEffect } from 'react';
import { projectsApi } from '../../../api/projects';
import { usersApi } from '../../../api/users';
import { allocationsApi } from '../../../api/allocations';

const BenchAllocation = () => {
    const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'UPCOMING'
    const [projects, setProjects] = useState([]);
    const [allEmployees, setAllEmployees] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [showAllocationModal, setShowAllocationModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [employeeFilter, setEmployeeFilter] = useState('ALL'); // 'ALL', 'BENCH', 'SKILL_MATCH'

    // Update Logic State
    const [existingAssignment, setExistingAssignment] = useState(null);
    const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);

    // Allocation form state
    const [allocationForm, setAllocationForm] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        billingType: 'BILLABLE',
        projectRole: '',
        allocationPercent: 100
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [projectsRes, employeesRes, utilizationRes] = await Promise.all([
                projectsApi.getAllProjects(),
                usersApi.getEmployees(),
                allocationsApi.getUtilizationAll()
            ]);
            setProjects(projectsRes.data);

            const employees = employeesRes.data;
            const utilizations = utilizationRes.data;

            // Create a map for fast lookup of utilization data
            const utilizationMap = new Map((utilizations || []).map(u => [u.employeeId, u]));

            const employeesWithUtil = employees.map(emp => {
                const utilData = utilizationMap.get(emp.id);
                return {
                    ...emp,
                    utilization: utilData?.totalUtilization !== undefined ? utilData.totalUtilization : 0,
                    availableCapacity: utilData?.availableCapacity !== undefined ? utilData.availableCapacity : 100,
                    assignments: utilData?.assignments || []
                };
            });

            setAllEmployees(employeesWithUtil);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleAllocateClick = (employee) => {
        if (!selectedProject) {
            setError('Please select a project first');
            return;
        }

        const existing = employee.assignments?.find(a => a.projectId === selectedProject.id);
        if (existing) {
            setSelectedEmployee(employee);
            setExistingAssignment(existing);
            setShowUpdatePrompt(true);
            return;
        }

        openAllocationModal(employee);
    };

    const openAllocationModal = (employee, existing = null) => {
        setSelectedEmployee(employee);
        setIsUpdateMode(!!existing);
        setExistingAssignment(existing);

        setAllocationForm({
            startDate: existing?.startDate || new Date().toISOString().split('T')[0],
            endDate: existing?.endDate || selectedProject.endDate || '',
            billingType: existing?.billingType || 'BILLABLE',
            projectRole: existing?.projectRole || '',
            allocationPercent: existing?.allocationPercent || 100
        });
        setShowAllocationModal(true);
    };

    const handleAllocationSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isUpdateMode) {
                await allocationsApi.updateAssignment(existingAssignment.assignmentId, {
                    ...allocationForm,
                    projectId: selectedProject.id // ensure ID is passed if needed, though update by ID usually sufficient
                });
                setSuccess(`Updated allocation for ${selectedEmployee.firstName} in ${selectedProject.name}`);
            } else {
                await allocationsApi.allocateEmployee({
                    employeeId: selectedEmployee.id,
                    projectId: selectedProject.id,
                    ...allocationForm
                });
                setSuccess(`Allocated ${selectedEmployee.firstName} to ${selectedProject.name}`);
            }
            setShowAllocationModal(false);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredProjects = () => {
        return projects.filter(p => p.status === (activeTab === 'ACTIVE' ? 'ACTIVE' : 'PLANNED'));
    };

    const calculateSkillMatch = (employee) => {
        if (!selectedProject || !selectedProject.techStack || !employee.skills) return 0;
        const projSkills = selectedProject.techStack.map(t => t.toLowerCase());
        const empSkills = employee.skills.map(s => s.skillName?.toLowerCase());
        const matchCount = empSkills.filter(es => projSkills.includes(es)).length;
        return projSkills.length > 0 ? Math.round((matchCount / projSkills.length) * 100) : 0;
    };

    const getAllocationCount = (projectId) => {
        return allEmployees.filter(emp =>
            emp.assignments && emp.assignments.some(a => a.projectId === projectId)
        ).length;
    };

    const filteredProjects = getFilteredProjects();

    const getFilteredEmployees = () => {
        let filtered = allEmployees;
        if (employeeFilter === 'BENCH') filtered = filtered.filter(e => e.availableCapacity === 100);

        if (employeeFilter === 'SKILL_MATCH' && selectedProject) {
            filtered = filtered.filter(emp => {
                if (!emp.skills || !selectedProject.techStack) return false;
                const empSkills = emp.skills.map(s => s.skillName?.toLowerCase());
                const projSkills = selectedProject.techStack.map(t => t.toLowerCase());
                return empSkills.some(es => projSkills.includes(es));
            });
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(emp =>
                emp.firstName?.toLowerCase().includes(query) ||
                emp.lastName?.toLowerCase().includes(query)
            );
        }
        return filtered;
    };

    const filteredEmployees = getFilteredEmployees();

    const tabs = [
        { key: 'ACTIVE', label: 'Active Projects', icon: 'bi-play-circle-fill', color: '#28a745' },
        { key: 'UPCOMING', label: 'Upcoming Projects', icon: 'bi-calendar-plus', color: '#ffc107' }
    ];

    return (
        <div className="container-fluid px-0 h-100">
            {success && <div className="alert alert-success alert-dismissible fade show mb-3" role="alert">{success}<button className="btn-close" onClick={() => setSuccess(null)}></button></div>}
            {error && <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">{error}<button className="btn-close" onClick={() => setError(null)}></button></div>}

            {/* Tabs */}
            <div className="mb-4">
                <div className="btn-group" role="group">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            className={`btn btn-lg ${activeTab === tab.key ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => { setActiveTab(tab.key); setSelectedProject(null); }}
                        >
                            <i className={`bi ${tab.icon} me-2`}></i>{tab.label} ({filteredProjects.length})
                        </button>
                    ))}
                </div>
            </div>

            <div className="row g-3 h-100">
                {/* Left: Project Cards */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 h-100" style={{ borderTop: `5px solid ${tabs.find(t => t.key === activeTab)?.color}` }}>
                        <div className="card-body p-0 d-flex flex-column">
                            <div className="p-3 border-bottom">
                                <h5 className="fw-bold mb-0">Projects List</h5>
                            </div>
                            <div className="flex-grow-1 overflow-auto p-3" style={{ maxHeight: '70vh' }}>
                                {filteredProjects.map(project => {
                                    const allocatedCount = getAllocationCount(project.id);
                                    return (
                                        <div
                                            key={project.id}
                                            className={`card mb-3 shadow-sm ${selectedProject?.id === project.id ? 'border-primary bg-light' : 'border-light'}`}
                                            onClick={() => setSelectedProject(project)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="card-body p-3">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <h6 className="fw-bold mb-0 text-truncate" style={{ maxWidth: '60%' }}>{project.name}</h6>
                                                    <div className="d-flex flex-column align-items-end">
                                                        <span className={`badge ${project.status === 'ACTIVE' ? 'bg-success' : 'bg-warning text-dark'} small mb-1`}>
                                                            {project.status === 'ACTIVE' ? 'Active' : 'Upcoming'}
                                                        </span>
                                                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                            <i className="bi bi-people-fill me-1"></i>
                                                            {allocatedCount} / {project.employeesRequired}
                                                        </small>
                                                    </div>
                                                </div>
                                                <p className="small text-muted mb-2">{project.companyName}</p>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {project.techStack?.slice(0, 3).map((t, i) => (
                                                        <span key={i} className="badge bg-secondary" style={{ fontSize: '0.65rem' }}>{t}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Employee Table */}
                <div className="col-lg-8">
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-header bg-white pt-3 pb-3 border-bottom">
                            <h5 className="mb-0 fw-bold text-primary">
                                {selectedProject ? `Allocating to: ${selectedProject.name}` : 'Select a Project based on Status'}
                            </h5>
                        </div>
                        <div className="card-body p-3 d-flex flex-column">
                            {/* Filters */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold mb-0">Available Employees</h6>
                                <div className="btn-group btn-group-sm">
                                    <button className={`btn ${employeeFilter === 'ALL' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setEmployeeFilter('ALL')}>All</button>
                                    <button className={`btn ${employeeFilter === 'BENCH' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setEmployeeFilter('BENCH')}>Bench Only</button>
                                    <button className={`btn ${employeeFilter === 'SKILL_MATCH' ? 'btn-warning' : 'btn-outline-warning'}`} onClick={() => setEmployeeFilter('SKILL_MATCH')} disabled={!selectedProject}>Skill Match</button>
                                </div>
                            </div>
                            <input type="text" className="form-control form-control-sm mb-3" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

                            {/* Table */}
                            <div className="flex-grow-1 overflow-auto">
                                <table className="table table-hover table-sm align-middle">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th>Name</th>
                                            <th>Skills</th>
                                            <th>Status</th>
                                            <th>Match</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.map(employee => {
                                            const match = selectedProject ? calculateSkillMatch(employee) : 0;
                                            return (
                                                <tr key={employee.id}>
                                                    <td>
                                                        <div className="fw-bold">{employee.firstName} {employee.lastName}</div>
                                                        <small className="text-muted">{employee.email}</small>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {employee.skills?.slice(0, 2).map((s, i) => <span key={i} className="badge bg-light text-dark border" style={{ fontSize: '0.6rem' }}>{s.skillName}</span>)}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {employee.availableCapacity === 100 ? (
                                                            <span className="badge bg-success">BENCH</span>
                                                        ) : employee.availableCapacity === 0 ? (
                                                            <span className="badge bg-danger">FULLY ALLOCATED</span>
                                                        ) : (
                                                            <span className="badge bg-warning text-dark">{100 - employee.availableCapacity}% ALLOCATED</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {selectedProject ? (
                                                            <span className={`badge ${match >= 80 ? 'bg-success' : match >= 50 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                                                {match}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {selectedProject && employee.availableCapacity > 0 ? (
                                                            <button className="btn btn-sm btn-outline-primary" onClick={() => handleAllocateClick(employee)}>
                                                                <i className="bi bi-plus-lg"></i>
                                                            </button>
                                                        ) : (
                                                            <button className="btn btn-outline-secondary btn-sm" disabled>
                                                                <i className="bi bi-dash"></i>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conflict Prompt Modal */}
            {showUpdatePrompt && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow">
                            <div className="modal-header bg-warning text-dark border-0">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>Already Allocated
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setShowUpdatePrompt(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="mb-3">
                                    <strong>{selectedEmployee?.firstName} {selectedEmployee?.lastName}</strong> is already allocated to <strong>{selectedProject?.name}</strong>.
                                </p>
                                <div className="alert alert-light border d-flex align-items-center mb-0">
                                    <i className="bi bi-info-circle text-primary me-2"></i>
                                    <div>
                                        Current Allocation: <strong>{existingAssignment?.allocationPercent}%</strong><br />
                                        Role: {existingAssignment?.projectRole || 'Developer'}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button className="btn btn-secondary" onClick={() => setShowUpdatePrompt(false)}>Cancel</button>
                                <button className="btn btn-primary" onClick={() => {
                                    setShowUpdatePrompt(false);
                                    openAllocationModal(selectedEmployee, existingAssignment);
                                }}>Update Allocation</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Allocation Modal */}
            {showAllocationModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">{isUpdateMode ? 'Update Allocation' : `Allocate to ${selectedProject.name}`}</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAllocationModal(false)}></button>
                            </div>
                            <form onSubmit={handleAllocationSubmit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Employee</label>
                                        <div className="form-control bg-light">
                                            {selectedEmployee.firstName} {selectedEmployee.lastName}
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Project Role <span className="text-danger">*</span></label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="e.g. Senior Developer, QA Lead"
                                            name="projectRole"
                                            value={allocationForm.projectRole}
                                            onChange={e => setAllocationForm({ ...allocationForm, projectRole: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Allocation % (Max {isUpdateMode ? (selectedEmployee.availableCapacity + (existingAssignment?.allocationPercent || 0)) : selectedEmployee.availableCapacity}%)</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="allocationPercent"
                                            value={allocationForm.allocationPercent}
                                            onChange={e => setAllocationForm({ ...allocationForm, allocationPercent: e.target.value })}
                                            max={isUpdateMode ? (selectedEmployee.availableCapacity + (existingAssignment?.allocationPercent || 0)) : selectedEmployee.availableCapacity}
                                            required
                                        />
                                    </div>

                                    {/* Hidden Date Inputs (Defaults Used) */}
                                    <input type="hidden" name="startDate" value={allocationForm.startDate} />
                                    <input type="hidden" name="endDate" value={allocationForm.endDate} />

                                    <div className="mb-3">
                                        <label className="form-label">Billing Type</label>
                                        <select name="billingType" className="form-select" value={allocationForm.billingType} onChange={e => setAllocationForm({ ...allocationForm, billingType: e.target.value })}>
                                            <option value="BILLABLE">Billable</option>
                                            <option value="INVESTMENT">Investment</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAllocationModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={loading}>{isUpdateMode ? 'Update' : 'Allocate'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BenchAllocation;
