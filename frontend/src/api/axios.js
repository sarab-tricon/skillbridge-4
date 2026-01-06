import axios from 'axios';

const api = axios.create({
    baseURL: "http://3.110.41.177:8080/api",
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false,
});

// ============================================
// GET Request Deduplication
// Prevents concurrent duplicate GET requests
// ============================================
const pendingRequests = new Map();

const getCacheKey = (config) => {
    if (config.method?.toLowerCase() !== 'get') return null;
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// Request interceptor: Deduplicate concurrent GET requests
api.interceptors.request.use(
    (config) => {
        const cacheKey = getCacheKey(config);
        if (cacheKey && pendingRequests.has(cacheKey)) {
            // Return existing promise for duplicate request
            return pendingRequests.get(cacheKey).then(
                (response) => Promise.reject({ __deduplicated: true, response }),
                (error) => Promise.reject(error)
            );
        }

        // For new GET requests, we'll store the promise in response interceptor
        if (cacheKey) {
            config.__cacheKey = cacheKey;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================
// Auth Token Interceptor
// ============================================
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ============================================
// Response Interceptors
// ============================================

// Deduplication cleanup interceptor
api.interceptors.response.use(
    (response) => {
        const cacheKey = response.config?.__cacheKey;
        if (cacheKey) {
            pendingRequests.delete(cacheKey);
        }
        return response;
    },
    (error) => {
        // Handle deduplicated requests - return the cached response
        if (error?.__deduplicated) {
            return error.response;
        }
        const cacheKey = error.config?.__cacheKey;
        if (cacheKey) {
            pendingRequests.delete(cacheKey);
        }
        return Promise.reject(error);
    }
);

// 401 Unauthorized handler
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('Unauthorized access - logging out');
            localStorage.removeItem('token');
            // Redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Store pending request promises for deduplication
const originalRequest = api.request.bind(api);
api.request = function (config) {
    const promise = originalRequest(config);
    const cacheKey = config?.__cacheKey;
    if (cacheKey && !pendingRequests.has(cacheKey)) {
        pendingRequests.set(cacheKey, promise);
    }
    return promise;
};

export default api;
