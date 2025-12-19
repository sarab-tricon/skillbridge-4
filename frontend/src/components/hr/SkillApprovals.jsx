import { useState, useEffect } from 'react';
import api from '../../api/axios';

const SkillApprovals = () => {
    const [pendingSkills, setPendingSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPendingSkills();
    }, []);

    const fetchPendingSkills = async () => {
        setLoading(true);
        try {
            const response = await api.get('/skills/pending/all');
            setPendingSkills(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch pending skills:', err);
            setError('Failed to load pending skills.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            await api.post(`/skills/${id}/${action}`);
            // Optimistic update
            setPendingSkills(prev => prev.filter(skill => skill.id !== id));
        } catch (err) {
            console.error(`Failed to ${action} skill:`, err);
            alert(`Failed to ${action} skill. Please try again.`);
        }
    };

    if (loading) return <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div></div>;

    if (error) return <div className="alert alert-danger m-3">{error}</div>;

    return (
        <div className="card shadow-sm border-0" style={{ backgroundColor: '#fff', borderTop: '4px solid var(--color-primary)' }}>
            <div className="card-body">
                <h3 className="card-title fw-bold mb-4" style={{ color: 'var(--color-primary)' }}>
                    <i className="bi bi-shield-check me-2"></i>Pending Skill Approvals
                </h3>

                {pendingSkills.length === 0 ? (
                    <div className="text-center py-5">
                        <h4 className="text-muted">No pending skill approvals 🎉</h4>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light text-uppercase small text-muted">
                                <tr>
                                    <th>Employee Name</th>
                                    <th>Skill Name</th>
                                    <th>Proficiency</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingSkills.map(skill => (
                                    <tr key={skill.id}>
                                        <td className="fw-bold">{skill.employeeName}</td>
                                        <td>{skill.skillName}</td>
                                        <td><span className="badge bg-secondary">{skill.proficiencyLevel}</span></td>
                                        <td><span className="badge bg-warning text-dark">{skill.status}</span></td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-success me-2"
                                                onClick={() => handleAction(skill.id, 'approve')}
                                            >
                                                ✅ Approve
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleAction(skill.id, 'reject')}
                                            >
                                                ❌ Reject
                                            </button>
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

export default SkillApprovals;
