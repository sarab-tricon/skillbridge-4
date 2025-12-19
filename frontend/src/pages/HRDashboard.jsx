import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SkillApprovals from '../components/hr/SkillApprovals';
import ProjectManagement from '../components/hr/ProjectManagement';
import AllocationOversight from '../components/hr/AllocationOversight';

const HRDashboard = () => {
    const { user, role } = useAuth();
    const [activeTab, setActiveTab] = useState('skills');

    const renderContent = () => {
        switch (activeTab) {
            case 'skills':
                return <SkillApprovals />;
            case 'projects':
                return <ProjectManagement />;
            case 'allocations':
                return <AllocationOversight />;
            default:
                return <SkillApprovals />;
        }
    };

    return (
        <div className="min-vh-100 pb-5" style={{ backgroundColor: '#FCF6D9', fontFamily: 'Pompiere, cursive' }}>
            <div className="container py-5">
                <header className="mb-5 d-flex justify-content-between align-items-end border-bottom pb-4" style={{ borderColor: '#DDBA7D' }}>
                    <div>
                        <h1 className="display-3 fw-bold mb-0" style={{ color: '#CF4B00' }}>HR Control Center</h1>
                        <p className="lead m-0 text-muted" style={{ fontSize: '1.5rem' }}>
                            Administrative Governance & Strategic Oversight
                        </p>
                    </div>
                    <div className="text-end">
                        <span className="badge p-2 px-3 mb-2" style={{ backgroundColor: '#9CC6DB', color: '#000', fontSize: '1.1rem' }}>
                            {role} Authority
                        </span>
                        <div className="text-muted small">Logged in as {user?.email}</div>
                    </div>
                </header>

                <div className="row g-4">
                    {/* Navigation Tabs */}
                    <div className="col-12 mb-2">
                        <div className="nav nav-pills gap-3 justify-content-center p-3 rounded shadow-sm" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
                            <button
                                className={`nav-link px-4 py-2 fs-4 ${activeTab === 'skills' ? 'active shadow' : ''}`}
                                style={activeTab === 'skills' ? { backgroundColor: '#CF4B00' } : { color: '#CF4B00' }}
                                onClick={() => setActiveTab('skills')}
                            >
                                <i className="bi bi-shield-lock me-2"></i>Skill Governance
                            </button>
                            <button
                                className={`nav-link px-4 py-2 fs-4 ${activeTab === 'projects' ? 'active shadow' : ''}`}
                                style={activeTab === 'projects' ? { backgroundColor: '#9CC6DB', color: '#000' } : { color: '#9CC6DB' }}
                                onClick={() => setActiveTab('projects')}
                            >
                                <i className="bi bi-kanban me-2"></i>Project Portfolio
                            </button>
                            <button
                                className={`nav-link px-4 py-2 fs-4 ${activeTab === 'allocations' ? 'active shadow' : ''}`}
                                style={activeTab === 'allocations' ? { backgroundColor: '#DDBA7D', color: '#000' } : { color: '#DDBA7D' }}
                                onClick={() => setActiveTab('allocations')}
                            >
                                <i className="bi bi-people me-2"></i>Allocation Oversight
                            </button>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-12 animate__animated animate__fadeIn">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
