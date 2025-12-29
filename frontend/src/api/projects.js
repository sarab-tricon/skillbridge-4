import api from './axios';

export const projectsApi = {
    getAllProjects: () => api.get('/projects'),
    getActiveProjects: () => api.get('/projects/active'),
    createProject: (projectData) => api.post('/projects', projectData),
    updateProject: (id, projectData) => api.put(`/projects/${id}`, projectData),
    deleteProject: (id) => api.delete(`/projects/${id}`),
    updateStatus: (id, statusData) => api.put(`/projects/${id}/status`, statusData),
};
