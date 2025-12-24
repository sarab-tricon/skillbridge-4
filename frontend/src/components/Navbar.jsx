import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav
            className="navbar navbar-light py-2"
            style={{
                borderBottom: '1px solid var(--color-secondary)',
                position: 'sticky',
                top: 0,
                zIndex: 2000,
                backgroundColor: 'var(--color-bg)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
        >
            <div
                className="container-fluid px-3"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '100%',
                    margin: 0
                }}
            >
                <div
                    className="navbar-brand d-flex align-items-center fw-bold mb-0"
                    style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-accent)',
                        margin: 0,
                        cursor: 'default'
                    }}
                >
                    <img
                        src="/skillbridgeLOGO.jpeg"
                        alt="Logo"
                        height="32"
                        className="me-2"
                        style={{ mixBlendMode: 'multiply', filter: 'brightness(1.1)' }}
                    />
                    SkillBridge
                </div>
                {isAuthenticated && !['/', '/login'].includes(location.pathname) && (
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center text-muted small">
                            <i className="bi bi-person-circle me-1"></i>
                            <span className="fw-medium">{user?.sub || 'User'}</span>
                        </div>
                        <button
                            className="btn btn-outline-secondary rounded-circle p-0 d-flex align-items-center justify-content-center logout-btn"
                            onClick={handleLogout}
                            title="Logout"
                            style={{ width: '32px', height: '32px' }}
                        >
                            <i className="bi bi-box-arrow-right" style={{ fontSize: '0.9rem' }}></i>
                        </button>
                    </div>
                )}
            </div>
            <style>{`
                .logout-btn:hover {
                    background-color: var(--color-danger, #dc3545) !important;
                    border-color: var(--color-danger, #dc3545) !important;
                    color: white !important;
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
