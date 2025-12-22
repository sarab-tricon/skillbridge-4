import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';

const ThemeWrapper = ({ children }) => {
    const { role, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated && role === 'EMPLOYEE') {
            document.body.classList.add('employee-theme');
        } else {
            document.body.classList.remove('employee-theme');
        }
    }, [role, isAuthenticated]);

    return (
        <div className={isAuthenticated && role === 'EMPLOYEE' ? 'employee-theme' : ''} style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
            {children}
        </div>
    );
};

export default ThemeWrapper;
