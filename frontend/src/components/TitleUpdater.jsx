import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TitleUpdater = () => {
  const location = useLocation();

  useEffect(() => {
    const path = (location.pathname || '/').toLowerCase();
    let title = 'SkillBridge';

    if (path === '/' || path === '') title = 'SkillBridge';
    else if (path.startsWith('/hr')) title = 'HR | SkillBridge';
    else if (path.startsWith('/manager')) title = 'Manager | SkillBridge';
    else if (path.startsWith('/employee')) title = 'Employee | SkillBridge';
    else if (path.startsWith('/login')) title = 'Login | SkillBridge';
    else title = `SkillBridge|${path.replace(/^\//, '')}`;

    document.title = title;
  }, [location]);

  return null;
};

export default TitleUpdater;
