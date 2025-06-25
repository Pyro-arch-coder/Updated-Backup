import React from "react";
import "./About.css";
import aboutImage1 from "../assets/aboutImage.jpg";
import { FaHandsHelping, FaGraduationCap, FaInfoCircle } from 'react-icons/fa';

const About = () => {
  return (
    <section className="about" id="about">
      <div className="about-header">
        <h1>About Us</h1>
        <p className="about-subtitle">Supporting and empowering solo parents through community and resources</p>
      </div>

      <div className="about-cards-container">
        <div className="about-card">
          <div className="card-icon">
            <FaHandsHelping />
          </div>
          <div className="card-content">
            <h2>Community Support</h2>
            <p>
              We build strong networks for solo parents through shared experiences, mutual aid, and emotional support. Our community is here to help you navigate your journey with confidence.
            </p>
          </div>
        </div>

        <div className="about-card">
          <div className="card-icon">
            <FaGraduationCap />
          </div>
          <div className="card-content">
            <h2>Empowerment Programs</h2>
            <p>
              Access comprehensive resources and skills training designed to foster independence and personal growth. From financial literacy to career development, we're here to support your success.
            </p>
          </div>
        </div>

        <div className="about-card">
          <div className="card-icon">
            <FaInfoCircle />
          </div>
          <div className="card-content">
            <h2>Accessible Resources</h2>
            <p>
              Find vital information and assistance readily available at your fingertips. We ensure that every solo parent has access to the support and resources they need to thrive.
            </p>
          </div>
        </div>
      </div>

      <div className="about-footer">
        <p>Together, we're building a stronger community for solo parents</p>
      </div>
    </section>
  );
};

export default About;