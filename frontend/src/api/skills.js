import api from './axios';

export const skillsApi = {
    // Catalog
    getCatalog: () => api.get('/catalog/skills'),
    addCatalogSkill: (skillData) => api.post('/catalog/skills', skillData),
    deleteCatalogSkill: (id) => api.delete(`/catalog/skills/${id}`),

    // Employee Skills
    getMySkills: () => api.get('/skills/my'),
    searchEmployeesBySkill: (skillName) => api.get(`/skills/search?skillName=${skillName}`),
    searchTalent: (skills) => {
        const skillsQuery = skills.map(s => `skills=${encodeURIComponent(s)}`).join('&');
        return api.get(`/skills/search?${skillsQuery}`);
    },
    addSkill: (skillData) => api.post('/skills', skillData),
    updateSkill: (id, skillData) => api.put(`/skills/${id}`, skillData),
    deleteSkill: (id) => api.delete(`/skills/${id}`),
    // Manager/HR Verification
    getPendingSkills: () => api.get('/skills/pending'),
    verifySkill: (id, status) => api.put(`/skills/${id}/verify`, { status }),
};
