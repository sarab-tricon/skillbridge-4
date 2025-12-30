import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <>
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <main role="main" id="main-content" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden', zIndex: 1000, backgroundColor: 'var(--color-bg)' }}>
                <div className="container h-100 d-flex flex-column justify-content-center align-items-center p-0 m-0 w-100" style={{ maxWidth: '100%' }}>
                    <div className="text-center p-0 m-0 mb-5">
                        <img
                            src="/new_logo.png"
                            alt="SkillBridge Logo"
                            className="mb-0 mt-5"
                            style={{ height: '380px', width: 'auto', mixBlendMode: 'multiply', filter: 'brightness(1.1)' }}
                        />
                        <p className="lead mb-3">
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