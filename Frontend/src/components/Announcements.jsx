import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Announcements.css";

// Define API base URL with environment variable and fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/announcements`);
        const data = await res.json();
        console.log('API Response:', data);
        if (data.success && Array.isArray(data.announcements) && data.announcements.length > 0) {
          setAnnouncements(
            data.announcements.map(a => ({
              id: a.id,
              image: a.image_url,
              title: a.title,
              description: a.description,
              link: a.link
            }))
          );
        } else {
          setAnnouncements([]);
        }
      } catch (err) {
        setAnnouncements([]);
      }
      setLoading(false);
    };
    fetchAnnouncements();
  }, []);

  const handleNextSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handlePrevSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setCurrentIndex((prevIndex) => 
        prevIndex === 0 ? announcements.length - 1 : prevIndex - 1
      );
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleDotClick = (index) => {
    if (!isAnimating && index !== currentIndex) {
      setIsAnimating(true);
      setCurrentIndex(index);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  return (
    <section className="announcements">
      <div className="announcements-header">
        <h2 className="announcement-title">Announcements</h2>
        <p className="announcement-subtitle">Stay informed about the latest programs and benefits</p>
      </div>

      {loading ? (
        <div className="announcement-container">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="announcement-container">No announcements available.</div>
      ) : (
        <>
          <div className="announcement-container">
            <button 
              className="nav-button prev" 
              onClick={handlePrevSlide}
              aria-label="Previous announcement"
            >
              ‹
            </button>

            {announcements[currentIndex]?.link ? (
              <Link 
                to={announcements[currentIndex].link}
                className={`announcement-card ${isAnimating ? 'animating' : ''}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="card-image-container">
                  <img
                    src={announcements[currentIndex]?.image}
                    alt={announcements[currentIndex]?.title}
                    className="announcement-image"
                  />
                </div>
                <div className="announcement-content">
                  <span className="announcement-tag">Program Update</span>
                  <h3>{announcements[currentIndex]?.title}</h3>
                  <p>{announcements[currentIndex]?.description}</p>
                  <span className="read-more">
                    Read More <span className="arrow">→</span>
                  </span>
                </div>
              </Link>
            ) : (
              <div className={`announcement-card ${isAnimating ? 'animating' : ''}`}
                style={{cursor:'default'}}>
                <div className="card-image-container">
                  <img
                    src={announcements[currentIndex]?.image}
                    alt={announcements[currentIndex]?.title}
                    className="announcement-image"
                  />
                </div>
                <div className="announcement-content">
                  <span className="announcement-tag">Program Update</span>
                  <h3>{announcements[currentIndex]?.title}</h3>
                  <p>{announcements[currentIndex]?.description}</p>
                  <span className="read-more" style={{color:'#aaa', pointerEvents:'none'}}>
                    No Link
                  </span>
                </div>
              </div>
            )}

            <button 
              className="nav-button next" 
              onClick={handleNextSlide}
              aria-label="Next announcement"
            >
              ›
            </button>
          </div>

          <div className="pagination">
            {announcements.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? "active" : ""}`}
                onClick={() => handleDotClick(index)}
                aria-label={`Go to announcement ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default Announcements;
