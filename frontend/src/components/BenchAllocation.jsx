import { useState, useEffect } from 'react';
import api from '../api/axios';

const BenchAllocation = () => {
    const [projects, setProjects] = useState([]);
    const [benchEmployees, setBenchEmployees] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        employeeId: '',
        billingType: 'BILLABLE',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const projectsRes = await api.get('/projects/active');
            const benchRes = await api.get('/users/bench');
            setProjects(projectsRes.data);
            setBenchEmployees(benchRes.data);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            const status = err.response?.status;
            if (status === 403) {
                setError('Access denied to bench data. Please ensure you have HR permissions.');
            } else if (status === 404) {
                setError('Bench API endpoints not found. Please verify backend state.');
            } else {
                setError(`Failed to load data: ${err.response?.data?.message || err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setSuccess(null);
        setError(null);
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
            const payload = {
                ...formData,
                projectId: selectedProject.id,
                endDate: formData.endDate || null
            };
            await api.post('/assignments', payload);
            setSuccess(`Employee allocated to ${selectedProject.name} successfully!`);

            // Refresh bench list
            const benchRes = await api.get('/users/bench');
            setBenchEmployees(benchRes.data);

            // Reset form (keep project selected as per requirements)
            setFormData({
                employeeId: '',
                billingType: 'BILLABLE',
                startDate: new Date().toISOString().split('T')[0],
                endDate: ''
            });
        } catch (err) {
            console.error('Allocation failed:', err);
            const msg = err.response?.data?.message || err.message || 'Allocation failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow-sm border-0 mt-5" style={{ backgroundColor: '#fff', borderTop: '5px solid #CF4B00' }}>
            <div className="card-body p-4">
                <h3 className="card-title fw-bold mb-4" style={{ color: '#CF4B00' }}>
                    <i className="bi bi-briefcase-fill me-2"></i>Bench Management & Project Allocation
                </h3>

                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i> {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}

                {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <i className="bi bi-check-circle-fill me-2"></i> {success}
                        <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
                    </div>
                )}

                <div className="row">
                    <div className="col-md-6">
                        <h5 className="fw-bold mb-3">Active Projects</h5>
                        {projects.length === 0 ? (
                            <p className="text-muted">No active projects found.</p>
                        ) : (
                            <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Project Name</th>
                                            <th>Company</th>
                                            <th>Tech Stack</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projects.map(proj => (
                                            <tr key={proj.id} className={selectedProject?.id === proj.id ? 'table-primary' : ''}>
                                                <td>{proj.name}</td>
                                                <td>{proj.companyName}</td>
                                                <td>
                                                    {proj.techStack && proj.techStack.length > 0 ? (
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {proj.techStack.slice(0, 2).map((tech, idx) => (
                                                                <span key={idx} className="badge bg-info text-dark small">{tech}</span>
                                                            ))}
                                                            {proj.techStack.length > 2 && (
                                                                <span className="badge bg-secondary small">+{proj.techStack.length - 2}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-sm text-white"
                                                        style={{ backgroundColor: selectedProject?.id === proj.id ? '#9CC6DB' : '#CF4B00' }}
                                                        onClick={() => handleSelectProject(proj)}
                                                    >
                                                        {selectedProject?.id === proj.id ? 'Selected' : 'Select'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="col-md-6 border-start">
                        {selectedProject ? (
                            <div className="ps-3">
                                <h5 className="fw-bold mb-4">Allocate to: <span style={{ color: '#CF4B00' }}>{selectedProject.name}</span></h5>
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Select Bench Employee</label>
                                        <select
                                            name="employeeId"
                                            className="form-select"
                                            required
                                            value={formData.employeeId}
                                            onChange={handleInputChange}
                                            style={{ border: '2px solid #9CC6DB' }}
                                        >
                                            <option value="">Choose employee...</option>
                                            {benchEmployees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.email}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Billing Type</label>
                                        <select
                                            name="billingType"
                                            className="form-select"
                                            value={formData.billingType}
                                            onChange={handleInputChange}
                                            style={{ border: '2px solid #9CC6DB' }}
                                        >
                                            <option value="BILLABLE">BILLABLE</option>
                                            <option value="INVESTMENT">INVESTMENT</option>
                                        </select>
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
                                            <label className="form-label fw-bold">End Date (Optional)</label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                className="form-control"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                style={{ border: '2px solid #9CC6DB' }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-lg w-100 text-white fw-bold mt-3"
                                        style={{ backgroundColor: '#CF4B00' }}
                                        disabled={loading || !formData.employeeId}
                                    >
                                        {loading ? 'Allocating...' : 'Allocate Employee'}
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="h-100 d-flex align-items-center justify-content-center">
                                <p className="text-muted">Select a project from the left to start allocation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BenchAllocation;
