import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav
            className="navbar navbar-light py-3"
            style={{
                borderBottom: '1px solid var(--color-secondary)',
                position: 'sticky',
                top: 0,
                zIndex: 2000,
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
        >
            <div
                className="container-fluid px-4"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    maxWidth: '100%',
                    margin: 0
                }}
            >
                <Link
                    className="navbar-brand d-flex align-items-center fw-bold mb-0 h1"
                    to="/"
                    style={{
                        color: 'var(--color-accent)',
                        margin: 0
                    }}
                >
                    <img
                        src="/skillbridgeLOGO.jpeg"
                        alt="Logo"
                        height="50"
                        className="me-3"
                        style={{ mixBlendMode: 'multiply', filter: 'brightness(1.1)' }}
                    />
                    SkillBridge
                </Link>
                {isAuthenticated && !['/', '/login'].includes(location.pathname) && (
                    <div className="d-flex align-items-center gap-4">
                        {/* User Info */}
                        <div className="d-none d-md-flex align-items-center gap-2">
                            <span className="text-secondary small fw-medium">
                                {localStorage.getItem('userEmail') || 'User'}
                            </span>
                            <div className="bg-light rounded-circle d-flex align-items-center justify-content-center border"
                                style={{ width: '32px', height: '32px' }}>
                                <i className="bi bi-person-fill text-muted"></i>
                            </div>
                        </div>

                        {/* Logout Icon Button */}
                        <button
                            className="btn btn-link text-muted p-0 border-0"
                            onClick={handleLogout}
                            aria-label="Logout"
                            title="Logout"
                            style={{ fontSize: '1.25rem' }}
                        >
                            <i className="bi bi-box-arrow-right hover-danger"></i>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
