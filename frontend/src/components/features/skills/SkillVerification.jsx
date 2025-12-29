import React, { useState, useEffect } from 'react';
import { skillsApi } from '../../../api/skills';

const SkillVerification = () => {
    const [pendingSkills, setPendingSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPendingSkills();
    }, []);

    const fetchPendingSkills = async () => {
        setLoading(true);
        try {
            const response = await skillsApi.getPendingSkills();
            setPendingSkills(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching pending skills:', err);
            setError('Failed to load pending skills.');
        } finally {
            setLoading(false);
        }
    };

    const handleSkillAction = async (skillId, status) => {
        setActionLoading(true);
        try {
            await skillsApi.verifySkill(skillId, status);
            fetchPendingSkills();
        } catch (err) {
            console.error(`Error ${status}ing skill:`, err);
            alert(`Failed to ${status === 'APPROVED' ? 'verify' : 'reject'} skill.`);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-5">
            <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                <h3 className="fw-bold mb-0">Pending Skill Verifications</h3>
            </div>
            <div className="card-body p-0">
                {error ? <div className="alert alert-danger m-3">{error}</div> :
                    pendingSkills.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-check-circle fs-1 opacity-25 d-block mb-3"></i>
                            <p className="mb-0 fs-4">All skill requests have been processed.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="px-4 py-3">Employee</th>
                                        <th className="py-3">Skill</th>
                                        <th className="py-3">Level</th>
                                        <th className="px-4 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingSkills.map((skill) => (
                                        <tr key={skill.id}>
                                            <td className="px-4 py-3">
                                                <div className="fw-bold">{skill.employeeName}</div>
                                                <div className="small text-muted">{skill.employeeEmail}</div>
                                            </td>
                                            <td className="fw-bold">{skill.skillName}</td>
                                            <td><span className="badge border border-dark text-dark fw-normal rounded-pill px-3">{skill.proficiencyLevel}</span></td>
                                            <td className="px-4 text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        className="btn btn-success btn-sm rounded-pill px-4"
                                                        onClick={() => handleSkillAction(skill.id, 'APPROVED')}
                                                        disabled={actionLoading}
                                                    >
                                                        Verify
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm rounded-pill px-4"
                                                        onClick={() => handleSkillAction(skill.id, 'REJECTED')}
                                                        disabled={actionLoading}
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
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

export default SkillVerification;
