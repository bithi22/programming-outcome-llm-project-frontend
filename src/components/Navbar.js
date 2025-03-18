import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaBars, FaTimes } from "react-icons/fa";
import LogoutButton from "./LogoutButton";

function Navbar({ navItems, actionButton, buttonStyle, logout }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white py-3 px-6 shadow-md fixed top-0 left-0 w-full z-50">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center text-3xl font-serif font-bold no-underline md:px-20">
            <img src="/favicon.ico" alt="Logo" className="h-8 w-8 mr-2 rounded-full" />
            <span className="text-black">OBE</span>
            <span className="text-blue-500">lytics</span>
          </Link>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center space-x-8 mr-20">
          {navItems &&
            navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="text-black hover:!text-blue-700 text-lg no-underline"
              >
                {item.label}
              </Link>
            ))}
          {actionButton && (
            <Link
              to={actionButton.path}
              className={`py-1 px-4 no-underline font-medium transition-all ${buttonStyle}`}
            >
              {actionButton.label}
            </Link>
          )}
          {logout && <LogoutButton />}
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden relative">
          <button
            onClick={toggleMobileMenu}
            className="text-black focus:outline-none"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>

          {/* Mobile Dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-md rounded-md border border-gray-300 py-2 px-4 flex flex-col space-y-2"> 
              {navItems &&
                navItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.path}
                    className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              {actionButton && (
                <Link
                  to={actionButton.path}
                  className="text-black text-lg py-2 px-4 border-b border-gray-200 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {actionButton.label}
                </Link>
              )}
              {logout && (
                <div className="py-2 px-4 border-t border-gray-200" onClick={() => setIsMobileMenuOpen(false)}>
                  <LogoutButton />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;