import axios from 'axios';

jest.mock('axios', () => {
    const mockInstance = {
        interceptors: {
            request: { use: jest.fn(), eject: jest.fn() },
            response: { use: jest.fn(), eject: jest.fn() },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        request: jest.fn(),
        defaults: { headers: { common: {} } }
    };
    return {
        create: jest.fn(() => mockInstance),
        interceptors: {
            request: { use: jest.fn(), eject: jest.fn() },
            response: { use: jest.fn(), eject: jest.fn() },
        },
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        request: jest.fn(),
    };
});

// Import after mock
import api from '../api/axios';

describe('api axios instance', () => {
    let mockStorage = {};
    let authReqInterceptor;
    let dedupeReqInterceptor;
    let cleanupResHandler;
    let cleanupErrHandler;
    let authErrHandler;

    beforeAll(() => {
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn((key) => mockStorage[key] || null),
                setItem: jest.fn((key, value) => { mockStorage[key] = value; }),
                removeItem: jest.fn((key) => { delete mockStorage[key]; }),
                clear: jest.fn(() => { mockStorage = {}; })
            },
            configurable: true
        });

        const mockAxiosInstance = axios.create();
        const reqCalls = mockAxiosInstance.interceptors.request.use.mock.calls;
        const resCalls = mockAxiosInstance.interceptors.response.use.mock.calls;

        dedupeReqInterceptor = reqCalls[0][0];
        authReqInterceptor = reqCalls[1][0];
        cleanupResHandler = resCalls[0][0];
        cleanupErrHandler = resCalls[0][1];
        authErrHandler = resCalls[1][1];
    });

    beforeEach(() => {
        mockStorage = {};
        jest.clearAllMocks();
    });

    it('should generate cache key for GET requests', () => {
        const config = { method: 'get', url: '/foo', params: { x: 1 } };
        const result = dedupeReqInterceptor(config);
        expect(result.__cacheKey).toBe('get:/foo:{"x":1}');
    });

    it('should attach Authorization header', () => {
        localStorage.setItem('token', 'abc');
        const config = { headers: {} };
        const result = authReqInterceptor(config);
        expect(result.headers.Authorization).toBe('Bearer abc');
    });

    it('should handle 401 response by removing token', async () => {
        const error = { response: { status: 401 }, config: {} };
        // Avoid mocking window.location.href to prevent JSDOM issues
        try {
            await authErrHandler(error);
        } catch (e) { /* expected */ }
        expect(localStorage.removeItem).toHaveBeenCalledWith('token');
    });

    it('should cleanup on response success', () => {
        const response = { config: { __cacheKey: 'some-key' } };
        const result = cleanupResHandler(response);
        expect(result).toBe(response);
    });

    it('should return cached response for deduplicated items', () => {
        const error = { __deduplicated: true, response: { data: 'ok' } };
        const result = cleanupErrHandler(error);
        expect(result).toEqual({ data: 'ok' });
    });

    it('should cleanup on response error', async () => {
        const error = { config: { __cacheKey: 'some-key' } };
        try {
            await cleanupErrHandler(error);
        } catch (e) {
            // expected
        }
    });
});
