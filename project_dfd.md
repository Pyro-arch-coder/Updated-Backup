# Data Flow Diagram (DFD) for the Social Services Management System

## Level 0 DFD (Context Diagram)

```
+----------------+       User Registration        +------------------+
|                |-------------------------------->|                  |
|                |       User Login               |                  |
|                |-------------------------------->|                  |
|                |       Document Upload          |                  |
|                |-------------------------------->|                  |
|                |       Profile Management       |                  |
|                |<--------------------------------|                  |
|     Users      |       Status Updates           |  Social Services |
|                |<--------------------------------|   Management     |
|                |       Event Notifications      |     System       |
|                |<--------------------------------|                  |
|                |       Event Registration       |                  |
|                |-------------------------------->|                  |
|                |       Face Authentication      |                  |
|                |-------------------------------->|                  |
+----------------+                                 +------------------+
        ^                                                 ^
        |                                                 |
        | User Approval/                                  | Document 
        | Verification                                    | Verification
        |                                                 |
        v                                                 v
+----------------+                                 +------------------+
|                |        User Management          |                  |
|                |<--------------------------------|                  |
|                |        Status Updates           |                  |
|                |-------------------------------->|                  |
|                |        Event Management         |                  |
|   Admin/Super  |-------------------------------->|     External     |
|     Admin      |        Announcements           |     Services     |
|                |-------------------------------->|     (Email,      |
|                |        Reports                  |    Cloudinary)   |
|                |<--------------------------------|                  |
|                |                                 |                  |
+----------------+                                 +------------------+
```

## Level 1 DFD

```
                                    +---------------+
                                    |               |
                              +---->| Email Service |
                              |     |               |
                              |     +---------------+
                              |
+----------------+      +-----+------+       +----------------+
|                |      |            |       |                |
|                |----->|            |------>|                |
|                |      | User       |       | Document       |
|                |<-----|            |<------|                |
|     Users      |      | Management |       | Storage        |
|                |      |            |       |                |
|                |      |            |       |                |
+----------------+      +-----+------+       +----------------+
                              |
                              |     +---------------+
                              |     |               |
                              +---->| Database      |
                              |     |               |
                              |     +---------------+
                              |
+----------------+      +-----+------+       +----------------+
|                |      |            |       |                |
|                |----->|            |------>|                |
|                |      | Admin      |       | Event          |
|                |<-----|            |<------|                |
|     Admin      |      | Dashboard  |       | Management     |
|                |      |            |       |                |
|                |      |            |       |                |
+----------------+      +------------+       +----------------+
```

## Level 2 DFD - User Management Process

```
                         +----------------+
                         |                |
                         | Registration   |
                         |                |
                         +-------+--------+
                                 |
                                 v
+----------------+       +-------+--------+       +-----------------+
|                |       |                |       |                 |
|                |------>| User           |------>| Document        |
|                |       | Authentication |       | Verification    |
|                |<------|                |<------|                 |
|     Users      |       +-------+--------+       +-----------------+
|                |               |
|                |               v
|                |       +-------+--------+       +-----------------+
|                |       |                |       |                 |
|                |<------|  Profile       |<------|  Status         |
|                |       |  Management    |------>|  Management     |
|                |       |                |       |                 |
+----------------+       +----------------+       +-----------------+
```

## Data Stores

1. **Users Database**
   - User information
   - Authentication details
   - Profile data
   - Status information

2. **Documents Storage**
   - PSA Birth Certificate
   - Income Tax Return
   - Medical Certificate
   - Marriage Certificate
   - CENOMAR
   - Death Certificate
   - Barangay Certificate
   - Face Recognition Photos

3. **Events Database**
   - Event information
   - Event scheduling
   - Attendance tracking
   - Event visibility settings

4. **Announcements Database**
   - Announcement details
   - Target audience
   - Expiration dates

## External Entities

1. **Users**
   - Regular users (solo parents)
   - Upload documents
   - Attend events
   - Manage profiles

2. **Administrators**
   - Verify user documents
   - Manage user accounts
   - Create announcements
   - Organize events

3. **Super Administrators**
   - Manage administrators
   - System-wide configuration

4. **External Services**
   - Email Service
   - Cloudinary (Image Storage)
   - Face Recognition API

## Key Processes

1. **User Authentication**
   - Login processing
   - Face authentication
   - Session management

2. **Document Management**
   - Upload documents
   - Document verification
   - Document status tracking

3. **Profile Management**
   - User details management
   - Status updates
   - Profile picture management

4. **Event Management**
   - Event creation
   - Event registration
   - Attendance tracking

5. **Announcement System**
   - Create announcements
   - Target audience filtering
   - Expiration management

6. **Admin Dashboard**
   - User verification
   - Document approval
   - Reports generation
   - System management

## Data Flows

1. **Registration Flow**
   - User → System: Personal information
   - System → Database: Store user data
   - System → Email Service: Verification email
   - User → System: Account verification

2. **Document Verification Flow**
   - User → System: Document uploads
   - System → Cloudinary: Store documents
   - System → Admin: Document review notification
   - Admin → System: Verification decision
   - System → User: Status update notification

3. **Event Management Flow**
   - Admin → System: Event creation
   - System → Database: Store event details
   - System → Users: Event notifications
   - Users → System: Event registration
   - Users → System: Attendance confirmation

4. **Status Management Flow**
   - System → Database: Status checks
   - System → Users: Status updates
   - Admin → System: Manual status changes
   - System → Email Service: Status notification emails
