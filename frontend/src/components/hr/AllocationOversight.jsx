import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

const AllocationOversight = () => {
    const [assignments, setAssignments] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Override Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [overrideData, setOverrideData] = useState({
        projectId: '',
        billingType: '',
        assignmentStatus: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assignmentsRes, projectsRes] = await Promise.all([
                api.get('/assignments/all'),
                api.get('/projects/active')
            ]);
            setAssignments(assignmentsRes.data);
            setProjects(projectsRes.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch allocation data:', err);
            setError('Failed to load allocation data.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenOverride = (assignment) => {
        setSelectedAssignment(assignment);
        setOverrideData({
            projectId: assignment.projectId,
            billingType: assignment.billingType || 'BENCH',
            assignmentStatus: assignment.assignmentStatus
        });
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleOverrideSubmit = async (e) => {
        e.preventDefault();
        if (!window.confirm('This action impacts utilization metrics. Do you want to proceed?')) return;

        try {
            await api.put(`/assignments/${selectedAssignment.assignmentId}/override`, overrideData);
            fetchData();
            handleCloseModal();
        } catch (err) {
            console.error('Failed to override assignment:', err);
            alert('Failed to override assignment.');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'ACTIVE': 'success',
            'PENDING': 'warning',
            'ENDED': 'secondary',
            'REJECTED': 'danger'
        };
        return <span className={`badge bg-${colors[status] || 'info'}`}>{status}</span>;
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;

    return (
        <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '4px solid var(--color-accent)' }}>
            <div className="card-body">
                <h3 className="card-title fw-bold mb-4" style={{ color: 'var(--color-accent)' }}>
                    <i className="bi bi-people-fill me-2"></i>Organization Allocations
                </h3>

                {error && <Alert variant="danger">{error}</Alert>}

                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light text-uppercase small text-muted">
                            <tr>
                                <th>Employee ID</th>
                                <th>Project ID</th>
                                <th>Billing Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map(assignment => (
                                <tr key={assignment.assignmentId}>
                                    <td className="small">{assignment.employeeId}</td>
                                    <td className="small">{assignment.projectId}</td>
                                    <td>
                                        <span className={`badge bg-${assignment.billingType === 'BILLABLE' ? 'success' : 'info'}`}>
                                            {assignment.billingType || 'N/A'}
                                        </span>
                                    </td>
                                    <td>{getStatusBadge(assignment.assignmentStatus)}</td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleOpenOverride(assignment)}>
                                            Override
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Override Modal */}
                <Modal show={showModal} onHide={handleCloseModal} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>HR Allocation Override</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleOverrideSubmit}>
                        <Modal.Body>
                            <Alert variant="warning">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                This action impacts utilization metrics and direct assignments.
                            </Alert>

                            <Form.Group className="mb-3">
                                <Form.Label>Change Project</Form.Label>
                                <Form.Select
                                    value={overrideData.projectId}
                                    onChange={e => setOverrideData({ ...overrideData, projectId: e.target.value })}
                                >
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Billing Type</Form.Label>
                                <Form.Select
                                    value={overrideData.billingType}
                                    onChange={e => setOverrideData({ ...overrideData, billingType: e.target.value })}
                                >
                                    <option value="BILLABLE">BILLABLE</option>
                                    <option value="INVESTMENT">INVESTMENT</option>
                                    <option value="BENCH">BENCH</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={overrideData.assignmentStatus}
                                    onChange={e => setOverrideData({ ...overrideData, assignmentStatus: e.target.value })}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="ENDED">ENDED</option>
                                </Form.Select>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                            <Button type="submit" variant="warning">Apply Override</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default AllocationOversight;
