import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ navItems, actionButton, buttonStyle }) {
  return (
    <nav className="flex items-center justify-between bg-white py-3 px-6 shadow-md fixed top-0 left-0 w-full z-10">
      {/* Logo */}
      <div className="flex items-center">
        <Link to="/" className="text-3xl font-semibold no-underline ml-14">
          <span className="text-black">Shamik</span>
          <span className="text-blue-500">LLM</span>
        </Link>
      </div>

      {/* Navigation Links and Action Button */}
      <div className="flex items-center space-x-20 mr-20">
        {navItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className="text-black hover:text-blue-500 underline text-lg no-underline"
          >
            {item.label}
          </Link>
        ))}
        {actionButton && (
          <Link
            to={actionButton.path}
            className={`py-1 px-4 rounded-md text-sm font-medium transition-all ${buttonStyle}`}          >
            {actionButton.label}
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
