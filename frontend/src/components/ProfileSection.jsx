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
                <div className="card-header border-0 p-4" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #2a5298 100%)' }}>
                    <div className="d-flex align-items-center gap-4">
                        <div className="rounded-circle d-flex align-items-center justify-content-center shadow"
                            style={{ width: '80px', height: '80px', backgroundColor: 'white', color: 'var(--color-primary)', fontSize: '2.5rem' }}>
                            <i className="bi bi-person-fill"></i>
                        </div>
                        <div className="flex-grow-1 text-white">
                            <h3 className="fw-bold mb-1">{profile.firstName} {profile.lastName}</h3>
                            <div className="d-flex align-items-center gap-2 opacity-75">
                                <i className="bi bi-envelope"></i>
                                <span>{profile.email}</span>
                            </div>
                        </div>                                          </div>
                    <div className="text-end text-white">
                        <div className="badge bg-white text-primary mb-2 px-3 py-2 rounded-pill fs-6">
                            {profile.role}
                        </div>
                        <div className="small opacity-75 font-monospace">ID: {profile.id.substring(0, 8)}</div>
                    </div>
                </div>
            </div>
            <div className="card-body p-4">
                <div className="row g-4">
                    {/* Assignments Column */}
                    <div className="col-lg-7">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0 text-primary">
                                <i className="bi bi-briefcase-fill me-2"></i>Active Assignments
                            </h5>
                            <span className="badge bg-light text-dark border">
                                Total: {utilization?.totalUtilization || 0}%
                            </span>
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
                                                <div className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
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
                        {profile.managerName && (
                            <div className="mt-4 p-3 rounded border bg-white">
                                <small className="text-muted text-uppercase fw-bold d-block mb-2">Reporting Manager</small>
                                <div className="d-flex align-items-center gap-2">
                                    <div className="rounded-circle bg-secondary bg-opacity-10 col-auto d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                                        <i className="bi bi-person-workspace text-secondary"></i>
                                    </div>
                                    <span className="fw-semibold">{profile.managerName}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Skills Column */}
                    <div className="col-lg-5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0 text-primary">
                                <i className="bi bi-lightning-charge-fill me-2"></i>Skills
                            </h5>
                            {onNavigateToSkills && (
                                <button
                                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                    onClick={onNavigateToSkills}
                                >
                                    Manage
                                </button>
                            )}
                        </div>

                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-0">
                                {profile.skills && profile.skills.length > 0 ? (
                                    <div className="list-group list-group-flush rounded-3">
                                        {profile.skills.map(skill => (
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