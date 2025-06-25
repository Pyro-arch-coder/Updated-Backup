import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import styles from "./Navbar.module.css";
import { FaHome, FaInfoCircle, FaPhone, FaUserCircle } from 'react-icons/fa';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId, e) => {
    e.preventDefault();
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    setMenuOpen(false);
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <FaHome />, action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { path: '/about', label: 'About', icon: <FaInfoCircle />, action: (e) => scrollToSection('about', e) },
    { path: '/contacts', label: 'Contacts', icon: <FaPhone />, action: (e) => scrollToSection('contacts', e) },
  ];

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles["navbar-container"]}>
        <Link to="/" className={styles["navbar-logo"]}>
          <span className={styles["logo-text"]}>Solo Parent Welfare</span>
        </Link>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>

        <div className={`${styles["nav-menu"]} ${menuOpen ? styles.open : ""}`}>
          <ul className={styles["nav-links"]}>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`${styles["nav-link"]} ${
                    location.pathname === item.path ? styles.active : ""
                  }`}
                  onClick={item.action}
                >
                  <span className={styles["nav-icon"]}>{item.icon}</span>
                  <span className={styles["nav-label"]}>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          
          <button
            className={styles["login-button"]}
            onClick={() => navigate("/login")}
          >
            <FaUserCircle className={styles["login-icon"]} />
            <span>Login</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;