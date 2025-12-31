import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, role } = useAuth();

    // Fallback: Check localStorage directly to handle race condition
    // This occurs when React state hasn't flushed yet after login (Chrome timing issue)
    const token = localStorage.getItem('token');
    let effectiveIsAuthenticated = isAuthenticated;
    let effectiveRole = role;

    if (!isAuthenticated && token) {
        try {
            const decoded = jwtDecode(token);
            effectiveIsAuthenticated = true;
            effectiveRole = decoded.role;
        } catch {
            // Invalid token, will redirect to login
            effectiveIsAuthenticated = false;
        }
    }

    if (!effectiveIsAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
        // Role mismatch - redirect to home or unauthorized page
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
