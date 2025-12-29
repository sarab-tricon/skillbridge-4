import React, { useState, useEffect } from 'react';
import { projectsApi } from '../../../api/projects';

const ActiveProjectsList = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const response = await projectsApi.getActiveProjects();
            setProjects(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch projects', err);
            setError('Failed to load projects.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="card shadow border-0 rounded-4 h-100 overflow-hidden">
            <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                <h4 className="fw-bold mb-0">Organization Projects</h4>
            </div>
            <div className="card-body p-0">
                {error ? <div className="alert alert-danger m-3">{error}</div> :
                    projects.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <p className="mb-0 fs-4">No active organization projects found.</p>
                        </div>
                    ) : (
                        <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light sticky-top" style={{ zIndex: 1 }}>
                                    <tr>
                                        <th className="px-4 py-3">Project Name</th>
                                        <th className="py-3">Company</th>
                                        <th className="px-4 py-3 text-end">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((proj, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 fw-bold text-primary">{proj.name}</td>
                                            <td>{proj.companyName}</td>
                                            <td className="px-4 text-end">
                                                <span className="badge bg-success-subtle text-success border border-success rounded-pill px-3">
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
    );
};

export default ActiveProjectsList;
