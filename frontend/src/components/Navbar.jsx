import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="navbar navbar-light bg-transparent py-3">
            <div className="container">
                <Link className="navbar-brand fw-bold" to="/">
                    SkillBridge
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
