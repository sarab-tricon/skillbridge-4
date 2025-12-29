import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ children, sidebarItems, activeTab, onTabChange }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className="min-vh-100 bg-light d-flex flex-column">
            <Navbar />
            <div className="d-flex flex-grow-1" style={{ position: 'relative' }}>
                <Sidebar
                    items={sidebarItems}
                    activeItem={activeTab}
                    onItemClick={onTabChange}
                    isCollapsed={isSidebarCollapsed}
                    onCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                />
                <main
                    className="flex-grow-1 p-4 main-content-transition"
                    style={{
                        marginLeft: isSidebarCollapsed ? '80px' : '250px',
                        width: `calc(100% - ${isSidebarCollapsed ? '80px' : '250px'})`,
                        overflowX: 'hidden'
                    }}
                >
                    <div className="container-fluid" style={{ maxWidth: '1600px' }}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
