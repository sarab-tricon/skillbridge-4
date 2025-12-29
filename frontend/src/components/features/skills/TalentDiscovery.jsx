import { useState, useEffect } from 'react';
import { skillsApi } from '../../../api/skills';

const TalentDiscovery = () => {
    const [searchSkills, setSearchSkills] = useState([]);
    const [catalogSkills, setCatalogSkills] = useState([]);
    const [talentResults, setTalentResults] = useState(null);
    const [talentLoading, setTalentLoading] = useState(false);
    const [talentError, setTalentError] = useState(null);

    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            const response = await skillsApi.getCatalog();
            setCatalogSkills(response.data);
        } catch (err) {
            console.error('Failed to load skill catalog', err);
        }
    };

    const handleTalentSearch = async (e) => {
        e.preventDefault();
        if (searchSkills.length === 0) return;

        setTalentLoading(true);
        setTalentError(null);
        setTalentResults([]);

        try {
            // Need to verify if the API supports this query format or if I should add a specific method
            // skillsApi.searchEmployeesBySkill expects a single skillName. 
            // The original logic was: api.get(`/skills/search?${skillsQuery}`);
            // I should add `searchTalent(skillsArray)` to `skillsApi`.
            // For now I will assume I will add `searchTalent` to `skillsApi`.
            const response = await skillsApi.searchTalent(searchSkills);
            setTalentResults(response.data);
        } catch (err) {
            console.error('Failed to search talent:', err);
            setTalentError('Error occurred while searching for talent.');
        } finally {
            setTalentLoading(false);
        }
    };

    return (
        <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: '#fff', borderTop: '5px solid var(--color-primary)' }}>
            <div className="card-body p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="card-title fw-bold m-0 text-dark">
                        <i className="bi bi-search me-2 text-primary"></i>
                    </h4>
                    <div className="d-flex gap-2">
                        <span className="badge bg-success small">Advanced</span>
                        <span className="badge bg-primary small">Intermediate</span>
                        <span className="badge bg-warning text-dark small">Beginner</span>
                    </div>
                </div>

                <form onSubmit={handleTalentSearch} className="mb-3">
                    <div className="d-flex flex-wrap gap-2 mb-2 p-2 border rounded bg-light" style={{ minHeight: '38px' }}>
                        {searchSkills.length === 0 ? (
                            <span className="text-muted small align-self-center">Select skills to search...</span>
                        ) : (
                            searchSkills.map(skill => (
                                <span key={skill} className="badge bg-secondary d-flex align-items-center gap-2">
                                    {skill}
                                    <button
                                        type="button"
                                        className="btn-close btn-close-white"
                                        onClick={() => setSearchSkills(prev => prev.filter(s => s !== skill))}
                                        aria-label={`Remove ${skill}`}
                                    ></button>
                                </span>
                            ))
                        )}
                    </div>
                    <div className="input-group input-group-sm">
                        <select
                            className="form-select border-primary"
                            onChange={(e) => {
                                const selected = e.target.value;
                                if (selected && !searchSkills.includes(selected)) {
                                    setSearchSkills(prev => [...prev, selected]);
                                }
                                e.target.value = '';
                            }}
                            aria-label="Add skill to search"
                        >
                            <option value="">+ Add Skill</option>
                            {catalogSkills.map(skill => (
                                <option key={skill.id} value={skill.name}>{skill.name}</option>
                            ))}
                        </select>
                        <button
                            type="submit"
                            className="btn btn-primary fw-bold"
                            disabled={talentLoading || searchSkills.length === 0}
                        >
                            <i className="bi bi-search me-2"></i>Search
                        </button>
                    </div>
                </form>

                {talentLoading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-info" role="status"></div>
                    </div>
                ) : talentResults && talentResults.length > 0 ? (
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="table table-sm table-hover align-middle mb-0">
                            <thead className="table-light sticky-top">
                                <tr>
                                    <th>Name</th>
                                    <th>Skill</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {talentResults.map((res, idx) => (
                                    <tr key={idx}>
                                        <td className="fw-bold">{res.employeeName}</td>
                                        <td>
                                            {res.matches && res.matches.length > 0 ? (
                                                <div className="d-flex flex-wrap gap-1">
                                                    {res.matches.map((match, i) => (
                                                        <span key={i} className={`badge ${match.proficiencyLevel === 'ADVANCED' ? 'bg-success' :
                                                            match.proficiencyLevel === 'INTERMEDIATE' ? 'bg-primary' :
                                                                'bg-warning text-dark'
                                                            }`}>
                                                            {match.skillName}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className={`badge ${res.proficiencyLevel === 'ADVANCED' ? 'bg-success' :
                                                    res.proficiencyLevel === 'INTERMEDIATE' ? 'bg-primary' :
                                                        'bg-warning text-dark'
                                                    }`}>
                                                    {res.skillName}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${res.status === 'APPROVED' ? 'bg-success' :
                                                res.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-danger'
                                                }`}>
                                                {res.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    talentResults !== null && <p className="text-muted text-center small mt-4">No results found.</p>
                )}
            </div>
        </div>
    );
};

export default TalentDiscovery;
