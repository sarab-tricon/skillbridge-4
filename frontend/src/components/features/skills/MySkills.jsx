import React, { useState, useEffect } from 'react';
import { skillsApi } from '../../../api/skills';
import api from '../../../api/axios';

const MySkills = () => {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [catalogSkills, setCatalogSkills] = useState([]);

    // Form State
    const [newSkill, setNewSkill] = useState({ skillName: '', proficiencyLevel: 'BEGINNER' });
    const [editingSkill, setEditingSkill] = useState(null);
    const [addingSkill, setAddingSkill] = useState(false);
    const [addSkillError, setAddSkillError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedSkillLevel, setSelectedSkillLevel] = useState('BEGINNER');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mySkillsRes, catalogRes] = await Promise.all([
                skillsApi.getMySkills(),
                skillsApi.getCatalog()
            ]);
            setSkills(mySkillsRes.data);
            setCatalogSkills(catalogRes.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load skills.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        const isDuplicate = skills.some(s => s.skillName.toLowerCase() === newSkill.skillName.toLowerCase());
        if (isDuplicate) {
            setAddSkillError(`You already have "${newSkill.skillName}" in your list.`);
            return;
        }

        setAddingSkill(true);
        setAddSkillError(null);
        setSuccessMessage(null);
        try {
            await skillsApi.addSkill(newSkill);
            setNewSkill({ skillName: '', proficiencyLevel: 'BEGINNER' });
            setSuccessMessage('Skill added successfully!');
            const res = await skillsApi.getMySkills();
            setSkills(res.data);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setAddSkillError(err.response?.data?.message || 'Failed to add skill.');
        } finally {
            setAddingSkill(false);
        }
    };

    const handleUpdateSkill = async (e) => {
        e.preventDefault();
        setAddingSkill(true);
        setAddSkillError(null);
        setSuccessMessage(null);
        try {
            await skillsApi.updateSkill(editingSkill.id, {
                skillName: editingSkill.skillName,
                proficiencyLevel: editingSkill.proficiencyLevel
            });
            setSuccessMessage('Skill updated successfully! (Status reset to PENDING)');
            setEditingSkill(null);
            const res = await skillsApi.getMySkills();
            setSkills(res.data);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setAddSkillError(err.response?.data?.message || 'Failed to update skill.');
        } finally {
            setAddingSkill(false);
        }
    };

    const handleDeleteSkill = async (id) => {
        if (!window.confirm('Are you sure you want to delete this skill?')) return;
        setAddSkillError(null);
        setSuccessMessage(null);
        try {
            await skillsApi.deleteSkill(id);
            setSuccessMessage('Skill deleted successfully.');
            const res = await skillsApi.getMySkills();
            setSkills(res.data);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setAddSkillError(err.response?.data?.message || 'Failed to delete skill.');
        }
    };

    const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    const groupedSkills = levels.reduce((acc, level) => {
        acc[level] = skills.filter(s => s.proficiencyLevel === level);
        return acc;
    }, {});

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div>
            <div className="row g-4 h-100">
                <div className="col-lg-4 h-100">
                    <div id="skill-form-container" className="card shadow-sm border-0 p-4 sticky-top scrollable-form" style={{ top: '0', zIndex: 1, backgroundColor: '#fff', borderLeft: '5px solid var(--color-accent)', maxHeight: '100%', overflowY: 'auto' }}>
                        <h4 className="fw-bold mb-3">{editingSkill ? 'Edit Skill' : 'Add New Skill'}</h4>
                        <form onSubmit={editingSkill ? handleUpdateSkill : handleAddSkill}>
                            <div className="mb-3">
                                <label className="form-label small text-muted text-uppercase fw-bold">Skill Name</label>
                                <select
                                    className="form-select border-2 shadow-none"
                                    value={editingSkill ? editingSkill.skillName : newSkill.skillName}
                                    onChange={(e) => editingSkill
                                        ? setEditingSkill({ ...editingSkill, skillName: e.target.value })
                                        : setNewSkill({ ...newSkill, skillName: e.target.value })
                                    }
                                    required
                                >
                                    <option value="">Select a skill...</option>
                                    {catalogSkills.map(s => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-4">
                                <label className="form-label small text-muted text-uppercase fw-bold">Proficiency Level</label>
                                <select
                                    className="form-select border-2 shadow-none"
                                    value={editingSkill ? editingSkill.proficiencyLevel : newSkill.proficiencyLevel}
                                    onChange={(e) => editingSkill
                                        ? setEditingSkill({ ...editingSkill, proficiencyLevel: e.target.value })
                                        : setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })
                                    }
                                >
                                    <option value="BEGINNER">Beginner</option>
                                    <option value="INTERMEDIATE">Intermediate</option>
                                    <option value="ADVANCED">Advanced</option>
                                </select>
                            </div>
                            {addSkillError && <div className="alert alert-danger p-2 small mb-3">{addSkillError}</div>}
                            {successMessage && <div className="alert alert-success p-2 small mb-3">{successMessage}</div>}
                            <div className="d-flex gap-2">
                                <button type="submit" className={`btn btn-accent w-100 fw-bold py-2 ${editingSkill ? 'btn-info text-white' : ''}`} disabled={addingSkill}>
                                    {addingSkill ? 'Processing...' : editingSkill ? 'Update Skill' : 'Add Skill'}
                                </button>
                                {editingSkill && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary w-50 fw-bold"
                                        onClick={() => {
                                            setEditingSkill(null);
                                            setAddSkillError(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="col-lg-8">
                    {/* Tab Navigation */}
                    <div className="nav nav-pills mb-4 bg-white p-2 rounded-4 shadow-sm d-flex justify-content-between gap-2">
                        {levels.map(level => (
                            <button
                                key={level}
                                className={`nav-link flex-grow-1 fw-bold rounded-pill py-2 transition-all ${selectedSkillLevel === level ? 'active-accent text-white' : 'text-muted hover-light'}`}
                                onClick={() => setSelectedSkillLevel(level)}
                            >
                                {level}
                                <span className={`ms-2 badge rounded-pill ${selectedSkillLevel === level ? 'bg-white text-dark' : 'bg-light text-muted'}`}>
                                    {groupedSkills[level]?.length || 0}
                                </span>
                            </button>
                        ))}
                    </div>

                    {error ? (
                        <div className="alert alert-warning">{error}</div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="card shadow-sm border-0 overflow-hidden rounded-4">
                                <div className="card-header py-3 px-4 border-0 d-flex justify-content-between align-items-center bg-accent-header">
                                    <h5 className="mb-0 fw-bold d-flex align-items-center gap-2">
                                        <i className={`bi ${selectedSkillLevel === 'ADVANCED' ? 'bi-award-fill' : selectedSkillLevel === 'INTERMEDIATE' ? 'bi-shield-check' : 'bi-speedometer'}`}></i>
                                        {selectedSkillLevel} Skills
                                    </h5>
                                </div>
                                <div className="card-body p-0">
                                    <div className="table-responsive scrollable-table-container" style={{ maxHeight: 'calc(100vh - 380px)', overflowY: 'auto' }}>
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light small text-uppercase fw-bold text-muted sticky-top" style={{ zIndex: 5, background: '#f8f9fa' }}>
                                                <tr>
                                                    <th className="px-4 py-3">Skill Name</th>
                                                    <th className="px-4 py-3 text-center">Status</th>
                                                    <th className="px-4 py-3 text-end">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {groupedSkills[selectedSkillLevel] && groupedSkills[selectedSkillLevel].length > 0 ? (
                                                    groupedSkills[selectedSkillLevel].map((skill) => (
                                                        <tr key={skill.id} className={editingSkill?.id === skill.id ? 'table-info' : ''}>
                                                            <td className="px-4 py-3">
                                                                <div className="fw-bold text-dark">{skill.skillName}</div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`badge px-3 py-2 rounded-pill ${skill.status === 'APPROVED' ? 'bg-success' :
                                                                    skill.status === 'PENDING' ? 'bg-secondary' : 'bg-danger'
                                                                    }`} style={{ minWidth: '90px', letterSpacing: '0.5px' }}>
                                                                    {skill.status}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-end">
                                                                <button
                                                                    className="btn btn-sm btn-outline-accent rounded-pill px-4 shadow-sm"
                                                                    onClick={() => {
                                                                        setEditingSkill(skill);
                                                                        setAddSkillError(null);
                                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    }}
                                                                >
                                                                    <i className="bi bi-pencil-square me-1"></i> Edit
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="3" className="text-center py-5 text-muted">
                                                            No {selectedSkillLevel.toLowerCase()} skills found.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MySkills;
