import { useState, useEffect } from 'react';
import api from '../api/axios';

const ProjectManagement = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        companyName: '',
        techStack: [],
        startDate: '',
        endDate: '',
        employeesRequired: 1,
        status: 'ACTIVE'
    });

    const [catalogSkills, setCatalogSkills] = useState([]);

    useEffect(() => {
        fetchProjects();
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

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (err) {
            console.error('Failed to fetch projects:', err);
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
                status: 'ACTIVE'
            });
            fetchProjects();
        } catch (err) {
            console.error('Failed to create project:', err);
            setError(err.response?.data?.message || 'Failed to create project.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-lg-5">
                    <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '5px solid #CF4B00' }}>
                        <div className="card-body p-4">
                            <h3 className="card-title fw-bold mb-4" style={{ color: '#CF4B00' }}>
                                <i className="bi bi-folder-plus me-2"></i>Add New Project
                            </h3>

                            {success && (
                                <div className="alert alert-success alert-dismissible fade show" role="alert">
                                    <i className="bi bi-check-circle-fill me-2"></i> {success}
                                    <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
                                </div>
                            )}

                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                                    <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Project Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-control"
                                        required
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        style={{ border: '2px solid #9CC6DB' }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Company Name</label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        className="form-control"
                                        required
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        style={{ border: '2px solid #9CC6DB' }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Tech Stack</label>
                                    <div className="d-flex flex-wrap gap-2 mb-2 p-2 border rounded" style={{ minHeight: '38px', backgroundColor: '#f8f9fa' }}>
                                        {formData.techStack.length === 0 ? (
                                            <span className="text-muted small align-self-center">No skills selected</span>
                                        ) : (
                                            formData.techStack.map(tech => (
                                                <span key={tech} className="badge bg-secondary d-flex align-items-center gap-2">
                                                    {tech}
                                                    <button
                                                        type="button"
                                                        className="btn-close btn-close-white"
                                                        style={{ fontSize: '0.5rem' }}
                                                        onClick={() => setFormData(prev => ({ ...prev, techStack: prev.techStack.filter(t => t !== tech) }))}
                                                    ></button>
                                                </span>
                                            ))
                                        )}
                                    </div>
                                    <select
                                        className="form-select"
                                        style={{ border: '2px solid #9CC6DB' }}
                                        onChange={(e) => {
                                            const selectedSkill = e.target.value;
                                            if (selectedSkill && !formData.techStack.includes(selectedSkill)) {
                                                setFormData(prev => ({ ...prev, techStack: [...prev.techStack, selectedSkill] }));
                                            }
                                            e.target.value = ''; // Reset select
                                        }}
                                    >
                                        <option value="">+ Add Skill from Catalog</option>
                                        {catalogSkills.map(skill => (
                                            <option key={skill.id} value={skill.name}>{skill.name}</option>
                                        ))}
                                    </select>
                                    <div className="form-text text-muted small">Select skills from the catalog to build your stack.</div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Start Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            className="form-control"
                                            required
                                            value={formData.startDate}
                                            onChange={handleInputChange}
                                            style={{ border: '2px solid #9CC6DB' }}
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">End Date</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            className="form-control"
                                            required
                                            value={formData.endDate}
                                            onChange={handleInputChange}
                                            style={{ border: '2px solid #9CC6DB' }}
                                        />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Employees Required</label>
                                    <input
                                        type="number"
                                        name="employeesRequired"
                                        className="form-control"
                                        min="1"
                                        required
                                        value={formData.employeesRequired}
                                        onChange={handleInputChange}
                                        style={{ border: '2px solid #9CC6DB' }}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Status</label>
                                    <select
                                        name="status"
                                        className="form-select"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        style={{ border: '2px solid #9CC6DB' }}
                                    >
                                        <option value="PLANNED">PLANNED</option>
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-lg w-100 text-white fw-bold mt-2"
                                    style={{ backgroundColor: '#CF4B00' }}
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Project'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '5px solid #9CC6DB' }}>
                        <div className="card-body p-4">
                            <h3 className="card-title fw-bold mb-4" style={{ color: '#9CC6DB' }}>
                                <i className="bi bi-list-task me-2"></i>Organization Projects
                            </h3>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Project</th>
                                            <th>Company</th>
                                            <th>Tech Stack</th>
                                            <th>Employees</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map(proj => (
                                            <tr key={proj.id}>
                                                <td className="fw-bold">{proj.name}</td>
                                                <td>{proj.companyName}</td>
                                                <td>
                                                    {proj.techStack && proj.techStack.length > 0 ? (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {proj.techStack.slice(0, 3).map((tech, idx) => (
                                                                <span key={idx} className="badge bg-info text-dark">{tech}</span>
                                                            ))}
                                                            {proj.techStack.length > 3 && (
                                                                <span className="badge bg-secondary">+{proj.techStack.length - 3}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>{proj.employeesRequired || '-'}</td>
                                                <td>
                                                    <span className={`badge ${proj.status === 'ACTIVE' ? 'bg-success' : proj.status === 'COMPLETED' ? 'bg-secondary' : 'bg-warning text-dark'}`}>
                                                        {proj.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {projects.length === 0 && !loading && (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted py-4">No projects found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectManagement;
