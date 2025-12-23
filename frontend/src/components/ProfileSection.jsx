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
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted small">Loading...</p>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger py-2">{error}</div>;
    }

    if (!profile) return null;

    return (
<<<<<<< HEAD
        <div className="mx-auto" style={{ maxWidth: '700px' }}>
            <div className="card shadow-sm border-0 rounded-3">
                {/* Compact Header */}
                <div className="card-header bg-primary text-white py-2 px-3 border-0">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px', fontSize: '1.25rem' }}>
                            <i className="bi bi-person-fill"></i>
                        </div>
                        <div className="flex-grow-1">
                            <h6 className="fw-bold mb-0">{profile.firstName} {profile.lastName}</h6>
                            <small className="opacity-75">{profile.email}</small>
                        </div>
                        <div className="d-flex gap-2">
                            <div className="bg-light text-dark rounded px-2 py-1 text-center">
                                <div className="text-muted text-uppercase" style={{ fontSize: '0.55rem' }}>Role</div>
                                <div className="fw-semibold small">{profile.role}</div>
=======
        <div className="card shadow-sm border-0 overflow-hidden rounded-4">
            <div className="card-header bg-primary text-white p-3 text-center border-0">
                <div className="mb-2">
                    <div className="bg-white text-primary rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm" style={{ width: '60px', height: '60px' }}>
                        <i className="bi bi-person-fill"></i>
                    </div>
                </div>
                <h4 className="fw-bold mb-0">{profile.firstName} {profile.lastName}</h4>
                <p className="mb-0 opacity-75 small">{profile.email}</p>
            </div>

            <div className="card-body p-3">
                {/* Personal Info Row */}
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="p-2 border rounded-3 bg-light h-100 text-center">
                            <h6 className="text-muted text-uppercase x-small fw-bold mb-1">First Name</h6>
                            <span className="fw-bold">{profile.firstName}</span>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="p-2 border rounded-3 bg-light h-100 text-center">
                            <h6 className="text-muted text-uppercase x-small fw-bold mb-1">Last Name</h6>
                            <span className="fw-bold">{profile.lastName}</span>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="p-2 border rounded-3 bg-light h-100 text-center">
                            <h6 className="text-muted text-uppercase x-small fw-bold mb-1">Role</h6>
                            <span className="fw-bold">{profile.role}</span>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="p-2 border rounded-3 bg-light h-100 text-center">
                            <h6 className="text-muted text-uppercase x-small fw-bold mb-1">Account ID</h6>
                            <span className="small font-monospace text-muted text-truncate d-block">{profile.id.substring(0, 8)}...</span>
                        </div>
                    </div>
                </div>

                {/* Manager Info (Conditional) */}
                {profile.managerName && (
                    <div className="mb-4">
                        <div className="p-2 border rounded-3 bg-light d-flex align-items-center justify-content-between px-3">
                            <span className="text-muted text-uppercase x-small fw-bold">Reporting Manager</span>
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-people text-info"></i>
                                <span className="fw-bold">{profile.managerName}</span>
>>>>>>> 9cb2a1f10e65666ce2f54f9bb3fb5eb5ae392049
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

                {/* Compact Body */}
                <div className="card-body p-3">
                    <div className="row g-3">
                        {/* Project Details */}
                        <div className="col-md-6">
                            <h6 className="fw-bold text-primary mb-2 small">
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

<<<<<<< HEAD
                        {/* Skills */}
                        <div className="col-md-6">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="fw-bold text-primary mb-0 small">
                                    <i className="bi bi-lightning-charge me-1"></i>My Skills
                                </h6>
                                {onNavigateToSkills && (
                                    <button
                                        className="btn btn-sm btn-outline-primary rounded-circle p-0 d-flex align-items-center justify-content-center"
                                        style={{ width: '24px', height: '24px' }}
                                        onClick={onNavigateToSkills}
                                        title="Add more skills"
                                    >
                                        <i className="bi bi-plus" style={{ fontSize: '1rem' }}></i>
                                    </button>
                                )}
=======
                    {/* My Skills Column */}
                    <div className="col-md-6 ps-md-4">
                        <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-lightning-charge me-2"></i>My Skills</h6>
                        {profile.skills && profile.skills.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                                {profile.skills.map(skill => (
                                    <div key={skill.id} className="d-flex align-items-center border rounded-pill px-2 py-1 bg-white shadow-sm">
                                        <span className={`badge rounded-circle me-2 p-1 ${skill.proficiencyLevel === 'ADVANCED' ? 'bg-success' :
                                            skill.proficiencyLevel === 'INTERMEDIATE' ? 'bg-info' : 'bg-secondary'
                                            }`} style={{ width: '8px', height: '8px' }}> </span>
                                        <span className="fw-bold text-dark me-1">{skill.skillName}</span>
                                        <span className="text-muted">({skill.proficiencyLevel.substring(0, 3)})</span>
                                    </div>
                                ))}
>>>>>>> 9cb2a1f10e65666ce2f54f9bb3fb5eb5ae392049
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
        </div>
    );
};

export default ProfileSection;