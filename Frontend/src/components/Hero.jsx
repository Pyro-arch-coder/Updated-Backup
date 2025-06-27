import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";
import logo from "../assets/logo.jpg";

const PrivacyModal = ({ onClose, onProceed }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content-hero" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', boxShadow: '0 8px 32px rgba(22,196,127,0.15)' }}>
      {/* Accent Bar & Icon */}
      <div style={{ background: '#16C47F', height: 12, width: '100%' }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px 0 24px' }}>
        <div style={{ background: '#e6f9f1', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -44, boxShadow: '0 2px 8px rgba(22,196,127,0.10)' }}>
          <i className="fas fa-user-shield" style={{ color: '#16C47F', fontSize: 32 }}></i>
        </div>
        <h3 style={{ margin: '18px 0 8px 0', color: '#222', fontWeight: 800, fontSize: '1.5rem', letterSpacing: 0.5 }}>Privacy Notice</h3>
        <p style={{ color: '#4a5568', fontSize: 15, margin: '0 0 8px 0', textAlign: 'center', maxWidth: 340 }}>
          We are dedicated to protecting your privacy and ensuring the security of your personal information. We collect only the data necessary for providing our services and use it exclusively for those purposes.
        </p>
        <p style={{ color: '#4a5568', fontSize: 15, margin: '0 0 16px 0', textAlign: 'center', maxWidth: 340 }}>
          Your information will not be shared with third parties without your consent. We have implemented robust security measures to safeguard your data from unauthorized access or misuse.
        </p>
      </div>
      {/* Required Documents Section */}
      <div style={{ background: '#f8fafc', padding: '24px 24px 0 24px', borderRadius: 0 }}>
        <p style={{ color: '#16C47F', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center', margin: '0 0 12px 0', letterSpacing: 0.2 }}>Required Documents</p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ minWidth: 120, flex: 1, maxWidth: 180 }}>
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(22,196,127,0.06)', padding: 16, marginBottom: 12 }}>
              <h5 style={{ color: '#16C47F', fontWeight: 700, fontSize: 15, margin: '0 0 8px 0', textAlign: 'center', letterSpacing: 0.5 }}>SINGLE</h5>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#4a5568', fontSize: 14 }}>
                <li>PSA Birth certificate</li>
                <li>Income Tax Return</li>
                <li>Medical Certificate</li>
                <li>CENOMAR</li>
              </ul>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(22,196,127,0.06)', padding: 16 }}>
              <h5 style={{ color: '#16C47F', fontWeight: 700, fontSize: 15, margin: '0 0 8px 0', textAlign: 'center', letterSpacing: 0.5 }}>MARRIED</h5>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#4a5568', fontSize: 14 }}>
                <li>PSA Birth certificate</li>
                <li>Income Tax Return</li>
                <li>Medical Certificate</li>
                <li>Marriage Certificate</li>
              </ul>
            </div>
          </div>
          <div style={{ minWidth: 120, flex: 1, maxWidth: 180 }}>
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(22,196,127,0.06)', padding: 16, marginBottom: 12 }}>
              <h5 style={{ color: '#16C47F', fontWeight: 700, fontSize: 15, margin: '0 0 8px 0', textAlign: 'center', letterSpacing: 0.5 }}>DIVORCE</h5>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#4a5568', fontSize: 14 }}>
                <li>PSA Birth certificate</li>
                <li>Income Tax Return</li>
                <li>Medical Certificate</li>
                <li>Marriage Certificate</li>
              </ul>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(22,196,127,0.06)', padding: 16 }}>
              <h5 style={{ color: '#16C47F', fontWeight: 700, fontSize: 15, margin: '0 0 8px 0', textAlign: 'center', letterSpacing: 0.5 }}>WIDOWED</h5>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#4a5568', fontSize: 14 }}>
                <li>PSA Birth certificate</li>
                <li>Income Tax Return</li>
                <li>Medical Certificate</li>
                <li>Marriage Certificate</li>
                <li>Death Certificate</li>
              </ul>
            </div>
          </div>
        </div>
        <p style={{ color: '#16C47F', fontWeight: 700, fontSize: 15, textAlign: 'center', margin: '18px 0 0 0' }}>Note: Valid e-mail is required</p>
      </div>
      {/* Modal Buttons */}
      <div className="modal-buttons" style={{ borderTop: '1px solid #eee', background: '#fff', padding: '24px 24px 24px 24px', display: 'flex', justifyContent: 'flex-end', borderRadius: '0 0 16px 16px' }}>
        <button className="proceed-btn" onClick={onProceed} style={{ fontSize: 17, fontWeight: 700, padding: '12px 36px', borderRadius: 8, boxShadow: '0 2px 8px rgba(22,196,127,0.08)' }}>
          Proceed
        </button>
        <button className="modal-close" onClick={onClose} style={{ marginLeft: 12, background: '#f5f5f5', color: '#16C47F', fontWeight: 700, borderRadius: 8, fontSize: 17, padding: '12px 24px', border: 'none', boxShadow: 'none' }}>
          Cancel
        </button>
      </div>
    </div>
  </div>
);

const Hero = () => {
  const navigate = useNavigate();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToAbout = () => {
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignUpClick = () => {
    setShowPrivacyModal(true);
  };

  const handleProceed = () => {
    setShowPrivacyModal(false);
    navigate("/signup");
  };

  return (
    <section className="hero">
      <div className={`hero-content ${isVisible ? 'visible' : ''}`}>
        <div className="hero-left">
          <img src={logo} alt="Solo Parents Welfare Logo" className="hero-logo" />
        </div>
        <div className="hero-right">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="hero-title-line">Empowering Solo Parents,</span>
              <span className="hero-title-line accent">One Step at a Time</span>
            </h1>
            <p className="hero-description">
            Access support, programs, and benefits tailored for solo parents in your community.
            </p>
            <div className="hero-buttons">
              <button className="hero-btn sign-up-btn" onClick={handleSignUpClick}>
                Sign Up
              </button>
              <button className="hero-btn login-btn" onClick={() => navigate('/login')}>
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
      {showPrivacyModal && (
        <PrivacyModal 
          onClose={() => setShowPrivacyModal(false)} 
          onProceed={handleProceed}
        />
      )}
    </section>
  );
};

export default Hero;