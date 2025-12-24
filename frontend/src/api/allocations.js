import api from './axios';

export const allocationsApi = {
    // Create Request (Employee)
    createRequest: (projectId) => api.post('/allocation-requests', { projectId }),

    // Get Pending Requests (Manager/HR)
    getPendingRequests: () => api.get('/allocation-requests/pending'),

    // Forward to HR (Manager)
    forwardToHr: (requestId, comments, billingType) => api.put(`/allocation-requests/${requestId}/forward`, { comments, billingType }),

    // Reject (Manager/HR)
    rejectRequest: (requestId, reason) => api.put(`/allocation-requests/${requestId}/reject`, { reason }),

    // Approve (HR) - No billingType needed anymore
    approveRequest: (requestId) => api.put(`/allocation-requests/${requestId}/approve`, {}),

    // Get My Requests (Employee)
    getMyRequests: () => api.get('/allocation-requests/my')
};
