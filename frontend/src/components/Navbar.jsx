import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

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
                        fontSize: '2.5rem',
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
                {isAuthenticated && (
                    <button
                        className="btn btn-accent shadow-sm"
                        onClick={handleLogout}
                        style={{ flexShrink: 0 }}
                    >
                        Logout
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
