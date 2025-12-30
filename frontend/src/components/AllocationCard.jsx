import React, { useState } from 'react';

const AllocationCard = ({ alloc, companyName, allocationValue }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isPending = alloc.assignmentStatus === 'PENDING';
    const isActive = alloc.assignmentStatus === 'ACTIVE';

    return (
        <div className="col">
            <div className={`card h-100 transition-all ${isExpanded ? 'border-primary shadow-none' : 'hover-shadow'}`} style={{ borderRadius: '15px', border: '1px solid rgba(0,0,0,0.08)' }}>
                {!isExpanded ? (
                    <div className="card-body p-4 d-flex flex-column text-center">
                        <div className="mb-3">
                            <h6 className="text-muted text-uppercase small fw-bold mb-2" style={{ letterSpacing: '1px' }}>
                                {companyName || 'Corporate Client'}
                            </h6>
                            <h5 className="fw-bold text-accent mb-0">
                                {alloc.projectName}
                            </h5>
                        </div>
                        <div className="mt-auto">
                            <button
                                className="btn btn-outline-accent btn-sm rounded-pill px-4 fw-bold"
                                onClick={() => setIsExpanded(true)}
                            >
                                View Project Details
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="card border-0 overflow-hidden h-100 shadow-none" style={{ borderRadius: '15px' }}>
                        <div
                            className={`card-header p-2 text-center border-0 d-flex justify-content-between align-items-center ${isPending ? 'bg-warning' : 'bg-accent'}`}
                        >
                            <h6 className="mb-0 fw-bold text-white flex-grow-1 text-center ps-4">Project Overview</h6>
                            <button
                                className="btn btn-sm text-white p-0 border-0"
                                onClick={() => setIsExpanded(false)}
                                title="Close"
                            >
                                <i className="bi bi-x-lg"></i>
                            </button>
                        </div>

                        <div className="card-body p-3">
                            {/* Badges & Status */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className={`badge rounded-pill px-2 py-1 small fw-bold ${isActive ? 'bg-success' : isPending ? 'bg-warning text-dark' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
                                    <i className={`bi ${isActive ? 'bi-check-circle-fill' : isPending ? 'bi-clock-history' : 'bi-info-circle'} me-1`}></i>
                                    {alloc.assignmentStatus}
                                </span>
                                <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.6rem' }}>
                                    {isActive ? 'Ongoing' : 'Pending'}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div className="bg-light rounded-3 p-3 border border-1 shadow-sm">
                                <div className="mb-2">
                                    <label className="text-muted d-block fw-bold text-uppercase mb-0" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Project Name</label>
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-rocket-takeoff text-accent me-2 small"></i>
                                        <span className="fw-bold text-dark small">{alloc.projectName}</span>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <label className="text-muted d-block fw-bold text-uppercase mb-0" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Client / Company</label>
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-building text-accent me-2 small"></i>
                                        <span className="fw-bold text-dark small">{companyName || 'External Client'}</span>
                                    </div>
                                </div>

                                <div className="row g-2">
                                    <div className="col-6 border-end">
                                        <label className="text-muted d-block fw-bold text-uppercase mb-0" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Billing</label>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-cash-stack text-accent me-2 small"></i>
                                            <span className="fw-bold text-dark small">{alloc.billingType || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="col-6 ps-2">
                                        <label className="text-muted d-block fw-bold text-uppercase mb-0" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Alloc</label>
                                        <div className="d-flex align-items-center">
                                            <i className="bi bi-pie-chart text-accent me-2 small"></i>
                                            <span className="fw-bold text-dark small">{allocationValue}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 pt-2 border-top">
                                    <label className="text-muted d-block fw-bold text-uppercase mb-0" style={{ fontSize: '0.6rem', letterSpacing: '1px' }}>Period</label>
                                    <div className="d-flex align-items-center">
                                        <i className="bi bi-calendar3 text-accent me-2 small"></i>
                                        <span className="fw-bold text-dark" style={{ fontSize: '0.7rem' }}>
                                            {alloc.startDate ? new Date(alloc.startDate).toLocaleDateString() : 'Start'}
                                            <i className="bi bi-arrow-right mx-1 text-muted"></i>
                                            {alloc.endDate ? new Date(alloc.endDate).toLocaleDateString() : 'Present'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-3">
                                <button
                                    className="btn btn-link text-accent fw-bold text-decoration-none p-0 d-inline-flex align-items-center small"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    <i className="bi bi-chevron-up me-1"></i> Minimize
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllocationCard;
