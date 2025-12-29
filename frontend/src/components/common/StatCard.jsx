import React from 'react';

const StatCard = ({ title, value, icon, onClick, colorClass = "text-primary", bgClass = "bg-primary-subtle" }) => (
    <div className="col-md-6 col-lg-3" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <div className={`card border-0 shadow-sm h-100 py-2 stat-card ${onClick ? 'clickable-stat' : ''}`}>
            <div className="card-body d-flex align-items-center">
                <div className={`rounded-circle p-3 d-flex align-items-center justify-content-center me-3 ${bgClass}`} style={{ width: '64px', height: '64px' }}>
                    <i className={`bi ${icon} fs-3 ${colorClass}`}></i>
                </div>
                <div>
                    <h6 className="text-muted text-uppercase small fw-bold mb-1">{title}</h6>
                    <h2 className="display-6 fw-bold mb-0 text-dark">{value}</h2>
                </div>
            </div>
        </div>
    </div>
);

export default StatCard;
