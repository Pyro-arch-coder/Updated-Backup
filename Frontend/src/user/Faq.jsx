import React, { useState, useEffect, useRef } from 'react';
import './Faq.css';
import faqs from './faqs.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faQuestionCircle, 
  faTimes, 
  faChevronDown, 
  faChevronUp, 
  faPaperPlane, 
  faRobot, 
  faUser,
  faSearch
} from '@fortawesome/free-solid-svg-icons';

export default function FAQ() {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // List of questions for the chat suggestions
  const faqMenu = [
    'what is a solo parent',
    'benefits for solo parents',
    'financial assistance for solo parents',
    'how to get solo parent id',
    'requirements for solo parent id',
    'validity of solo parent id',
    'where to apply for solo parent benefits'
  ];

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);



  // Handle sending a message in the chat
  const handleSend = (text) => {
    const question = typeof text === 'string' ? text : inputValue;
    if (!question.trim()) return;
    
    const userMessage = { text: question, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    
    // Simulate typing indicator
    setMessages(prev => [...prev, { text: '', sender: 'typing' }]);
    
    setTimeout(() => {
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.sender !== 'typing'));
      
      const botResponse = {
        text: faqs[question.toLowerCase()] || 
          "I'm sorry, I don't understand that question. Try asking about 'benefits for solo parents', 'requirements for solo parent id', or 'how to get solo parent id'.",
        sender: 'bot'
      };
      
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
    
    setInputValue('');
  };

  // Toggle chat open/closed
  const handleToggle = () => {
    if (isOpen) {
      setMessages([]); // Clear messages when closing
    }
    setIsOpen(!isOpen);
    setIsChatMinimized(false);
  };

  // Close chat
  const handleClose = () => {
    setIsOpen(false);
    setMessages([]); // Also clear messages when closing via close button
  };
  
  // Minimize/maximize chat
  const handleMinimize = () => {
    setIsChatMinimized(!isChatMinimized);
  };
  


  return (
    <div className="faq-page">
      {/* Chat Assistant */}
      <div className="chat-assistant">
        <button 
          className={`chat-toggle ${isOpen ? 'open' : ''}`} 
          onClick={handleToggle}
          aria-label="Toggle FAQ chat"
        >
          <FontAwesomeIcon icon={faQuestionCircle} />
          <span>{isOpen ? 'Close Chat' : 'Chat Assistant'}</span>
        </button>

        {isOpen && (
          <div className={`chat-container ${isChatMinimized ? 'minimized' : ''}`} ref={chatContainerRef}>
            <div className="chat-header">
              <div className="chat-title">
                <FontAwesomeIcon icon={faRobot} />
                <h2>FAQ Assistant</h2>
              </div>
              <div className="chat-controls">
                <button className="minimize-button" onClick={handleMinimize}>
                  <FontAwesomeIcon icon={isChatMinimized ? faChevronUp : faChevronDown} />
                </button>
                <button className="close-button" onClick={handleClose}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>
            
            {!isChatMinimized && (
              <>
                <div className="messages">
                  {messages.length === 0 ? (
                    <div className="welcome-message">
                      <p>Welcome to the FAQ Assistant! Ask me anything about solo parents or choose from the suggestions below.</p>
                      <div className="faq-menu">
                        {faqMenu.map((item, index) => (
                          <button key={index} onClick={() => handleSend(item)}>{item}</button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message, index) => (
                        <div key={index} className={`message ${message.sender}`}>
                          {message.sender === 'user' && (
                            <div className="message-avatar">
                              <FontAwesomeIcon icon={faUser} />
                            </div>
                          )}
                          {message.sender === 'bot' && (
                            <div className="message-avatar">
                              <FontAwesomeIcon icon={faRobot} />
                            </div>
                          )}
                          {message.sender === 'typing' ? (
                            <div className="typing-indicator">
                              <span></span>
                              <span></span>
                              <span></span>
                            </div>
                          ) : (
                            <div className="message-content">{message.text}</div>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                <div className="input-container">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your question..."
                  />
                  <button onClick={() => handleSend()}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
