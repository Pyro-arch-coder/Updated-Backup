import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Button, IconButton, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';

// Define API base URL from environment variables with fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081';

const ForumManagement = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsError, setCommentsError] = useState(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedComments, setSelectedComments] = useState([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      // Use environment variable for API URL with fallback
      const apiUrl = API_BASE_URL;
      
      // Special admin endpoint to get ALL posts including pending ones
      const response = await axios.get(`${apiUrl}/api/forum/admin/posts`);
      
      if (response.data && Array.isArray(response.data)) {
        setPosts(response.data);
        console.log('Posts fetched:', response.data);
      } else {
        console.error('Invalid response format:', response.data);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(`Failed to fetch forum posts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId) => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8081';
    try {
      setCommentsLoading(true);
      // First try admin endpoint
      const response = await axios.get(`${apiUrl}/api/forum/admin/posts/${postId}/comments`);
      setComments(response.data);
      setCommentsError(null);
    } catch (adminError) {
      try {
        // Fallback to regular endpoint
        const regularResponse = await axios.get(`${apiUrl}/api/forum/posts/${postId}/comments`);
        setComments(regularResponse.data);
        setCommentsError(null);
      } catch (error) {
        // If both fail, check if it's a 404 (no comments)
        if (error.response?.status === 404) {
          setComments([]);
          setCommentsError('This post has no comments yet');
        } else {
          setComments([]);
          setCommentsError('Error loading comments');
          console.error('Error fetching comments for post', postId, error);
        }
      }
    } finally {
      setCommentsLoading(false);
    }
  };

  const updatePostStatus = async (postId, status) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${API_BASE_URL}/api/forum/posts/${postId}/status`, 
        { status }
      );
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, status: response.data.status } : post
      ));
      let msg = '';
      if (status === 'Verified') msg = 'Post accepted successfully!';
      else if (status === 'Declined') msg = 'Post declined successfully!';
      else if (status === 'Deleted') msg = 'Post deleted successfully!';
      else msg = `Post status updated to ${status}`;
      setSuccessMessage(msg);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post status');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/forum/posts/${postId}`);
      setPosts(posts.filter(post => post.id !== postId));
      setSuccessMessage('Post and all related comments and likes deleted successfully!');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (err) {
      setError('Failed to delete post');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/forum/comments/${commentId}`);
      setComments(comments.filter(comment => comment.id !== commentId));
      setSuccessMessage('Comment deleted successfully!');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
    } catch (err) {
      setError('Failed to delete comment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getFilteredPosts = () => {
    if (statusFilter === 'all') return posts;
    return posts.filter(post => post.status === statusFilter);
  };

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
      case 'verified': return 'status-verified';
      case 'declined': return 'status-declined';
      case 'deleted': return 'status-deleted';
      case 'pending': return 'status-pending';
      default: return 'status-pending';
    }
  };

  const filteredPosts = posts.filter(post => {
    if (statusFilter === 'all') return true;
    return post.status === statusFilter;
  });

  const paginatedPosts = filteredPosts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Pending':
        return <Box component="span" sx={{ bgcolor: '#f0ad4e', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.8rem', fontWeight: 600 }}>Pending</Box>;
      case 'Verified':
        return <Box component="span" sx={{ bgcolor: '#5cb85c', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.8rem', fontWeight: 600 }}>Verified</Box>;
      case 'Declined':
        return <Box component="span" sx={{ bgcolor: '#d9534f', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.8rem', fontWeight: 600 }}>Declined</Box>;
      case 'Deleted':
        return <Box component="span" sx={{ bgcolor: '#777', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.8rem', fontWeight: 600 }}>Deleted</Box>;
      default:
        return <Box component="span" sx={{ bgcolor: '#f0ad4e', color: 'white', px: 1.5, py: 0.5, borderRadius: 1, fontSize: '0.8rem', fontWeight: 600 }}>Pending</Box>;
    }
  };

  if (loading) return <div className="forum-management">Loading...</div>;

  return (
    <Box sx={{ p: { xs: 0.5, sm: 3 } }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600, color: '#16C47F', fontSize: { xs: '1.1rem', sm: '1.75rem', md: '2rem' }, textAlign: 'left', width: 'auto' }}>
              Forum Management
            </Typography>
            <FormControl size="small" sx={{ minWidth: { xs: 120, sm: 180 } }}>
              <InputLabel><FilterListIcon sx={{ mr: 1, fontSize: 18 }} />Filter by Status</InputLabel>
              <Select
            value={statusFilter} 
                label={<><FilterListIcon sx={{ mr: 1, fontSize: 18 }} />Filter by Status</>}
                onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
                sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, borderRadius: 2 }}
              >
                <MenuItem value="all">All Posts</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Verified">Verified</MenuItem>
                <MenuItem value="Declined">Declined</MenuItem>
                <MenuItem value="Deleted">Deleted</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        {error && <Box sx={{ mb: 2, p: 2, bgcolor: '#f8d7da', color: '#721c24', borderRadius: 2 }}>{error}</Box>}
        <Box sx={{ mt: 2, mb: 1, textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary">
            Total Accepted Posts: {posts.filter(post => post.status === 'Verified').length}
          </Typography>
        </Box>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1, overflowX: 'auto', maxWidth: '100%' }}>
          <Table sx={{ minWidth: 650 }} aria-label="forum management table">
            <TableHead>
              <TableRow sx={{ py: { xs: 0.5, sm: 1 } }}>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>ID</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Title</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Author</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Date</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Status</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedPosts.map((post, idx) => (
                <TableRow key={post.id} sx={{ '&:hover': { backgroundColor: 'rgba(22, 196, 127, 0.05)' }, fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{post.title}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{post.author}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{formatDate(post.created_at)}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>{getStatusBadge(post.status)}</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                    <Button
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={() => { setSelectedPost(post); setShowCommentsModal(true); fetchComments(post.id); }}
                      sx={{
                        backgroundColor: '#facc15', // yellow-400
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: { xs: '0.8rem', sm: '1rem' },
                        '&:hover': { backgroundColor: '#eab308' }, // yellow-500
                        py: { xs: 0.5, sm: 1 },
                        px: { xs: 1, sm: 2 },
                        mr: 1
                      }}
                      size="small"
                    >
                      <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>View Comments</Box>
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={() => { setSelectedPost(post); setShowComments(true); if (post.status === 'Verified' || post.status === 'Deleted') { fetchComments(post.id); } else { setComments([]); setCommentsError(null); setCommentsLoading(false); } }}
                      sx={{
                        backgroundColor: '#3498db',
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: { xs: '0.8rem', sm: '1rem' },
                        '&:hover': { backgroundColor: '#217dbb' },
                        py: { xs: 0.5, sm: 1 },
                        px: { xs: 1, sm: 2 }
                      }}
                      size="small"
                    >
                      <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>View</Box>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedPosts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ fontSize: { xs: '0.8rem', sm: '1rem' }, py: { xs: 0.5, sm: 1 } }}>
                    No posts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredPosts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{
            fontSize: { xs: '0.75rem', sm: '1rem' },
            '& .MuiTablePagination-select, & .MuiTablePagination-displayedRows, & .MuiTablePagination-actions, & .MuiTablePagination-toolbar, & .MuiTablePagination-input': {
              fontSize: { xs: '0.75rem', sm: '1rem' }
            },
            '& .MuiTablePagination-selectIcon': {
              color: '#16C47F'
            }
          }}
        />
      </Paper>
      {selectedPost && showComments && (
        <Dialog open={showComments} onClose={() => { setShowComments(false); setSelectedPost(null); }} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#16C47F', color: 'white', fontWeight: 600 }}>
            Post Details
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'grid', gap: '16px', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, mt: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Title</Typography>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedPost.title}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Author</Typography>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedPost.author}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Date</Typography>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{formatDate(selectedPost.created_at)}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Likes</Typography>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 48, overflowWrap: 'break-word' }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{selectedPost.likes || 0}</Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Content</Typography>
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.200', bgcolor: 'grey.50', borderRadius: 1, minHeight: 64, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                <Typography variant="body1">{selectedPost.content}</Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mt: 3, mb: 2, justifyContent: 'flex-end' }}>
                {selectedPost.status === 'Pending' && (
                <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => { updatePostStatus(selectedPost.id, 'Verified'); setShowComments(false); setSelectedPost(null); }}>Accept</Button>
              )}
                {selectedPost.status === 'Pending' && (
                <Button variant="contained" color="error" startIcon={<CloseIcon />} onClick={() => { updatePostStatus(selectedPost.id, 'Declined'); setShowComments(false); setSelectedPost(null); }}>Decline</Button>
              )}
                {(selectedPost.status === 'Verified' || selectedPost.status === 'Declined') && (
                <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => { deletePost(selectedPost.id); setShowComments(false); setSelectedPost(null); }}>
                  Delete
                </Button>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}
      {showSuccessModal && (
        <div className="soloparent-modal-overlay">
          <div className="soloparent-success-modal">
            <div className="soloparent-success-content">
              <i className="fas fa-check-circle" style={{ fontSize: '4rem', color: '#10b981', animation: 'pulse 1.5s infinite' }}></i>
              <p style={{ fontSize: '1.25rem', color: '#1e293b', margin: 0, fontWeight: 500 }}>{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      {selectedPost && showCommentsModal && (
        <Dialog open={showCommentsModal} onClose={() => { setShowCommentsModal(false); setSelectedPost(null); setSelectedComments([]); }} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ backgroundColor: '#facc15', color: 'black', fontWeight: 600 }}>
            Comments for Post
          </DialogTitle>
          <DialogContent>
            {commentsLoading ? (
              <Typography>Loading comments...</Typography>
            ) : commentsError ? (
              <Typography color="error">{commentsError}</Typography>
            ) : comments.length === 0 ? (
              <Typography>No comments found for this post.</Typography>
            ) : (
              <Box>
                {comments.map(comment => (
                  <Box key={comment.id} sx={{ display: 'flex', alignItems: 'flex-start', border: '1px solid #eee', borderRadius: 2, p: 2, mb: 2, boxShadow: 1, background: '#fff' }}>
                    <input
                      type="checkbox"
                      checked={selectedComments.includes(comment.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedComments([...selectedComments, comment.id]);
                        } else {
                          setSelectedComments(selectedComments.filter(id => id !== comment.id));
                        }
                      }}
                      style={{ marginRight: 16, marginTop: 8 }}
                    />
                    <Box sx={{ mr: 2, mt: 0.5 }}>
                      {comment.authorProfilePic ? (
                        <img src={comment.authorProfilePic} alt="Profile" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', background: '#eee' }} />
                      ) : (
                        <PersonIcon sx={{ fontSize: 40, color: '#bbb', background: '#eee', borderRadius: '50%', p: 0.5 }} />
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#222' }}>{comment.author || 'Anonymous'}</Typography>
                      <Typography sx={{ fontSize: '0.95rem', color: '#555', mt: 0.5 }}><span style={{ fontWeight: 500, color: '#888' }}>Comment:</span> {comment.content}</Typography>
                    </Box>
                  </Box>
                ))}
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  disabled={selectedComments.length === 0}
                  sx={{ mt: 2 }}
                  onClick={async () => {
                    for (const commentId of selectedComments) {
                      await deleteComment(commentId);
                    }
                    setSelectedComments([]);
                    fetchComments(selectedPost.id);
                  }}
                >
                  Delete Selected
                </Button>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
};

export default ForumManagement;
