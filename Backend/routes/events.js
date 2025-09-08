const express = require('express');
const EventService = require('../services/event');
const { queryDatabase } = require('../database');
const router = express.Router();

// Helper function to convert time to minutes
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to check time conflicts
const checkTimeConflict = async (startDate, startTime, endTime, eventId = null) => {
  try {
    // Get all events on the same date
    const query = 'SELECT * FROM events WHERE startDate = ? AND id != ?';
    const results = await queryDatabase(query, [startDate, eventId || 0]);

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    // Check each existing event for overlap including 1-hour buffer
    for (const event of results) {
      const existingStart = timeToMinutes(event.startTime);
      const existingEnd = timeToMinutes(event.endTime);

      // Add 1-hour buffer before and after existing events
      const bufferStart = existingStart - 60; // 1 hour before event starts
      const bufferEnd = existingEnd + 60;    // 1 hour after event ends

      // Check if there's any overlap including buffer time
      if ((newStart >= bufferStart && newStart < bufferEnd) || 
          (newEnd > bufferStart && newEnd <= bufferEnd) ||
          (newStart <= bufferStart && newEnd >= bufferEnd)) {
        return {
          hasConflict: true,
          conflictingEvent: event
        };
      }
    }

    return {
      hasConflict: false,
      conflictingEvent: null
    };
  } catch (error) {
    console.error('Error checking time conflicts:', error);
    throw error;
  }
};

// Get all events with user status check
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user is a superadmin
    const superadminQuery = 'SELECT * FROM superadmin WHERE id = ?';
    const [isSuperadmin] = await queryDatabase(superadminQuery, [userId]);

    if (isSuperadmin) {
      const query = `
        SELECT e.*, CASE WHEN er.id IS NOT NULL THEN 1 ELSE 0 END as is_read
        FROM events e
        LEFT JOIN event_reads er ON e.id = er.event_id AND er.user_id = ?
        WHERE e.status != 'Archived'
        ORDER BY e.created_at DESC`;
      const events = await queryDatabase(query, [userId]);
      return res.json(events);
    }

    // For regular users, check status
    const userStatusQuery = `SELECT status FROM users WHERE id = ?`;
    const [userStatus] = await queryDatabase(userStatusQuery, [userId]);

    if (!userStatus) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query = `
      SELECT e.*, CASE WHEN er.id IS NOT NULL THEN 1 ELSE 0 END as is_read
      FROM events e
      LEFT JOIN event_reads er ON e.id = er.event_id AND er.user_id = ?
      WHERE e.status != 'Archived'`;

    const params = [userId];
    
    if (userStatus.status === 'Declined') {
      const currentDate = new Date().toISOString().split('T')[0];
      query += ` AND (e.startDate < ? OR e.status = 'Completed')`;
      params.push(currentDate);
    }

    query += ` ORDER BY e.created_at DESC`;
    
    const events = await queryDatabase(query, params);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
});

// Update mark as read endpoint
router.put('/mark-as-read/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.body.userId;
  
  try {
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await queryDatabase(
      'INSERT INTO event_reads (event_id, user_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE read_at = CURRENT_TIMESTAMP',
      [id, userId]
    );
    
    res.json({ success: true, message: 'Event marked as read' });
  } catch (error) {
    console.error('Error marking event as read:', error);
    res.status(500).json({ error: 'Error marking event as read' });
  }
});

// Get all events
router.get('/all', async (req, res) => {
  try {
    const query = `
      SELECT e.*, 
        CASE WHEN er.id IS NOT NULL THEN 1 ELSE 0 END as is_read
      FROM events e
      LEFT JOIN event_reads er ON e.id = er.event_id AND er.user_id = ?
      WHERE e.status != 'Archived'
      ORDER BY e.created_at DESC`;
    const results = await queryDatabase(query, [req.query.userId || 0]);
    
    res.json(results.map(event => ({
      ...event,
      created_at: event.created_at || new Date().toISOString(),
      barangay: event.barangay || 'All'
    })));
  } catch (err) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: 'Error fetching events' });
  }
});

