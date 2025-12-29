import api from './axios';

export const usersApi = {
    // Fetch users by role
    getManagers: () => api.get('/users/managers'),
    getHRs: () => api.get('/users/hrs'),
    getEmployees: () => api.get('/users/employees'),

    // Bench & Allocation
    getBenchUsers: () => api.get('/users/bench'),
    getMyTeam: () => api.get('/users/team'),
    getAllocatableUsers: () => api.get('/users/allocatable'),

    // User Management
    createUser: (userData) => api.post('/users', userData),
    getCurrentUser: () => api.get('/users/me'),
};
