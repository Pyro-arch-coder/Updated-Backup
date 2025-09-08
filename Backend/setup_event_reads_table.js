// Script to create event_reads table in MySQL database
const { queryDatabase } = require('./database');

async function setupEventReadsTable() {
  try {
    console.log('Setting up event_reads table...');

    // Create event_reads table
    await queryDatabase(`
      CREATE TABLE IF NOT EXISTS event_reads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_event_read (event_id, user_id),
        INDEX (event_id),
        INDEX (user_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      )
    `);
    console.log('event_reads table created or already exists');

    console.log('Event reads table setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up event_reads table:', error);
    process.exit(1);
  }
}

// Run the setup function
setupEventReadsTable();