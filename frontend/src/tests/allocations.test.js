import api from '../api/axios';
import { allocationsApi } from '../api/allocations';

jest.mock('../api/axios', () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
}));

describe('allocationsApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('createRequest calls api.post with correct data', async () => {
        api.post.mockResolvedValue({ data: { success: true } });
        await allocationsApi.createRequest(101);
        expect(api.post).toHaveBeenCalledWith('/allocation-requests', { projectId: 101 });
    });

    it('getPendingRequests calls api.get with correct url', async () => {
        api.get.mockResolvedValue({ data: [] });
        await allocationsApi.getPendingRequests();
        expect(api.get).toHaveBeenCalledWith('/allocation-requests/pending');
    });

    it('forwardToHr calls api.put with correct data', async () => {
        api.put.mockResolvedValue({ data: {} });
        await allocationsApi.forwardToHr(1, 'some comment', 'BILLABLE');
        expect(api.put).toHaveBeenCalledWith('/allocation-requests/1/forward', {
            comments: 'some comment',
            billingType: 'BILLABLE'
        });
    });

    it('rejectRequest calls api.put with correct data', async () => {
        api.put.mockResolvedValue({ data: {} });
        await allocationsApi.rejectRequest(2, 'reason');
        expect(api.put).toHaveBeenCalledWith('/allocation-requests/2/reject', { reason: 'reason' });
    });

    it('approveRequest calls api.put with empty object', async () => {
        api.put.mockResolvedValue({ data: {} });
        await allocationsApi.approveRequest(3);
        expect(api.put).toHaveBeenCalledWith('/allocation-requests/3/approve', {});
    });

    it('getMyRequests calls api.get with correct url', async () => {
        api.get.mockResolvedValue({ data: [] });
        await allocationsApi.getMyRequests();
        expect(api.get).toHaveBeenCalledWith('/allocation-requests/my');
    });
});
