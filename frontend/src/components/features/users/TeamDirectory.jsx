import React, { useState, useEffect } from 'react';
import { usersApi } from '../../../api/users';
import { allocationsApi } from '../../../api/allocations';

const TeamDirectory = () => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTeamData();
    }, []);

    const fetchTeamData = async () => {
        setLoading(true);
        try {
            const [teamRes, utilRes] = await Promise.all([
                usersApi.getMyTeam(),
                allocationsApi.getTeamUtilization()
            ]);

            const merged = teamRes.data.map(member => {
                const util = utilRes.data?.find(u => u.employeeId === member.id);
                return {
                    ...member,
                    name: `${member.firstName} ${member.lastName}`.trim() || 'Employee',
                    projectName: util ? util.projectName : null,
                    allocationStatus: util ? util.allocationStatus : 'BENCH',
                    status: util ? 'ACTIVE' : 'BENCH',
                    assignmentId: util ? util.assignmentId : null
                };
            });

            setTeam(merged);
            setError(null);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load team data.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="card shadow border-0 rounded-4 overflow-hidden mb-5">
            <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                <h3 className="fw-bold mb-0">Team Directory</h3>
            </div>
            <div className="card-body p-0">
                {error ? <div className="alert alert-danger m-3">{error}</div> :
                    team.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <p className="mb-0 fs-4">No team members found.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="px-4 py-3">Employee</th>
                                        <th className="py-3">Current Assignment</th>
                                        <th className="px-4 py-3 text-end">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {team.map((member, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3">
                                                <div className="fw-bold text-dark">{member.name || 'Anonymous'}</div>
                                                <div className="small text-muted">{member.email}</div>
                                            </td>
                                            <td>
                                                {member.projectName ? (
                                                    <span className="badge bg-info-subtle text-info border border-info rounded-pill px-3">
                                                        {member.projectName}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted italic small">On Bench</span>
                                                )}
                                            </td>
                                            <td className="px-4 text-end">
                                                <span className={`badge rounded-pill px-3 ${member.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}`}>
                                                    {member.status}
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
    );
};

export default TeamDirectory;
