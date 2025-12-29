import React, { useState } from 'react';

const Sidebar = ({ items, activeItem, onItemClick, isCollapsed, onCollapse }) => {
    return (
        <div
            className="d-flex flex-column flex-shrink-0 bg-white shadow-sm sidebar-transition"
            style={{
                width: isCollapsed ? '80px' : '250px',
                height: 'calc(100vh - 58px)', // Adjust based on Navbar height
                position: 'fixed',
                top: '58px',
                left: 0,
                zIndex: 1000,
                borderRight: '1px solid var(--color-secondary)',
                marginTop: 0 // Ensure no overlap
            }}
        >
            <div className="py-3 px-2 d-flex flex-column h-100">
                <div className="w-100 d-flex justify-content-end mb-2 px-2">
                    <button
                        className="btn btn-sm btn-light border-0 text-muted"
                        onClick={onCollapse}
                        title={isCollapsed ? "Expand" : "Collapse"}
                        style={{ width: isCollapsed ? 'auto' : '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <i className={`bi ${isCollapsed ? 'bi-chevron-double-right' : 'bi-chevron-double-left'} fs-6 text-accent`}></i>
                    </button>
                </div>
                <ul className="nav flex-column w-100 gap-1">
                    {items.map((item) => (
                        <li className="nav-item w-100 mb-0" key={item.id}>
                            <button
                                onClick={() => onItemClick(item.id)}
                                className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeItem === item.id ? 'active' : ''} ${isCollapsed ? 'justify-content-center px-0' : 'px-2'}`}
                                title={isCollapsed ? item.label : ""}
                            >
                                <i className={`bi ${item.icon} icon-std fs-5`}></i>
                                {!isCollapsed && <span className="ms-2">{item.label}</span>}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Sidebar;
