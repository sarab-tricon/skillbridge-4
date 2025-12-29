import React, { useState, useEffect } from 'react';
import { allocationsApi } from '../../../api/allocations';

const AllocationApprovals = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    // Modals State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Form inputs
    // Billing Type is now read-only from request
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await allocationsApi.getPendingRequests();
            setRequests(response.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch requests', err);
            setError('Failed to load pending requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await allocationsApi.approveRequest(selectedRequest.assignmentId); // No billing type needed
            setShowApproveModal(false);
            fetchRequests();
        } catch (err) {
            console.error('Failed to approve:', err);
            alert('Failed to approve request: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            alert('Rejection reason is mandatory.');
            return;
        }
        setActionLoading(true);
        try {
            await allocationsApi.rejectRequest(selectedRequest.assignmentId, rejectReason);
            setShowRejectModal(false);
            setRejectReason('');
            fetchRequests();
        } catch (err) {
            console.error('Failed to reject:', err);
            alert('Failed to reject request: ' + (err.response?.data?.message || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const openApprove = (req) => {
        setSelectedRequest(req);
        // Billing type is already in req
        setShowApproveModal(true);
    };

    const openReject = (req) => {
        setSelectedRequest(req);
        setRejectReason('');
        setShowRejectModal(true);
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '5px solid var(--color-primary)' }}>
            <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="card-title fw-bold m-0 text-dark">
                        <i className="bi bi-check-circle-fill me-2 text-primary"></i>
                    </h3>
                    <span className="badge bg-primary rounded-pill px-3">{requests.length} Pending</span>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                {requests.length === 0 ? (
                    <div className="text-center py-5 text-muted border rounded bg-light">
                        <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                        <p>No pending allocation requests.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Employee</th>
                                    <th>Project</th>
                                    <th>Requested At</th>
                                    <th className="text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map(req => (
                                    <tr key={req.assignmentId}>
                                        <td className="fw-bold">{req.employeeName}</td>
                                        <td className="text-primary">{req.projectName}</td>
                                        <td className="small text-muted">{new Date(req.requestedAt).toLocaleDateString()}</td>
                                        <td className="text-center">
                                            <button className="btn btn-sm btn-success rounded-pill px-3 me-2" onClick={() => openApprove(req)}>
                                                Approve
                                            </button>
                                            <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => openReject(req)}>
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4 border-0 shadow">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold">Approve Allocation</h5>
                                <button className="btn-close" onClick={() => setShowApproveModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Allocating <strong>{selectedRequest?.employeeName}</strong> to <strong>{selectedRequest?.projectName}</strong>.</p>

                                {selectedRequest?.managerName && (
                                    <div className="mb-3 px-3 py-2 bg-light rounded border-start border-4 border-info">
                                        <label className="small text-muted text-uppercase fw-bold d-block mb-1">Forwarded by Manager</label>
                                        <span className="fw-bold text-dark">{selectedRequest.managerName}</span>
                                    </div>
                                )}

                                <div className="mb-3 px-3 py-2 bg-white rounded border">
                                    <label className="form-label fw-bold small text-muted text-uppercase mb-1">Billing Type</label>
                                    <div className="fs-5 fw-bold text-dark">
                                        {selectedRequest?.billingType || 'BILLABLE'}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-light rounded-pill" onClick={() => setShowApproveModal(false)}>Cancel</button>
                                <button className="btn btn-success rounded-pill px-4" onClick={handleApprove} disabled={actionLoading}>
                                    {actionLoading ? 'Approving...' : 'Confirm & Allocate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content rounded-4 border-0 shadow">
                            <div className="modal-header border-0">
                                <h5 className="modal-title fw-bold text-danger">Reject Request</h5>
                                <button className="btn-close" onClick={() => setShowRejectModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-2">Reason (Mandatory):</p>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Why is this request being rejected?"
                                ></textarea>
                            </div>
                            <div className="modal-footer border-0">
                                <button className="btn btn-light rounded-pill" onClick={() => setShowRejectModal(false)}>Cancel</button>
                                <button className="btn btn-danger rounded-pill px-4" onClick={handleReject} disabled={actionLoading}>
                                    {actionLoading ? 'Rejecting...' : 'Reject Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllocationApprovals;
