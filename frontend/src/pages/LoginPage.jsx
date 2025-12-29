import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await login(email, password);

        if (result.success) {
            // Redirect based on role
            switch (result.role) {
                case 'EMPLOYEE':
                    navigate('/employee');
                    break;
                case 'MANAGER':
                    navigate('/manager');
                    break;
                case 'HR':
                    navigate('/hr');
                    break;
                default:
                    navigate('/');
            }
        } else {
            setError(result.message);
        }
    };

    return (
        <>
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>
            <main role="main" id="main-content">
                <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
                    <div className="col-md-6 col-lg-4">
                        <div className="card border-0 shadow-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}>
                            <div className="card-body p-5">
                                <h3 className="text-center mb-4">Login</h3>
                                {error && <div className="alert alert-danger">{error}</div>}
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label htmlFor="email" className="form-label">Email Address</label>
                                        <input
                                            id="email"
                                            type="email"
                                            className="form-control form-control-lg"
                                            placeholder="name@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                    <div className="mb-5">
                                        <label htmlFor="password" className="form-label">Password</label>
                                        <div className="input-group">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                className="form-control form-control-lg"
                                                placeholder="******"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                autoComplete="current-password"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="d-grid">
                                        <button type="submit" className="btn btn-accent btn-lg">
                                            Login
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};

export default LoginPage;
