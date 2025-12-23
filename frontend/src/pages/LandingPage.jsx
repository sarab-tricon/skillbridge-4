import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <div className="text-center">
                <img
                    src="/skillbridgeLOGO.jpeg"
                    alt="SkillBridge Logo"
                    className="mb-4"
                    style={{ height: '180px', width: 'auto', mixBlendMode: 'multiply', filter: 'brightness(1.1)' }}
                />
                <h1 className="display-1 fw-bold mb-3" style={{ color: '#333' }}>
                    SkillBridge
                </h1>
                <h2 className="display-5 mb-4 text-muted">
                    Trust is rare and expensive
                </h2>
                <p className="lead mb-5">
                    Discover skills, manage allocations, and track utilization in one place.
                </p>
                <button
                    className="btn btn-accent btn-lg px-5 py-3 shadow-sm"
                    onClick={() => navigate('/login')}
                >
                    Login to Dashboard
                </button>
            </div>
        </div>
    );
};

export default LandingPage;
