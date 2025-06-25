import React, { useState, useEffect } from 'react';
import './ForumRoom.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faComment, faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import defaultAvatar from '../assets/avatar.jpg';
import bannedWords from '../config/bannedWords.json';
import { Navigate } from 'react-router-dom';

const ForumRoom = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', content: '', visibility: 'everyone' });
  const [comments, setComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [currentUser, setCurrentUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [showBadWordModal, setShowBadWordModal] = useState(false);
  const [badWordFound, setBadWordFound] = useState('');
  const [userStatus, setUserStatus] = useState(null);

  const loggedInUserId = localStorage.getItem("UserId");
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

  // Fetch user data
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!loggedInUserId) {
        console.log("No logged-in user found");
        setCurrentUser({ id: 'guest', name: 'Anonymous', profilePic: defaultAvatar });
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/getUserDetails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: loggedInUserId }),
        });

        const data = await response.json();

        // In the fetchUserDetails function
        if (response.ok) {
          setCurrentUser({
            id: loggedInUserId,
            name: data.first_name && data.last_name 
              ? `${data.first_name} ${data.last_name}${data.suffix && data.suffix !== 'none' ? ` ${data.suffix}` : ''}`
              : data.name || 'Anonymous',
            profilePic: data.profilePic || defaultAvatar
          });
          // Store user status for access control
          setUserStatus(data.status);
        } else {
          console.error("Error fetching user data:", data.message);
          setCurrentUser({ id: loggedInUserId, name: 'Anonymous', profilePic: defaultAvatar });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setCurrentUser({ id: loggedInUserId, name: 'Anonymous', profilePic: defaultAvatar });
      }
    };

    fetchUserDetails();
  }, [loggedInUserId, API_BASE_URL]);

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/forum/posts?userId=${loggedInUserId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      
      // Only show verified posts
      const verifiedPosts = data.filter(post => 
        post.status === 'Verified' || !post.status // Include posts without status for backward compatibility
      );
      
      setPosts(verifiedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [API_BASE_URL]);

  // Fetch comments for each post
  useEffect(() => {
    if (posts.length > 0) {
      const fetchComments = async () => {
        const commentsObj = {};
        
        for (const post of posts) {
          // Skip temporary posts (those with temp- prefix in ID)
          if (post.id && post.id.toString().startsWith('temp-')) {
            console.log(`Skipping comment fetch for temporary post ${post.id}`);
            commentsObj[post.id] = [];
            continue;
          }
          
          try {
            const response = await fetch(`${API_BASE_URL}/api/forum/posts/${post.id}/comments`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              console.log(`Failed to fetch comments for post ${post.id}: ${response.status}`);
              commentsObj[post.id] = [];
              continue;
            }
            const data = await response.json();
            commentsObj[post.id] = data.map(comment => ({ ...comment, profilePic: comment.authorProfilePic }));
          } catch (error) {
            console.error(`Error fetching comments for post ${post.id}:`, error);
            commentsObj[post.id] = [];
          }
        }
        
        setComments(commentsObj);
      };
      
      fetchComments();
    }
  }, [posts, API_BASE_URL]);

  const containsBadWords = (text) => {
    if (!text) return false;
    
    const lowerText = text.toLowerCase();
    const allBannedWords = [
      ...bannedWords.english, 
      ...bannedWords.tagalog,
      ...bannedWords.sexual,
      ...bannedWords.sexual_tagalog
    ];
    
    for (const word of allBannedWords) {
      // Use word boundary regex to match only whole words
      const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
      if (regex.test(lowerText)) {
        setBadWordFound(word);
        return true;
      }
    }
    
    return false;
  };

  const handlePostChange = (e) => {
    const { name, value } = e.target;
    setNewPost(prev => ({ ...prev, [name]: value }));
  };

  const handleCommentChange = (postId, value) => {
    setNewComments(prev => ({ ...prev, [postId]: value }));
  };

  const submitPost = async (e) => {
    e.preventDefault();
    
    // Check for bad words in title or content
    if (containsBadWords(newPost.title) || containsBadWords(newPost.content)) {
      setShowBadWordModal(true);
      return;
    }

    if (!newPost.title || !newPost.content) {
      return;
    }
    
    try {
      // Create a new post directly in the UI first for immediate feedback
      const tempPost = {
        id: `temp-${Date.now()}`,
        title: newPost.title,
        content: newPost.content,
        author: currentUser.name,
        authorProfilePic: currentUser.profilePic || defaultAvatar,
        created_at: new Date().toISOString(),
        likes: 0
      };
      
      // Add the temporary post to the UI
      setPosts(prevPosts => [tempPost, ...prevPosts]);
      
      // Clear the form and close the modal
      setNewPost({ title: '', content: '', visibility: 'everyone' });
      setShowCreatePost(false);
      
      // Send the post to the server
      const response = await fetch(`${API_BASE_URL}/api/forum/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          user_id: currentUser.id,
          author: currentUser.name,
          visibility: newPost.visibility
        }),
      });
      
      if (!response.ok) {
        console.error('Server returned error:', await response.text());
        throw new Error('Failed to create post');
      }
      
      const createdPost = await response.json();
      
      // Replace the temporary post with the real one from the server
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === tempPost.id ? createdPost.post || createdPost : post
        )
      );
      setShowPendingModal(true);
    } catch (error) {
      console.error('Error creating post:', error);
      // The temporary post is already in the UI, so no need to add a mock post
    }
  };

  const submitComment = async (postId) => {
    if (!newComments[postId]) return;
    
    try {
      // Create a temporary comment for immediate UI feedback
      const tempComment = {
        id: `temp-${Date.now()}`,
        content: newComments[postId],
        author: currentUser.name,
        authorProfilePic: currentUser.profilePic || defaultAvatar,
        created_at: new Date().toISOString()
      };
      
      // Add the temporary comment to the UI
      setComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), tempComment]
      }));
      
      // Clear the comment input
      setNewComments(prev => ({ ...prev, [postId]: '' }));
      
      // Send the comment to the server
      const response = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComments[postId],
          userId: currentUser.id,
          author: currentUser.name,
          authorProfilePic: currentUser.profilePic || defaultAvatar,
          postId: postId
        }),
      });
      
      if (!response.ok) {
        console.error('Server returned error:', await response.text());
        throw new Error('Failed to add comment');
      }
      
      const createdComment = await response.json();
      
      // Replace the temporary comment with the real one from the server
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].map(comment => 
          comment.id === tempComment.id ? createdComment : comment
        )
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
      // The temporary comment is already in the UI, so no need to add a mock comment
    }
  };

  const likePost = async (postId) => {
    try {
      // Update likes locally for immediate UI feedback
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
        )
      );
      
      // Send the like to the server
      const response = await fetch(`${API_BASE_URL}/api/forum/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id
        }),
      });
      
      if (!response.ok) {
        console.error('Server returned error:', await response.text());
        throw new Error('Failed to like post');
      }
      
      const updatedPost = await response.json();
      
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId ? updatedPost : post
        )
      );
    } catch (error) {
      console.error('Error liking post:', error);
      // The like is already reflected in the UI, so no need for additional fallback
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const closeModal = () => {
    setShowCreatePost(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('forum-room-modal-overlay')) {
      closeModal();
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="forum-room-loading">Loading forum...</div>;
  if (error) return <div className="forum-room-error">Error: {error}</div>;
  
  // Check if user has access to forum based on status
  const restrictedStatuses = ['Pending', 'Incomplete', 'Declined'];
  const hasAccess = userStatus && userStatus === 'Verified';
  
  // Redirect to profile page if user doesn't have access
  if (!hasAccess && userStatus && restrictedStatuses.includes(userStatus)) {
    return <Navigate to="/profile" />;
  }

  return (
    <div className="forum-room-container">
      {/* Bad Word Modal */}
      {showBadWordModal && (
        <div className="forum-room-modal-overlay bad-word-modal-overlay" onClick={() => setShowBadWordModal(false)}>
          <div className="forum-room-modal bad-word-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-room-modal-header">
              <h3>Inappropriate Content Detected</h3>
              <button 
                className="forum-room-modal-close" 
                onClick={() => setShowBadWordModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="forum-room-modal-content">
              <div className="bad-word-warning">
                <FontAwesomeIcon icon={faExclamationTriangle} className="warning-icon" />
                <p>Your post contains inappropriate language. Please revise your content.</p>
                <p className="bad-word-detail">Detected word: <span className="bad-word-highlight">"{badWordFound}"</span></p>
              </div>
            </div>
            <div className="forum-room-modal-footer">
              <button 
                className="forum-room-button" 
                onClick={() => setShowBadWordModal(false)}
              >
                Edit My Post
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pending Post Notification Modal */}
      {showPendingModal && (
        <div className="forum-room-modal-overlay" onClick={() => setShowPendingModal(false)}>
          <div className="forum-room-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-room-modal-header">
              <h3>Post Submitted Successfully</h3>
              <button 
                className="forum-room-modal-close" 
                onClick={() => setShowPendingModal(false)}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="forum-room-pending-notification">
              <p>Thank you for your submission!</p>
              <p>Your post has been received and is now <strong>pending approval</strong> from an administrator.</p>
              <p>Once approved, your post will be visible to all users in the forum.</p>
            </div>
            <div className="forum-room-modal-footer">
              <button 
                className="forum-room-ok-btn"
                onClick={() => setShowPendingModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <h1 className="forum-room-title">Community Forum</h1>
      
      <div className="forum-room-posts-section">
        <div className="forum-room-header">
          <h2>Recent Posts</h2>
          <button 
            className="forum-room-create-btn"
            onClick={() => setShowCreatePost(true)}
            aria-label="Create new post"
          >
            <span className="forum-room-btn-icon">+</span>
            <span>Create Post</span>
          </button>
        </div>
        
        {posts.length === 0 ? (
          <p className="forum-room-no-posts">No posts yet. Be the first to post!</p>
        ) : (
          <div className="forum-room-posts-list">
            {posts.map(post => (
              <div key={post.id} className="forum-room-post-card">
                <div className="forum-room-post-header">
                  <h3 className="forum-room-post-title">{post.title}</h3>
                  <div className="forum-room-post-meta">
                    <div className="forum-room-post-author">
                      <span>
                        {post.user_id === loggedInUserId 
                          ? "Your post"
                          : "Posted by Anonymous from Brgy. " + post.barangay}
                      </span>
                      <img 
                        src={defaultAvatar} 
                        alt="Author" 
                        className="forum-room-author-image"
                      />
                    </div>
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>
                
                <div className="forum-room-post-content">{post.content}</div>
                
                <div className="forum-room-post-actions">
                  <button 
                    onClick={() => likePost(post.id)} 
                    className="forum-room-like-button"
                  >
                    <FontAwesomeIcon icon={faThumbsUp} /> {post.likes || 0}
                  </button>
                  
                  <button 
                    onClick={() => toggleComments(post.id)} 
                    className="forum-room-comments-toggle"
                  >
                    <FontAwesomeIcon icon={faComment} />
                    {expandedComments[post.id] ? ' Hide Comments' : ` Show Comments (${comments[post.id]?.length || 0})`}
                  </button>
                </div>

                {expandedComments[post.id] && (
                  <div className="forum-room-comments-section">
                    <div className="forum-room-add-comment">
                      <textarea
                        placeholder="Write a comment..."
                        value={newComments[post.id] || ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        className="forum-room-comment-textarea"
                      />
                      <button 
                        onClick={() => submitComment(post.id)}
                        className="forum-room-comment-submit-btn"
                        disabled={!newComments[post.id]}
                      >
                        Add Comment
                      </button>
                    </div>

                    <div className="forum-room-comments-list">
                      {comments[post.id]?.length > 0 ? (
                        comments[post.id].map(comment => (
                          <div key={comment.id} className="forum-room-comment-item">
                            <div className="forum-room-comment-header">
                              <div className="forum-room-comment-author">
                                <img 
                                  src={comment.profilePic || defaultAvatar} 
                                  alt="Author" 
                                  className="forum-room-comment-author-image"
                                />
                                <span>{comment.author}</span>
                              </div>
                              <span className="forum-room-comment-date">{formatDate(comment.created_at)}</span>
                            </div>
                            <div className="forum-room-comment-content">{comment.content}</div>
                          </div>
                        ))
                      ) : (
                        <p className="forum-room-no-comments">No comments yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showCreatePost && (
        <div className="forum-room-modal-overlay" onClick={handleOverlayClick}>
          <div className="forum-room-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-room-modal-header">
              <h3>Create a New Post</h3>
              <button 
                className="forum-room-modal-close" 
                onClick={closeModal}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="forum-room-modal-content">
              <div className="forum-room-post-author-info">
                <img 
                  src={defaultAvatar} 
                  alt="Your Profile" 
                  className="forum-room-author-image"
                />
                <span>Posting as <strong>Anonymous</strong></span>
              </div>
              <form onSubmit={submitPost} className="forum-room-post-form">
                <input
                  type="text"
                  name="title"
                  placeholder="Post Title"
                  value={newPost.title}
                  onChange={handlePostChange}
                  className="forum-room-post-input"
                  required
                />
                <textarea
                  name="content"
                  placeholder="Write your post here..."
                  value={newPost.content}
                  onChange={handlePostChange}
                  className="forum-room-post-textarea"
                  required
                />
                <label style={{ marginTop: '10px', marginBottom: '10px' }}>
                  Visibility:
                  <select
                    name="visibility"
                    value={newPost.visibility}
                    onChange={handlePostChange}
                    className="forum-room-post-select"
                    style={{ marginLeft: '10px' }}
                  >
                    <option value="everyone">Show to everyone</option>
                    <option value="barangay">Show only for my barangay</option>
                  </select>
                </label>
                <div className="forum-room-modal-footer">
                  <button 
                    type="button" 
                    className="forum-room-cancel-btn"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="forum-room-submit-btn"
                    disabled={!newPost.title || !newPost.content}
                  >
                    Submit Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumRoom;