// Create new event
router.post('/', async (req, res) => {
  const { title, description, startDate, startTime, endTime, location, status, visibility, barangay, image } = req.body;
  
  try {
    // Input validation
    if (!title || !description || !startDate || !startTime || !endTime || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'title, description, startDate, startTime, endTime, and location are required' 
      });
    }

    // Validate title length
    if (title.length > 255) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: 'Title must be 255 characters or less' 
      });
    }

    // Validate date format
    if (isNaN(Date.parse(startDate))) {
      return res.status(400).json({ 
        error: 'Invalid date format', 
        details: 'startDate must be a valid date' 
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ 
        error: 'Invalid time format', 
        details: 'Time must be in HH:MM format' 
      });
    }
    
    console.log("\n=== Event Creation Debug ===");
    console.log("Raw request body:", req.body);
    console.log("Extracted barangay value:", barangay);
    
    // Ensure barangay has a value
    const barangayValue = (!barangay || barangay === '') ? 'All' : barangay;
    console.log("Final barangay value:", barangayValue);
    
    // Check for time conflicts
    const { hasConflict, conflictingEvent } = await checkTimeConflict(
      startDate,
      startTime,
      endTime
    );

    if (hasConflict) {
      return res.status(409).json({
        error: 'Time Conflict',
        message: `There must be a 1-hour gap between events. Conflicts with event "${conflictingEvent.title}"`,
        conflictingEvent: conflictingEvent
      });
    }

    // Validate end time is after start time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        error: 'Invalid Time',
        message: 'End time must be after start time'
      });
    }

    // Validation: require image
    if (!image || image.trim() === '') {
      return res.status(400).json({ error: 'Image is required' });
    }

    const result = await queryDatabase(
      'INSERT INTO events (title, description, startDate, startTime, endTime, location, status, visibility, barangay, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, startDate, startTime, endTime, location, status || 'Upcoming', visibility || 'everyone', barangayValue, image]
    );
    
    console.log("\n=== SQL Debug ===");
    console.log("Values to insert:", [title, description, startDate, startTime, endTime, location, status || 'Upcoming', visibility || 'everyone', barangayValue, image]);
    
    res.status(201).json({
      id: result.insertId,
      title,
      description,
      startDate,
      startTime,
      endTime,
      location,
      status,
      visibility,
      barangay: barangayValue,
      image
    });
  } catch (error) {
    console.error('Error creating event:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ 
        error: 'Database table not found', 
        details: 'Events table does not exist' 
      });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        error: 'Database schema error', 
        details: 'Invalid column in events table' 
      });
    }
    
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        error: 'Data too long', 
        details: 'One or more fields exceed maximum length' 
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Duplicate entry', 
        details: 'An event with similar details already exists' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error creating event', 
      details: error.message 
    });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, startDate, startTime, endTime, location, status, visibility, barangay, image } = req.body;
  
  try {
    // Validate event ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'Invalid event ID', 
        details: 'Event ID must be a valid number' 
      });
    }

    // Input validation
    if (!title || !description || !startDate || !startTime || !endTime || !location) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'title, description, startDate, startTime, endTime, and location are required' 
      });
    }

    // Validate title length
    if (title.length > 255) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: 'Title must be 255 characters or less' 
      });
    }

    // Validate date format
    if (isNaN(Date.parse(startDate))) {
      return res.status(400).json({ 
        error: 'Invalid date format', 
        details: 'startDate must be a valid date' 
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ 
        error: 'Invalid time format', 
        details: 'Time must be in HH:MM format' 
      });
    }
    // Check for time conflicts
    const { hasConflict, conflictingEvent } = await checkTimeConflict(
      startDate,
      startTime,
      endTime,
      id
    );

    if (hasConflict) {
      return res.status(409).json({
        error: 'Time Conflict',
        message: `There must be a 1-hour gap between events. Conflicts with event "${conflictingEvent.title}"`,
        conflictingEvent: conflictingEvent
      });
    }

    // Validate end time is after start time
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        error: 'Invalid Time',
        message: 'End time must be after start time'
      });
    }

    // Validation: require image
    if (!image || image.trim() === '') {
      return res.status(400).json({ error: 'Image is required' });
    }

    await queryDatabase(
      'UPDATE events SET title = ?, description = ?, startDate = ?, startTime = ?, endTime = ?, location = ?, status = ?, visibility = ?, barangay = ?, image = ?, updated_at = NOW() WHERE id = ?',
      [title, description, startDate, startTime, endTime, location, status, visibility, barangay, image, id]
    );
    
    res.json({
      id,
      title,
      description,
      startDate,
      startTime,
      endTime,
      location,
      status,
      visibility,
      barangay,
      image
    });
  } catch (error) {
    console.error('Error updating event:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ 
        error: 'Database table not found', 
        details: 'Events table does not exist' 
      });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        error: 'Database schema error', 
        details: 'Invalid column in events table' 
      });
    }
    
    if (error.code === 'ER_DATA_TOO_LONG') {
      return res.status(400).json({ 
        error: 'Data too long', 
        details: 'One or more fields exceed maximum length' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error updating event', 
      details: error.message 
    });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Validate event ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ 
        error: 'Invalid event ID', 
        details: 'Event ID must be a valid number' 
      });
    }

    // Check if event exists
    const existingEvent = await queryDatabase('SELECT id FROM events WHERE id = ?', [id]);
    if (existingEvent.length === 0) {
      return res.status(404).json({ 
        error: 'Event not found', 
        details: 'No event found with the specified ID' 
      });
    }

    await queryDatabase('UPDATE events SET status = ? WHERE id = ?', ['Archived', id]);
    res.json({ message: 'Event archived successfully' });
  } catch (error) {
    console.error('Error archiving event:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ 
        error: 'Database table not found', 
        details: 'Events table does not exist' 
      });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        error: 'Database schema error', 
        details: 'Invalid column in events table' 
      });
    }
    
    res.status(500).json({ 
      error: 'Error archiving event', 
      details: error.message 
    });
  }
});

