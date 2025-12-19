import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal, Button, Form } from 'react-bootstrap';

const ProjectManagement = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        techStack: '',
        startDate: '',
        endDate: '',
        status: 'ACTIVE'
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
            setError('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    };

    const handleShowModal = (project = null) => {
        if (project) {
            setEditingProject(project);
            setFormData({
                name: project.name,
                companyName: project.companyName,
                techStack: project.techStack || '',
                startDate: project.startDate,
                endDate: project.endDate,
                status: project.status
            });
        } else {
            setEditingProject(null);
            setFormData({
                name: '',
                companyName: '',
                techStack: '',
                startDate: '',
                endDate: '',
                status: 'ACTIVE'
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => setShowModal(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProject) {
                await api.put(`/projects/${editingProject.id}`, formData);
            } else {
                await api.post('/projects', formData);
            }
            fetchProjects();
            handleCloseModal();
        } catch (err) {
            console.error('Failed to save project:', err);
            alert(err.response?.data?.message || 'Failed to save project.');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this project?')) {
            try {
                await api.delete(`/projects/${id}`);
                setProjects(prev => prev.filter(p => p.id !== id));
            } catch (err) {
                console.error('Failed to delete project:', err);
                alert('Failed to delete project.');
            }
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'ACTIVE': 'success',
            'COMPLETED': 'info',
            'ON_HOLD': 'warning'
        };
        return <span className={`badge bg-${colors[status] || 'secondary'}`}>{status}</span>;
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;

    return (
        <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '4px solid var(--color-secondary)' }}>
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="card-title fw-bold m-0" style={{ color: 'var(--color-secondary)' }}>
                        <i className="bi bi-kanban me-2"></i>Project Portfolio
                    </h3>
                    <button className="btn text-white" style={{ backgroundColor: 'var(--color-accent)' }} onClick={() => handleShowModal()}>
                        + Add Project
                    </button>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light text-uppercase small text-muted">
                            <tr>
                                <th>Project Name</th>
                                <th>Company</th>
                                <th>Status</th>
                                <th>Dates</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map(project => (
                                <tr key={project.id}>
                                    <td className="fw-bold">{project.name}</td>
                                    <td>{project.companyName}</td>
                                    <td>{getStatusBadge(project.status)}</td>
                                    <td>
                                        <small className="text-muted d-block">{project.startDate} to</small>
                                        <small className="text-muted d-block">{project.endDate}</small>
                                    </td>
                                    <td>
                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleShowModal(project)}>Edit</button>
                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(project.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Project Modal */}
                <Modal show={showModal} onHide={handleCloseModal} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingProject ? 'Edit Project' : 'Add New Project'}</Modal.Title>
                    </Modal.Header>
                    <Form onSubmit={handleSubmit}>
                        <Modal.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Project Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Company</Form.Label>
                                <Form.Control
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Tech Stack</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={formData.techStack}
                                    onChange={e => setFormData({ ...formData, techStack: e.target.value })}
                                />
                            </Form.Group>
                            <div className="row">
                                <Form.Group className="col-md-6 mb-3">
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        required
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </Form.Group>
                                <Form.Group className="col-md-6 mb-3">
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        required
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </Form.Group>
                            </div>
                            <Form.Group className="mb-3">
                                <Form.Label>Status</Form.Label>
                                <Form.Select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="ON_HOLD">ON_HOLD</option>
                                </Form.Select>
                            </Form.Group>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                            <Button type="submit" variant="primary">Save Changes</Button>
                        </Modal.Footer>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default ProjectManagement;
