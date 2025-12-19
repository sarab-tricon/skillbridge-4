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
        <nav className="navbar navbar-light bg-transparent py-3" style={{ borderBottom: '1px solid var(--color-secondary)' }}>
            <div className="container">
                <Link className="navbar-brand fw-bold mb-0 h1" to="/" style={{ fontSize: '2.5rem', color: 'var(--color-accent)' }}>
                    SkillBridge
                </Link>
                {isAuthenticated && (
                    <button className="btn btn-accent shadow-sm" onClick={handleLogout}>
                        Logout
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
