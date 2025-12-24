import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ProfileSection = ({ onNavigateToSkills }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/me');
            setProfile(response.data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
            setError('Failed to load profile details.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-4">
                <div className="spinner-border" style={{ color: 'var(--color-primary)' }} role="status"></div>
                <p className="mt-2 text-muted small">Loading...</p>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger py-2">{error}</div>;
    }

    if (!profile) return null;

    return (
        <div className="mx-auto" style={{ maxWidth: '700px' }}>
            <div className="card shadow-sm border-0 rounded-3">
                {/* Header */}
                <div className="card-header py-2 px-3 border-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                    <div className="d-flex align-items-center gap-3">
                        <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '1.25rem', backgroundColor: 'white', color: 'var(--color-accent)' }}>
                            <i className="bi bi-person-fill"></i>
                        </div>
                        <div className="flex-grow-1 text-white">
                            <h6 className="fw-bold mb-0">{profile.firstName} {profile.lastName}</h6>
                            <small className="opacity-75">{profile.email}</small>
                        </div>
                        <div className="d-flex gap-2">
                            <div className="bg-light text-dark rounded px-2 py-1 text-center">
                                <div className="text-muted text-uppercase" style={{ fontSize: '0.55rem' }}>Role</div>
                                <div className="fw-semibold small">{profile.role}</div>
                            </div>
                            <div className="bg-light text-dark rounded px-2 py-1 text-center">
                                <div className="text-muted text-uppercase" style={{ fontSize: '0.55rem' }}>ID</div>
                                <div className="fw-semibold small font-monospace">{profile.id.substring(0, 8)}...</div>
                            </div>
                            {profile.managerName && (
                                <div className="bg-light text-dark rounded px-2 py-1 text-center">
                                    <div className="text-muted text-uppercase" style={{ fontSize: '0.55rem' }}>Manager</div>
                                    <div className="fw-semibold small">{profile.managerName}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="card-body p-3">
                    <div className="row g-3">
                        {/* Project Details */}
                        <div className="col-md-6">
                            <h6 className="fw-bold mb-2 small" style={{ color: 'var(--color-accent)' }}>
                                <i className="bi bi-briefcase me-1"></i>Project Details
                            </h6>
                            <table className="table table-sm table-borderless mb-0 small">
                                <tbody>
                                    <tr>
                                        <td className="text-muted ps-0 py-1">Company</td>
                                        <td className="fw-semibold text-end">{profile.companyName || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0 py-1">Project</td>
                                        <td className="fw-semibold text-end">{profile.projectName || 'Bench'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0 py-1">Start Date</td>
                                        <td className="fw-semibold text-end">{profile.startDate || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0 py-1">End Date</td>
                                        <td className="fw-semibold text-end">{profile.endDate || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0 py-1">Billing</td>
                                        <td className="text-end">
                                            <span className={`badge ${profile.billingStatus === 'BILLABLE' ? 'bg-success' : 'bg-secondary'}`}>
                                                {profile.billingStatus || 'N/A'}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0 py-1">Status</td>
                                        <td className="text-end">
                                            <span className={`badge ${profile.assignmentStatus === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                                                {profile.assignmentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Skills */}
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="fw-bold mb-0 small" style={{ color: 'var(--color-accent)' }}>
                                    <i className="bi bi-lightning-charge me-1"></i>My Skills
                                </h6>
                                {onNavigateToSkills && (
                                    <button
                                        className="btn btn-sm rounded-circle p-0 d-flex align-items-center justify-content-center add-skill-btn"
                                        style={{ width: '24px', height: '24px', border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}
                                        onClick={onNavigateToSkills}
                                        title="Add more skills"
                                    >
                                        <i className="bi bi-plus" style={{ fontSize: '1rem' }}></i>
                                    </button>
                                )}
                            </div>
                            {profile.skills && profile.skills.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                    {profile.skills.map(skill => (
                                        <span key={skill.id} className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.75rem' }}>
                                            <span className={`d-inline-block rounded-circle me-1 ${skill.proficiencyLevel === 'ADVANCED' ? 'bg-success' :
                                                    skill.proficiencyLevel === 'INTERMEDIATE' ? 'bg-info' : 'bg-secondary'
                                                }`} style={{ width: '6px', height: '6px' }}></span>
                                            {skill.skillName}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted small mb-0">No skills added yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                .add-skill-btn:hover {
                    background-color: var(--color-accent) !important;
                    color: white !important;
                }
            `}</style>
        </div>
    );
};

export default ProfileSection;