import React from 'react';

const ProfileSection = ({ profile, utilization, onNavigateToSkills }) => {
    if (!profile) return (
        <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Loading profile...</p>
        </div>
    );

    const assignments = utilization?.assignments || [];

    return (
        <div className="mx-auto" style={{ maxWidth: '800px' }}>
            <div className="card shadow-sm border-0 rounded-3 overflow-hidden">
                {/* Header */}
                <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(135deg, var(--profile-theme-color, var(--color-primary)) 0%, var(--profile-theme-dark, #2a5298) 100%)', minHeight: '140px' }}>
                    <div className="d-flex justify-content-between h-100">
                        <div className="d-flex align-items-center gap-4">
                            <div className="rounded-circle d-flex align-items-center justify-content-center shadow"
                                style={{ width: '80px', height: '80px', backgroundColor: 'white', color: 'var(--profile-theme-color, var(--color-primary))', fontSize: '2.5rem' }}>
                                <i className="bi bi-person-fill"></i>
                            </div>
                            <div className="text-white">
                                <h3 className="fw-bold mb-1">{profile.firstName} {profile.lastName}</h3>
                                <div className="d-flex align-items-center gap-2 opacity-75">
                                    <i className="bi bi-envelope"></i>
                                    <span className="small">{profile.email}</span>
                                </div>
                                <div className="badge bg-white mt-2 px-3 py-1 rounded-pill" style={{ color: 'var(--profile-theme-color, var(--color-primary))' }}>
                                    {profile.role}
                                </div>
                            </div>
                        </div>
                        <div className="d-flex flex-column align-items-end justify-content-between text-white">
                            <div className="font-monospace opacity-75" style={{ fontSize: '1.1rem' }}>ID: {profile.id.substring(0, 8)}</div>
                            {profile.managerName && (
                                <div className="text-end mt-auto pt-3">
                                    <div className="opacity-75 text-uppercase fw-bold mb-1" style={{ letterSpacing: '1px' }}>Reporting To</div>
                                    <div className="fs-3 fw-bold d-flex align-items-center gap-2">
                                        <i className="bi bi-person-workspace"></i>
                                        {profile.managerName}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-body p-4">
                <div className="row g-4">
                    {/* Assignments Column */}
                    <div className="col-lg-7">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0" style={{ color: 'var(--profile-theme-color, var(--color-primary))' }}>
                                <i className="bi bi-briefcase-fill me-2"></i>Active Assignments
                            </h5>
                        </div>

                        {assignments.length > 0 ? (
                            <div className="d-flex flex-column gap-3">
                                {assignments.map((assign, idx) => (
                                    <div key={idx} className="card border-0 shadow-sm bg-light">
                                        <div className="card-body p-3">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                    <h6 className="fw-bold mb-1">{assign.projectName}</h6>
                                                    <small className="text-muted d-block">{profile.companyName}</small>
                                                </div>
                                                <span className={`badge ${assign.billingType === 'BILLABLE' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {assign.billingType}
                                                </span>
                                            </div>

                                            <div className="d-flex align-items-center gap-3 mb-2">
                                                <div className="badge bg-white text-dark border">
                                                    <i className="bi bi-person-gear me-1"></i>
                                                    {assign.projectRole || 'Developer'}
                                                </div>
                                                <div className="badge bg-opacity-10 border" style={{ backgroundColor: 'rgba(var(--profile-theme-rgb, 156, 198, 219), 0.1)', color: 'var(--profile-theme-color, var(--color-primary))', borderColor: 'var(--profile-theme-color, var(--color-primary))' }}>
                                                    {assign.allocationPercent}%
                                                </div>
                                            </div>

                                            <div className="small text-muted border-top pt-2 mt-2">
                                                <i className="bi bi-calendar-range me-2"></i>
                                                {new Date(assign.startDate).toLocaleDateString()} - {assign.endDate ? new Date(assign.endDate).toLocaleDateString() : 'Ongoing'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 border rounded bg-light text-muted">
                                <i className="bi bi-cup-hot display-4 mb-2 d-block opacity-50"></i>
                                Currently on Bench
                            </div>
                        )}
                        {/* Manager Info */}

                    </div>

                    {/* Skills Column */}
                    <div className="col-lg-5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0" style={{ color: 'var(--profile-theme-color, var(--color-primary))' }}>
                                <i className="bi bi-lightning-charge-fill me-2"></i>Skills
                            </h5>
                            {onNavigateToSkills && (
                                <button
                                    className="btn btn-sm btn-outline-primary rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center"
                                    style={{ width: '32px', height: '32px', color: 'var(--profile-theme-color, var(--color-primary))', borderColor: 'var(--profile-theme-color, var(--color-primary))' }}
                                    onClick={onNavigateToSkills}
                                >
                                    <i className="bi bi-plus-lg"></i>
                                </button>
                            )}
                        </div>

                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-0">
                                {profile.skills && profile.skills.length > 0 ? (
                                    <div className="list-group list-group-flush rounded-3">
                                        {profile.skills.filter(s => s.status === 'APPROVED').map(skill => (
                                            <div key={skill.id} className="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
                                                <span className="fw-medium">{skill.skillName}</span>
                                                <span className={`badge rounded-pill ${skill.proficiencyLevel === 'ADVANCED' ? 'bg-success' :
                                                    skill.proficiencyLevel === 'INTERMEDIATE' ? 'bg-info text-dark' : 'bg-secondary'
                                                    }`} style={{ fontSize: '0.7rem' }}>
                                                    {skill.proficiencyLevel}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-4 text-muted">
                                        No skills added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileSection;