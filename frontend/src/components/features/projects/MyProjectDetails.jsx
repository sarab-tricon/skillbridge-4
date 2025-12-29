import { useState, useEffect } from 'react';
import api from '../../../api/axios'; // Or expose needed methods
import { allocationsApi } from '../../../api/allocations';
import { projectsApi } from '../../../api/projects';

const MyProjectDetails = ({ setActiveSection }) => { // Accept setActiveSection if needed for internal navigation or handle differently
    const [allocation, setAllocation] = useState(null);
    const [utilization, setUtilization] = useState(null);
    const [availableProjects, setAvailableProjects] = useState([]);
    const [myRequests, setMyRequests] = useState([]);

    const [loadingAlloc, setLoadingAlloc] = useState(true);
    const [loadingUtil, setLoadingUtil] = useState(true);
    const [errorAlloc, setErrorAlloc] = useState(null);
    const [errorUtil, setErrorUtil] = useState(null);

    // Request State
    const [selectedProject, setSelectedProject] = useState('');
    const [requestingAlloc, setRequestingAlloc] = useState(false);
    const [requestAllocError, setRequestAllocError] = useState(null);

    useEffect(() => {
        fetchAllocation();
        fetchAttendance(); // Actually fetchUtilization
        fetchAvailableProjects();
        fetchMyRequests();
    }, []);

    const fetchAllocation = async () => {
        setLoadingAlloc(true);
        try {
            const response = await allocationsApi.getMyAssignments(); // Need to add
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

    const fetchAttendance = async () => { // actually fetchUtilization
        setLoadingUtil(true);
        try {
            const response = await allocationsApi.getMyUtilization(); // Need to add
            setUtilization(response.data);
            setErrorUtil(null);
        } catch (err) {
            setErrorUtil('Failed to load utilization.');
            console.error(err);
        } finally {
            setLoadingUtil(false);
        }
    };

    const fetchAvailableProjects = async () => {
        try {
            const response = await projectsApi.getActiveProjects(); // Need to add
            setAvailableProjects(response.data);
        } catch (err) {
            console.error('Failed to fetch projects', err);
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

    const handleRequestAllocation = async (e) => {
        e.preventDefault();
        if (!selectedProject) return;
        setRequestingAlloc(true);
        setRequestAllocError(null);
        try {
            await allocationsApi.createRequest(selectedProject);
            setSelectedProject('');
            fetchMyRequests();
            alert('Request submitted to Manager for approval.');
        } catch (err) {
            setRequestAllocError(err.response?.data?.message || err.response?.data?.error || 'Failed to request allocation.');
            console.error(err);
        } finally {
            setRequestingAlloc(false);
        }
    };

    return (
        <div className="fade-in">
            {/* Allocation / Request Section */}
            <div className="py-2 mb-4">
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

            {/* Utilization Section */}
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
        </div>
    );
};

export default MyProjectDetails;
