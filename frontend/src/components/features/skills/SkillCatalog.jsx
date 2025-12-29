import { useState, useEffect } from 'react';
import { skillsApi } from '../../../api/skills';

const SkillCatalog = () => {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newSkill, setNewSkill] = useState({ name: '', category: 'General', description: '' });
    const [adding, setAdding] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        setLoading(true);
        try {
            const response = await skillsApi.getCatalog();
            setSkills(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load skill catalog.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = async (e) => {
        e.preventDefault();
        setAdding(true);
        setMessage(null);
        try {
            await skillsApi.addCatalogSkill(newSkill);
            setMessage({ type: 'success', text: 'Skill added to catalog successfully!' });
            setNewSkill({ name: '', category: 'General', description: '' });
            fetchCatalog();
        } catch (err) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to add skill.' });
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteSkill = async (id) => {
        if (!window.confirm('Are you sure you want to delete this skill from the catalog?')) return;
        try {
            await skillsApi.deleteCatalogSkill(id);
            setMessage({ type: 'success', text: 'Skill deleted successfully.' });
            fetchCatalog();
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to delete skill.' });
        }
    };

    return (
        <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '5px solid var(--color-primary)' }}>
            <div className="card-body p-4">


                {message && (
                    <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                        {message.text}
                        <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
                    </div>
                )}

                {/* Add New Skill Form */}
                <div className="card border-0 bg-light mb-4 text-dark">
                    <div className="card-body">
                        <h5 className="fw-bold mb-3">Add New Skill</h5>
                        <form onSubmit={handleAddSkill} className="row g-3">
                            <div className="col-md-5">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Skill Name (e.g. Kotlin)"
                                    value={newSkill.name}
                                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <select
                                    className="form-select"
                                    value={newSkill.category}
                                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                                >
                                    <option value="General">General</option>
                                    <option value="Programming">Programming</option>
                                    <option value="Design">Design</option>
                                    <option value="Management">Management</option>
                                    <option value="DevOps">DevOps</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={adding}>
                                    {adding ? 'Adding...' : 'Add to Catalog'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Skills List */}
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : skills.length === 0 ? (
                    <p className="text-center text-muted">No skills in the catalog yet.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Skill Name</th>
                                    <th>Category</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {skills.map(skill => (
                                    <tr key={skill.id}>
                                        <td className="fw-bold">{skill.name}</td>
                                        <td><span className="badge bg-secondary">{skill.category}</span></td>
                                        <td className="text-end">
                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => handleDeleteSkill(skill.id)}
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillCatalog;
