import React from 'react';

const ProfileSection = ({ profile, utilization, onNavigateToSkills }) => {
    if (!profile) return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary mb-3" role="status"></div>
            <p className="text-muted mb-0">Loading profile...</p>
        </div>
    );

    const assignments = utilization?.assignments || [];

    return (
        <div className="mx-auto" style={{ maxWidth: '900px' }}>
            {/* Profile Header Card */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                <div
                    className="card-header border-0 px-4 py-3"
                    style={{
                        backgroundColor: 'var(--profile-theme-color, var(--color-primary))',
                        minHeight: '120px'
                    }}
                >
                    <div className="d-flex justify-content-between align-items-start h-100">
                        <div className="d-flex align-items-center gap-4">
                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center shadow"
                                style={{
                                    width: '72px',
                                    height: '72px',
                                    backgroundColor: 'white',
                                    color: 'var(--profile-theme-color, var(--color-primary))',
                                    fontSize: '2.2rem'
                                }}
                            >
                                <i className="bi bi-person-fill"></i>
                            </div>

                            <div className="text-white">
                                <h3 className="fw-bold mb-1 text-white">
                                    {profile.firstName} {profile.lastName}
                                </h3>

                                <div className="d-flex align-items-center gap-2 opacity-75 small">
                                    <i className="bi bi-envelope"></i>
                                    {profile.email}
                                </div>

                                <span
                                    className="badge bg-white mt-3 px-3 py-1 rounded-pill"
                                    style={{ color: 'var(--profile-theme-color, var(--color-primary))' }}
                                >
                                    {profile.role}
                                </span>
                            </div>
                        </div>

                        <div className="text-end text-white">
                            <div className="font-monospace opacity-75 mb-3">
                                ID: {profile.id.substring(0, 8)}
                            </div>

                            {profile.managerName && (
                                <div className="text-end">
                                    <div className="text-uppercase fw-bold opacity-75 small mb-1" style={{ letterSpacing: '1px' }}>
                                        Reports To
                                    </div>
                                    <div className="text-white small d-flex align-items-center gap-2 justify-content-end">
                                        <i className="bi bi-person-workspace"></i>
                                        {profile.managerName}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="row g-4">
                {/* Assignments */}
                <div className="col-lg-7">
                    <div className="d-flex align-items-center mb-3">
                        <h5
                            className="fw-bold mb-0"
                            style={{ color: 'var(--profile-theme-color, var(--color-primary))' }}
                        >
                            <i className="bi bi-briefcase-fill me-2"></i>
                            Active Assignments
                        </h5>
                    </div>

                    <div className="custom-scroll" style={{ height: '240px', overflowY: 'auto', paddingRight: '5px' }}>
                        {assignments.length > 0 ? (
                            <div className="d-flex flex-column gap-3">
                                {assignments.map((assign, idx) => (
                                    <div key={idx} className="card border-0 shadow-sm bg-light rounded-3">
                                        <div className="card-body p-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="fw-bold mb-1 text-dark">{assign.projectName}</h6>
                                                    <div className="text-muted small">
                                                        <i className="bi bi-building me-1"></i>
                                                        {assign.companyName || profile.companyName || 'Corporate Client'}
                                                    </div>
                                                </div>
                                                <span className={`badge rounded-pill px-3 py-1 ${assign.billingType === 'BILLABLE' ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
                                                    {assign.billingType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5 border rounded-3 bg-light text-muted h-100 d-flex flex-column align-items-center justify-content-center">
                                <i className="bi bi-cup-hot display-4 d-block mb-2 opacity-50"></i>
                                Currently on Bench
                            </div>
                        )}
                    </div>
                </div>

                {/* Skills */}
                <div className="col-lg-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5
                            className="fw-bold mb-0"
                            style={{ color: 'var(--profile-theme-color, var(--color-primary))' }}
                        >
                            <i className="bi bi-lightning-charge-fill me-2"></i>
                            Skills
                        </h5>

                        {onNavigateToSkills && (
                            <button
                                className="btn btn-sm btn-outline-primary rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                                style={{
                                    width: '34px',
                                    height: '34px',
                                    color: 'var(--profile-theme-color, var(--color-primary))',
                                    borderColor: 'var(--profile-theme-color, var(--color-primary))'
                                }}
                                onClick={onNavigateToSkills}
                            >
                                <i className="bi bi-plus-lg"></i>
                            </button>
                        )}
                    </div>

                    <div className="card border-0 shadow-sm rounded-3 custom-scroll" style={{ height: '240px', overflowY: 'auto' }}>
                        <div className="card-body p-0">
                            {profile.skills && profile.skills.length > 0 ? (
                                <div className="list-group list-group-flush">
                                    {profile.skills
                                        .filter(s => s.status === 'APPROVED')
                                        .map(skill => (
                                            <div
                                                key={skill.id}
                                                className="list-group-item d-flex justify-content-between align-items-center px-3 py-2"
                                            >
                                                <span className="fw-medium">{skill.skillName}</span>
                                                <span
                                                    className={`badge rounded-pill ${skill.proficiencyLevel === 'ADVANCED'
                                                        ? 'bg-success'
                                                        : skill.proficiencyLevel === 'INTERMEDIATE'
                                                            ? 'bg-info text-dark'
                                                            : 'bg-secondary'
                                                        }`}
                                                    style={{ fontSize: '0.7rem' }}
                                                >
                                                    {skill.proficiencyLevel}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center p-4 text-muted h-100 d-flex align-items-center justify-content-center">
                                    No skills added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scroll::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                .custom-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.2);
                }
            `}</style>
        </div>
    );
};

export default ProfileSection;
