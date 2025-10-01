import React from 'react';
import './header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <img src="/logoclinica.jpg" alt="Logo Clínica Odontológica Unifranz" className="logo" />
        <h1 className="title">Clínica Odontológica Unifranz</h1>
      </div>
    </header>
  );
};

export default Header;