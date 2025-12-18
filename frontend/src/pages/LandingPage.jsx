import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
            <div className="text-center">
                <h1 className="display-1 fw-bold mb-3" style={{ color: '#333' }}>
                    SkillBridge
                </h1>
                <h2 className="display-5 mb-4 text-muted">
                    Smart skill visibility and workforce intelligence.
                </h2>
                <p className="lead mb-5" style={{ fontSize: '1.8rem' }}>
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
