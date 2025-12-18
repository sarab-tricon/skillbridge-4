import { useAuth } from '../context/AuthContext';

const HRDashboard = () => {
    const { user, logout, role } = useAuth();

    return (
        <div className="container mt-5">
            <div className="card shadow-sm">
                <div className="card-body text-center p-5">
                    <h1 className="mb-4">HR Dashboard</h1>
                    <p className="lead">Welcome, {user?.sub}</p>
                    <p className="text-muted">Role: <span className="badge bg-warning text-dark">{role}</span></p>

                    <div className="mt-4">
                        <button onClick={logout} className="btn btn-outline-danger">
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
