import React, { useState, useEffect } from 'react';
import api from '../api/axios';

const ProfileSection = () => {
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
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="mt-2 text-muted">Loading profile...</p>
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    if (!profile) return null;

    return (
        <div className="card shadow-sm border-0 overflow-hidden rounded-4">
            <div className="card-header bg-primary text-white p-3 text-center border-0">
                <div className="mb-2">
                    <div className="bg-white text-primary rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm" style={{ width: '60px', height: '60px', fontSize: '1.5rem' }}>
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
                            <h6 className="text-muted text-uppercase x-small fw-bold mb-1" style={{ fontSize: '0.7rem' }}>First Name</h6>
                            <span className="fw-bold">{profile.firstName}</span>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="p-2 border rounded-3 bg-light h-100 text-center">
                            <h6 className="text-muted text-uppercase x-small fw-bold mb-1" style={{ fontSize: '0.7rem' }}>Last Name</h6>
                            <span className="fw-bold">{profile.lastName}</span>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="p-2 border rounded-3 bg-light h-100 text-center">
                            <h6 className="text-muted text-uppercase x-small fw-bold mb-1" style={{ fontSize: '0.7rem' }}>Role</h6>
                            <span className="fw-bold">{profile.role}</span>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="p-2 border rounded-3 bg-light h-100 text-center">
                            <h6 className="text-muted text-uppercase x-small fw-bold mb-1" style={{ fontSize: '0.7rem' }}>Account ID</h6>
                            <span className="small font-monospace text-muted text-truncate d-block">{profile.id.substring(0, 8)}...</span>
                        </div>
                    </div>
                </div>

                {/* Manager Info (Conditional) */}
                {profile.managerName && (
                    <div className="mb-4">
                        <div className="p-2 border rounded-3 bg-light d-flex align-items-center justify-content-between px-3">
                            <span className="text-muted text-uppercase x-small fw-bold" style={{ fontSize: '0.7rem' }}>Reporting Manager</span>
                            <div className="d-flex align-items-center gap-2">
                                <i className="bi bi-people text-info"></i>
                                <span className="fw-bold">{profile.managerName}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="row g-4">
                    {/* Project Details Column */}
                    <div className="col-md-6 border-end-md">
                        <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-briefcase me-2"></i>Project Details</h6>
                        <div className="table-responsive">
                            <table className="table table-sm table-borderless align-middle mb-0 small">
                                <tbody>
                                    <tr>
                                        <td className="text-muted ps-0">Company</td>
                                        <td className="fw-bold text-end">{profile.companyName || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0">Project</td>
                                        <td className="fw-bold text-end">{profile.projectName || 'Bench'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0">Start Date</td>
                                        <td className="fw-bold text-end">{profile.startDate || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0">End Date</td>
                                        <td className="fw-bold text-end">{profile.endDate || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0">Billing</td>
                                        <td className="text-end">
                                            {profile.billingStatus ? (
                                                <span className={`badge rounded-pill ${profile.billingStatus === 'BILLABLE' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {profile.billingStatus}
                                                </span>
                                            ) : 'N/A'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted ps-0">Status</td>
                                        <td className="text-end">
                                            <span className={`badge rounded-pill ${profile.assignmentStatus === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                                                {profile.assignmentStatus}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* My Skills Column */}
                    <div className="col-md-6 ps-md-4">
                        <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-lightning-charge me-2"></i>My Skills</h6>
                        {profile.skills && profile.skills.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                                {profile.skills.map(skill => (
                                    <div key={skill.id} className="d-flex align-items-center border rounded-pill px-2 py-1 bg-white shadow-sm" style={{ fontSize: '0.85rem' }}>
                                        <span className={`badge rounded-circle me-2 p-1 ${skill.proficiencyLevel === 'ADVANCED' ? 'bg-success' :
                                                skill.proficiencyLevel === 'INTERMEDIATE' ? 'bg-info' : 'bg-secondary'
                                            }`} style={{ width: '8px', height: '8px' }}> </span>
                                        <span className="fw-bold text-dark me-1">{skill.skillName}</span>
                                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>({skill.proficiencyLevel.substring(0, 3)})</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-light rounded-3 border border-dashed">
                                <p className="text-muted small mb-0">No skills verified yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                @media (min-width: 768px) {
                    .border-end-md { border-right: 1px solid #dee2e6; }
                }
            `}</style>
        </div>
    );
};

export default ProfileSection;
