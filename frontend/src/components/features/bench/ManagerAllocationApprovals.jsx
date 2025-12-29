import React, { useState, useEffect } from 'react';
import { allocationsApi } from '../../../api/allocations';

const ManagerAllocationApprovals = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);

    // Modal State
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [modalComment, setModalComment] = useState('');
    const [modalReason, setModalReason] = useState('');

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await allocationsApi.getPendingRequests();
            // Initialize billing type if not present or just for UI state
            const data = response.data.map(req => ({
                ...req,
                id: req.id || req.assignmentId,
                selectedBillingType: req.billingType || 'BILLABLE'
            }));
            setRequests(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch requests', err);
            setError('Failed to load pending requests.');
        } finally {
            setLoading(false);
        }
    };

    const handleForward = async () => {
        setActionLoading(true);
        try {
            const requestState = requests.find(r => r.id === selectedRequest.id);
            const billingTypeToSubmit = requestState?.selectedBillingType || 'BILLABLE';

            await allocationsApi.forwardToHr(selectedRequest.id, modalComment, billingTypeToSubmit);
            setShowForwardModal(false);
            setModalComment('');
            fetchRequests();
        } catch (error) {
            console.error('Failed to forward request:', error);
            alert(error.response?.data?.message || 'Failed to forward request');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!modalReason.trim()) {
            alert('Rejection reason is mandatory');
            return;
        }
        setActionLoading(true);
        try {
            await allocationsApi.rejectRequest(selectedRequest.id, modalReason);
            setShowRejectModal(false);
            setModalReason('');
            fetchRequests();
        } catch (error) {
            console.error('Failed to reject request:', error);
            alert(error.response?.data?.message || 'Failed to reject request');
        } finally {
            setActionLoading(false);
        }
    };

    const openForwardModal = (req) => {
        setSelectedRequest(req);
        setModalComment('');
        setShowForwardModal(true);
    };

    const openRejectModal = (req) => {
        setSelectedRequest(req);
        setModalReason('');
        setShowRejectModal(true);
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="card shadow border-0 rounded-4 overflow-hidden mb-5">
            <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                <h3 className="fw-bold mb-0">Pending Allocation Requests</h3>
            </div>
            <div className="card-body p-0">
                {error ? <div className="alert alert-danger m-3">{error}</div> :
                    requests.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <p className="mb-0 fs-4">No pending allocation requests.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="px-4 py-3">Employee</th>
                                        <th className="py-3">Requested Project</th>
                                        <th className="py-3">Billing Type</th>
                                        <th className="px-4 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((req) => (
                                        <tr key={req.id}>
                                            <td className="px-4 py-3">
                                                <div className="fw-bold">{req.employeeName}</div>
                                                <div className="small text-muted">{req.employeeEmail}</div>
                                            </td>
                                            <td className="fw-bold text-primary">{req.projectName}</td>
                                            <td>
                                                <select
                                                    className="form-select form-select-sm border-2 rounded-3"
                                                    style={{ maxWidth: '140px' }}
                                                    value={req.selectedBillingType}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        setRequests(prev => prev.map(p =>
                                                            p.id === req.id ? { ...p, selectedBillingType: newVal } : p
                                                        ));
                                                    }}
                                                >
                                                    <option value="BILLABLE">Billable</option>
                                                    <option value="INVESTMENT">Investment</option>
                                                </select>
                                            </td>
                                            <td className="px-4 text-center">
                                                <div className="d-flex justify-content-center gap-2">
                                                    <button
                                                        className="btn btn-outline-primary btn-sm rounded-pill px-4"
                                                        onClick={() => openForwardModal(req)}
                                                        disabled={actionLoading}
                                                    >
                                                        Forward to HR
                                                    </button>
                                                    <button
                                                        className="btn btn-outline-danger btn-sm rounded-pill px-4"
                                                        onClick={() => openRejectModal(req)}
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

            {/* Forward Modal */}
            {showForwardModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">Forward to HR</h5>
                                <button type="button" className="btn-close" onClick={() => setShowForwardModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-3">Add comments for HR (optional):</p>
                                <textarea
                                    className="form-control mb-3"
                                    rows="3"
                                    value={modalComment}
                                    onChange={(e) => setModalComment(e.target.value)}
                                    placeholder="e.g., Recommend approval based on skills..."
                                ></textarea>

                                <div className="alert alert-light border small">
                                    <strong>Confirm Forwarding:</strong>
                                    <br />
                                    Assigning <strong>{requests.find(r => r.id === selectedRequest?.id)?.selectedBillingType}</strong> billing type.
                                </div>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowForwardModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary rounded-pill px-4" onClick={handleForward} disabled={actionLoading}>
                                    {actionLoading ? 'Forwarding...' : 'Forward Request'}
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
                        <div className="modal-content border-0 shadow rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-danger">Reject Request</h5>
                                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-3">Please provide a reason for rejection (mandatory):</p>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={modalReason}
                                    onChange={(e) => setModalReason(e.target.value)}
                                    placeholder="e.g., Skills do not match project requirements..."
                                ></textarea>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-light rounded-pill" onClick={() => setShowRejectModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-danger rounded-pill px-4" onClick={handleReject} disabled={actionLoading}>
                                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagerAllocationApprovals;
