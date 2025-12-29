import { useState } from 'react';

/**
 * Reusable Sidebar component for dashboard navigation
 * 
 * @param {Object} props
 * @param {string} props.title - Sidebar title (e.g., "Menu", "HR Portal")
 * @param {Array} props.menuItems - Array of {id, label, icon} objects
 * @param {string} props.activeSection - Currently active section ID
 * @param {Function} props.onSectionChange - Callback when section changes
 */
const Sidebar = ({ title = 'Menu', menuItems = [], activeSection, onSectionChange }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <>
            <div
                className={`col-auto sidebar transition-width ${isCollapsed ? 'sidebar-collapsed' : 'col-md-2'}`}
                style={{
                    backgroundColor: '#fff',
                    borderRight: '1px solid #dee2e6',
                    overflowY: 'auto',
                    position: 'relative',
                    top: 0,
                    height: '100%',
                    minWidth: isCollapsed ? '70px' : '220px',
                    maxWidth: isCollapsed ? '70px' : '220px',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Toggle Button */}
                <button
                    className="btn btn-sm btn-outline-accent border-0 rounded-circle sidebar-toggle-btn"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                    style={{
                        marginTop: '8px',
                        marginLeft: isCollapsed ? 'auto' : undefined,
                        marginRight: isCollapsed ? 'auto' : '8px',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        alignSelf: isCollapsed ? 'center' : 'flex-end'
                    }}
                >
                    <i className="bi bi-list fs-5"></i>
                </button>

                <div className="d-flex flex-column pt-2 h-100">
                    {/* Navigation Menu */}
                    <ul className="nav flex-column w-100 gap-1" id="sidebar-menu">
                        {menuItems.map((item) => (
                            <li key={item.id} className="nav-item w-100 mb-0">
                                <button
                                    onClick={() => onSectionChange(item.id)}
                                    className={`nav-link sidebar-link w-100 text-start d-flex align-items-center ${activeSection === item.id ? 'active' : ''} ${isCollapsed ? 'justify-content-center px-0' : 'px-2'}`}
                                    title={isCollapsed ? item.label : ''}
                                >
                                    <i className={`bi ${item.icon} icon-std fs-5`}></i>
                                    {!isCollapsed && <span className="ms-2">{item.label}</span>}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Sidebar Styles */}
            <style>{`
                .sidebar.transition-width {
                    transition: width 0.3s ease, flex-basis 0.3s ease;
                }
                .sidebar-collapsed {
                    width: 70px !important;
                }
                .nav-link.sidebar-link {
                    transition: none;
                    border-radius: 8px !important;
                    font-weight: 500;
                    box-sizing: border-box;
                    border: 1px solid transparent;
                    height: 48px;
                }
                .nav-link.sidebar-link.active {
                    background-color: var(--color-primary) !important;
                    color: #fff !important;
                }
                .nav-link.sidebar-link:hover:not(.active) {
                    background-color: rgba(156, 198, 219, 0.15);
                    border: 1px solid var(--color-primary);
                    color: var(--color-primary) !important;
                }
                .text-accent {
                    color: var(--color-primary) !important;
                }
                .btn-accent {
                    background-color: var(--color-primary);
                    color: white;
                    border: 1px solid var(--color-primary);
                }
                .btn-outline-accent {
                    color: var(--color-primary);
                    border-color: var(--color-primary);
                }
                .btn-outline-accent:hover {
                    background-color: var(--color-primary);
                    color: white;
                }
                .sidebar-toggle-btn:hover {
                    background-color: rgba(207, 75, 0, 0.1) !important;
                    color: var(--color-primary) !important;
                }
            `}</style>
        </>
    );
};

export default Sidebar;
