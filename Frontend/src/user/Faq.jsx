import React, { useState } from 'react';
import './Faq.css';
import faqs from './faqs.json';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const faqMenu = [
    "what is a solo parent",
    "benefits for solo parents",
    "how to get solo parent id",
    "requirements for solo parent id",
    "validity of solo parent id",
    "financial assistance for solo parents",
    "where to apply for solo parent benefits",
  ];

  const handleSend = (text) => {
    const question = typeof text === 'string' ? text : inputValue;
    if (!question.trim()) return;
    const userMessage = { text: question, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const botResponse = {
      text: faqs[question.toLowerCase()] || "I'm sorry, I don't understand that question. Try asking about 'benefits for solo parents', 'requirements for solo parent id', or 'how to get solo parent id'.",
      sender: 'bot'
    };
    setTimeout(() => {
      setMessages(prev => [...prev, botResponse]);
    }, 500);
    setInputValue('');
  };

  const handleToggle = () => {
    if (isOpen) {
      setMessages([]); // Clear messages when closing
    }
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessages([]); // Also clear messages when closing via close button
  };

  return (
    <>
      <button className="chat-toggle-btn" onClick={handleToggle} aria-label="Toggle chat">
        {/* Chat bubble SVG icon */}
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="12" fill="#4a6fa5"/>
          <path d="M7 8.5C7 7.11929 8.11929 6 9.5 6H14.5C15.8807 6 17 7.11929 17 8.5V12.5C17 13.8807 15.8807 15 14.5 15H12.4142C12.149 15 11.8946 15.1054 11.7071 15.2929L10 17V15.5C10 15.2239 9.77614 15 9.5 15H9.5C8.11929 15 7 13.8807 7 12.5V8.5Z" stroke="#fff" strokeWidth="1.5"/>
        </svg>
      </button>
      {isOpen && (
        <div className="chat-container">
          <div className="chat-header">
            FAQ Chat Bot
            <button className="close-btn" onClick={handleClose} aria-label="Close chat">×</button>
          </div>
          <div className="faq-menu">
            {faqMenu.map((q, i) => (
              <button key={i} className="faq-menu-btn" onClick={() => handleSend(q)}>{q.charAt(0).toUpperCase() + q.slice(1)}</button>
            ))}
          </div>
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your question..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
