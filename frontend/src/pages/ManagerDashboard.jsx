import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const ManagerDashboard = () => {
    const { user, role } = useAuth();
    const [mergedTeam, setMergedTeam] = useState([]);
    const [pendingSkills, setPendingSkills] = useState([]);
    const [activeSection, setActiveSection] = useState(null);
    const [loading, setLoading] = useState({
        data: true,
        skills: true
    });
    const [error, setError] = useState({
        data: null,
        skills: null
    });

    const fetchData = async () => {
        try {
            setLoading(prev => ({ ...prev, data: true }));
            const [teamRes, utilRes] = await Promise.all([
                api.get('/users/team'),
                api.get('/utilization/team')
            ]);

            // Merge team members with their utilization data
            const merged = teamRes.data.map(member => {
                const util = utilRes.data.find(u => u.employeeId === member.id) || {};
                return {
                    ...member,
                    allocationStatus: util.allocationStatus || 'BENCH',
                    projectName: util.projectName || null,
                    status: util.projectName ? 'ACTIVE' : 'BENCH'
                };
            });

            setMergedTeam(merged);
            setError(prev => ({ ...prev, data: null }));
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError(prev => ({ ...prev, data: 'Failed to load team data.' }));
        } finally {
            setLoading(prev => ({ ...prev, data: false }));
        }
    };

    const fetchPendingSkills = async () => {
        try {
            setLoading(prev => ({ ...prev, skills: true }));
            const response = await api.get('/skills/pending');
            setPendingSkills(response.data);
            setError(prev => ({ ...prev, skills: null }));
        } catch (err) {
            console.error('Error fetching pending skills:', err);
            setError(prev => ({ ...prev, skills: 'Failed to load pending skills.' }));
        } finally {
            setLoading(prev => ({ ...prev, skills: false }));
        }
    };

    useEffect(() => {
        fetchData();
        fetchPendingSkills();
    }, []);

    const handleSkillAction = async (skillId, status) => {
        try {
            await api.put(`/skills/${skillId}/verify`, { status });
            fetchPendingSkills();
            fetchData();
        } catch (err) {
            console.error(`Error ${status}ing skill:`, err);
            alert(`Failed to ${status} skill. Please try again.`);
        }
    };

    const renderLoading = () => (
        <div className="text-center py-4">
            <div className="spinner-border" style={{ color: '#9CC6DB' }} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    const renderError = (message) => (
        <div className="alert alert-danger" role="alert">
            {message}
        </div>
    );

    const renderEmpty = (message) => (
        <div className="text-center py-5 text-muted border rounded bg-white shadow-sm">
            <p className="mb-0 fs-4">{message}</p>
        </div>
    );

    const SectionCard = ({ title, count, sectionId, color }) => (
        <div
            className={`card h-100 shadow-sm border-0 cursor-pointer transition-all ${activeSection === sectionId ? 'ring-2' : ''}`}
            onClick={() => setActiveSection(activeSection === sectionId ? null : sectionId)}
            style={{
                backgroundColor: 'white',
                borderTop: `6px solid ${color}`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: activeSection === sectionId ? 'translateY(-5px)' : 'none',
                boxShadow: activeSection === sectionId ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)'
            }}
        >
            <div className="card-body p-4 text-center">
                <h6 className="text-muted text-uppercase mb-3 fw-bold" style={{ letterSpacing: '1.5px' }}>{title}</h6>
                <h2 className="display-4 fw-bold mb-0" style={{ color: '#CF4B00' }}>{count}</h2>
                <div className="mt-3">
                    <button className="btn btn-sm px-4 rounded-pill" style={{ backgroundColor: color, color: 'white' }}>
                        {activeSection === sectionId ? 'Hide Details' : 'View Details'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ backgroundColor: '#FCF6D9', minHeight: '100vh', fontFamily: 'Pompiere, cursive' }}>
            <div className="container py-5">
                <header className="mb-5 d-flex justify-content-between align-items-end">
                    <div>
                        <h1 className="display-3 fw-bold mb-0" style={{ color: '#CF4B00' }}>Manager Control Panel</h1>
                        <p className="fs-4 text-muted mb-0">Operational oversight for {user?.sub || 'Manager'}</p>
                    </div>
                    {activeSection && (
                        <button
                            className="btn btn-outline-dark rounded-pill px-4"
                            onClick={() => setActiveSection(null)}
                            style={{ fontWeight: 'bold' }}
                        >
                            &larr; Back to Dashboard
                        </button>
                    )}
                </header>

                {/* Summary Cards */}
                <div className="row g-4 mb-5">
                    <div className="col-md-3">
                        <SectionCard
                            title="Team Size"
                            count={loading.data ? '...' : mergedTeam.length}
                            sectionId="team"
                            color="#9CC6DB"
                        />
                    </div>
                    <div className="col-md-3">
                        <SectionCard
                            title="Allocations"
                            count={loading.data ? '...' : mergedTeam.filter(m => m.projectName).length}
                            sectionId="allocations"
                            color="#DDBA7D"
                        />
                    </div>
                    <div className="col-md-3">
                        <SectionCard
                            title="Pending Verifications"
                            count={loading.skills ? '...' : pendingSkills.length}
                            sectionId="pending_skills"
                            color="#CF4B00"
                        />
                    </div>
                    <div className="col-md-3">
                        <SectionCard
                            title="Bench (Idle)"
                            count={loading.data ? '...' : mergedTeam.filter(m => m.allocationStatus === 'BENCH').length}
                            sectionId="utilization"
                            color="#CF4B00"
                        />
                    </div>
                </div>

                {/* Detail Views */}
                <div className="row">
                    <div className="col-12">
                        {activeSection === 'team' && (
                            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                                <div className="card-header bg-white p-4 border-0">
                                    <h3 className="fw-bold mb-0" style={{ color: '#CF4B00' }}>Team Overview (People-First)</h3>
                                </div>
                                <div className="card-body p-0">
                                    {loading.data ? renderLoading() :
                                        error.data ? renderError(error.data) :
                                            mergedTeam.length === 0 ? renderEmpty('No team members found.') : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle mb-0">
                                                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                                                            <tr>
                                                                <th className="px-4 py-3">Employee Name (Email)</th>
                                                                <th className="py-3">Role</th>
                                                                <th className="py-3 text-center">Current Status</th>
                                                                <th className="px-4 py-3 text-end">Assigned Project</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {mergedTeam.map((member) => (
                                                                <tr key={member.id}>
                                                                    <td className="px-4 fw-bold">{member.email}</td>
                                                                    <td><span className="badge rounded-pill fw-normal" style={{ backgroundColor: '#9CC6DB', color: '#fff' }}>{member.role}</span></td>
                                                                    <td className="text-center">
                                                                        <span className={`badge rounded-pill ${member.status === 'ACTIVE' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                                            {member.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 text-end text-muted fst-italic">
                                                                        {member.projectName || 'Queueing / Idle'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'allocations' && (
                            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                                <div className="card-header bg-white p-4 border-0">
                                    <h3 className="fw-bold mb-0" style={{ color: '#CF4B00' }}>Team Allocations (Delivery View)</h3>
                                </div>
                                <div className="card-body p-0">
                                    {loading.data ? renderLoading() :
                                        error.data ? renderError(error.data) :
                                            mergedTeam.filter(m => m.projectName).length === 0 ? renderEmpty('No active allocations found.') : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle mb-0">
                                                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                                                            <tr>
                                                                <th className="px-4 py-3">Employee</th>
                                                                <th className="py-3">Project Name</th>
                                                                <th className="py-3 text-center">Assignment Status</th>
                                                                <th className="px-4 py-3 text-end">Billing Type</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {mergedTeam.filter(m => m.projectName).map((item, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-4 fw-bold">{item.email}</td>
                                                                    <td>{item.projectName}</td>
                                                                    <td className="text-center"><span className="badge bg-success">ACTIVE</span></td>
                                                                    <td className="px-4 text-end">
                                                                        <span className={`badge ${item.allocationStatus === 'BILLABLE' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                                                                            {item.allocationStatus}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                </div>
                            </div>
                        )}

                        {activeSection === 'pending_skills' && (
                            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                                <div className="card-header bg-white p-4 border-0">
                                    <h3 className="fw-bold mb-0" style={{ color: '#CF4B00' }}>Skill Verifications (Authority)</h3>
                                </div>
                                <div className="card-body p-0">
                                    {loading.skills ? renderLoading() :
                                        error.skills ? renderError(error.skills) :
                                            pendingSkills.length === 0 ? renderEmpty('Clear! No pending verifications.') : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle mb-0">
                                                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                                                            <tr>
                                                                <th className="px-4 py-3">Skill Definition</th>
                                                                <th className="py-3">Proficiency Claim</th>
                                                                <th className="px-4 py-3 text-center">Decision</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {pendingSkills.map((skill) => (
                                                                <tr key={skill.id}>
                                                                    <td className="px-4 fw-bold">{skill.skillName}</td>
                                                                    <td><span className="badge border border-dark text-dark fw-normal">{skill.proficiencyLevel}</span></td>
                                                                    <td className="px-4 text-center">
                                                                        <button
                                                                            className="btn btn-success btn-sm rounded-pill px-3 me-2"
                                                                            onClick={() => handleSkillAction(skill.id, 'APPROVED')}
                                                                        >
                                                                            Verify
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-outline-danger btn-sm rounded-pill px-3"
                                                                            onClick={() => handleSkillAction(skill.id, 'REJECTED')}
                                                                        >
                                                                            Inaccurate
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
                        )}

                        {activeSection === 'utilization' && (
                            <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                                <div className="card-header bg-white p-4 border-0">
                                    <h3 className="fw-bold mb-0" style={{ color: '#CF4B00' }}>Team Utilization (Capacity View)</h3>
                                </div>
                                <div className="card-body p-0">
                                    {loading.data ? renderLoading() :
                                        error.data ? renderError(error.data) :
                                            mergedTeam.length === 0 ? renderEmpty('Capacity analysis unavailable.') : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover align-middle mb-0">
                                                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                                                            <tr>
                                                                <th className="px-4 py-3">Identified Resource</th>
                                                                <th className="px-4 py-3 text-end">Utilization Segment</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {mergedTeam.map((item, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-4 fw-bold">{item.email}</td>
                                                                    <td className="px-4 text-end">
                                                                        <span className={`badge rounded-pill px-3 ${item.allocationStatus === 'BILLABLE' ? 'bg-success' :
                                                                                item.allocationStatus === 'INVESTMENT' ? 'bg-primary' :
                                                                                    'bg-danger'
                                                                            }`}>
                                                                            {item.allocationStatus}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