// Duplicate route removed - using the first implementation that handles event_reads table

// Get attendees for an event (API route for frontend)
router.get('/:eventId/attendees', async (req, res) => {
  try {
    const { eventId } = req.params;
    const attendeesQuery = `
      SELECT a.id, a.event_id, a.code_id, a.name, a.email, a.attend_at, 
             s1.barangay
      FROM attendees a
      LEFT JOIN step1_identifying_information s1 ON a.code_id = s1.code_id
      WHERE a.event_id = ?
      ORDER BY a.attend_at DESC
    `;
    const attendees = await queryDatabase(attendeesQuery, [eventId]);
    res.json(attendees);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ 
      error: 'Failed to fetch attendees', 
      details: error.message 
    });
  }
});

// Add attendee to event
router.post('/:eventId/attendees', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;
    
    // Validate input parameters
    if (!eventId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required parameters', 
        details: 'eventId and userId are required' 
      });
    }

    // Validate eventId is a number
    if (isNaN(parseInt(eventId))) {
      return res.status(400).json({ 
        error: 'Invalid event ID', 
        details: 'Event ID must be a valid number' 
      });
    }

    // Validate userId is a number
    if (isNaN(parseInt(userId))) {
      return res.status(400).json({ 
        error: 'Invalid user ID', 
        details: 'User ID must be a valid number' 
      });
    }
    
    // Check if event exists
    const eventQuery = `SELECT id FROM events WHERE id = ? AND status != 'Archived'`;
    const eventResult = await queryDatabase(eventQuery, [eventId]);
    
    if (!eventResult || eventResult.length === 0) {
      return res.status(404).json({ error: 'Event not found or archived' });
    }
    
    // First get user details
    const userQuery = `
      SELECT u.id, u.code_id, u.name, u.email 
      FROM users u 
      WHERE u.id = ? AND u.status = 'Verified'
    `;
    const userResult = await queryDatabase(userQuery, [userId]);
    
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ error: 'User not found or not verified' });
    }

    const user = userResult[0];

    // Validate user has required fields
    if (!user.code_id || !user.name || !user.email) {
      return res.status(400).json({ 
        error: 'User missing required information', 
        details: 'User must have code_id, name, and email' 
      });
    }

    // Check if user is already an attendee
    const checkQuery = `
      SELECT id FROM attendees 
      WHERE event_id = ? AND code_id = ?
    `;
    const existingAttendee = await queryDatabase(checkQuery, [eventId, user.code_id]);

    if (existingAttendee && existingAttendee.length > 0) {
      return res.status(400).json({ error: 'User is already an attendee' });
    }

    // Add attendee with proper error handling
    const insertQuery = `
      INSERT INTO attendees (event_id, code_id, name, email, attend_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    const insertResult = await queryDatabase(insertQuery, [
      eventId,
      user.code_id,
      user.name,
      user.email
    ]);

    // Verify insertion was successful
    if (!insertResult || !insertResult.insertId) {
      throw new Error('Failed to insert attendee record');
    }

    // Get updated attendees list
    const attendeesQuery = `
      SELECT a.id, a.event_id, a.code_id, a.name, a.email, a.attend_at, 
             s1.barangay
      FROM attendees a
      LEFT JOIN step1_identifying_information s1 ON a.code_id = s1.code_id
      WHERE a.event_id = ?
      ORDER BY a.attend_at DESC
    `;
    
    const attendees = await queryDatabase(attendeesQuery, [eventId]);
    
    res.json({
      message: 'Attendee added successfully',
      attendees: attendees
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ 
        error: 'Database table not found', 
        details: 'Attendees table does not exist' 
      });
    }
    
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ 
        error: 'Database schema error', 
        details: 'Invalid column in attendees table' 
      });
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Duplicate entry', 
        details: 'User is already an attendee for this event' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to add attendee', 
      details: error.message 
    });
  }
});

// Check attendance
router.post('/checkAttendance', async (req, res) => {
  try {
    const { eventId, userId } = req.body;
    console.log('Checking attendance for:', { eventId, userId });
    
    if (!eventId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: { eventId, userId }
      });
    }

    const result = await EventService.checkAttendance(eventId, userId);
    console.log('Attendance check result:', result);
    
    res.json(result);
  } catch (error) {
    console.error('Error in checkAttendance route:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      attended: false
    });
  }
});

router.post('/:eventId/rate', async (req, res) => {
  const { eventId } = req.params;
  const { userId, rating } = req.body;
  if (!userId || !rating) return res.status(400).json({ error: 'Missing required fields' });
  try {
    await queryDatabase(
      'INSERT INTO event_ratings (event_id, user_id, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), created_at = CURRENT_TIMESTAMP',
      [eventId, userId, rating]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

router.get('/:eventId/ratings', async (req, res) => {
  const { eventId } = req.params;
  try {
    const ratings = await queryDatabase('SELECT * FROM event_ratings WHERE event_id = ?', [eventId]);
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
});

module.exports = router;
