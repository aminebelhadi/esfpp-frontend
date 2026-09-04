import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {LayoutDashboard, CalendarDays, Settings, Menu, ChevronLeft, Users } from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { path: "/dashboard", name: "Tableau de bord", icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: "/logigramme", name: "Logigramme", icon: <CalendarDays className="w-5 h-5" /> },
    { path: "/formateurs", name: "Professeurs", icon: <Users className="w-5 h-5" /> },
    { path: "/admin", name: "Administration", icon: <Settings className="w-5 h-5" /> }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        {isOpen && <h2 className="sidebar-logo">ESFPP Admin</h2>}
        <button onClick={toggleSidebar} className="toggle-btn">
          {isOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={!isOpen ? item.name : ""}
          >
            <div className="nav-icon">{item.icon}</div>
            {isOpen && <span className="nav-text">{item.name}</span>}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}