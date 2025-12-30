import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <main role="main" id="main-content">
                <div className="container d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                    <div className="text-center">
                        <img
                            src="/skillbridgeLOGO.jpeg"
                            alt="SkillBridge Logo"
                            className="mb-4"
                            style={{ height: '180px', width: 'auto', mixBlendMode: 'multiply', filter: 'brightness(1.1)' }}
                        />
                        <h1 className="display-1 fw-bold mb-3" style={{ color: 'var(--color-primary)' }}>
                            SkillBridge
                        </h1>
                        <h2 className="display-5 lead mb-2">
                            Smart Solutions for Smart People
                        </h2>
                        <h3 className="h4 text-muted mb-4 fst-italic">
                            Trust is rare and expensive
                        </h3>
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
            </main>
        </>
    );
};

export default LandingPage;
