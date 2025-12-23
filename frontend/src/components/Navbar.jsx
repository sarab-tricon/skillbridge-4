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
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                <Link
                    className="navbar-brand d-flex align-items-center fw-bold mb-0"
                    to="/"
                    style={{
<<<<<<< HEAD
                        fontSize: '1.5rem',
=======
>>>>>>> 9cb2a1f10e65666ce2f54f9bb3fb5eb5ae392049
                        color: 'var(--color-accent)',
                        margin: 0
                    }}
                >
                    <img
                        src="/skillbridgeLOGO.jpeg"
                        alt="Logo"
                        height="35"
                        className="me-2"
                        style={{ mixBlendMode: 'multiply', filter: 'brightness(1.1)' }}
                    />
                    SkillBridge
                </Link>
                {isAuthenticated && !['/', '/login'].includes(location.pathname) && (
<<<<<<< HEAD
                    <div className="d-flex align-items-center gap-3">
                        <div className="d-flex align-items-center text-muted small">
                            <i className="bi bi-person-circle me-1"></i>
                            <span className="fw-medium">{user?.sub || 'User'}</span>
                        </div>
                        <button
                            className="btn btn-outline-danger rounded-circle p-0 d-flex align-items-center justify-content-center"
                            onClick={handleLogout}
                            title="Logout"
                            style={{ width: '32px', height: '32px' }}
                        >
                            <i className="bi bi-box-arrow-right" style={{ fontSize: '1rem' }}></i>
=======
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
>>>>>>> 9cb2a1f10e65666ce2f54f9bb3fb5eb5ae392049
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
