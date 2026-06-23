# Team Management System - Quick Reference

## How It Works

### For Admins
1. **Access Team Page**: Click "Team" in sidebar (only visible to admins)
2. **Invite Members**:
   - Click "Invite Member" button
   - Enter email and select role (Employee/Manager)
   - System sends email invitation with link
3. **Generate Invite Link**:
   - Click "Generate Invite Link" button
   - Copy link and share with team
   - Link expires in 7 days
4. **Manage Members**:
   - View all members in table
   - Click menu on member row for actions
   - Options: View, Block, Remove
5. **Assign to Projects**:
   - Create/Edit project
   - Select team members to assign
   - Members auto-notified

### For Employees
1. **Receive Invitation**:
   - Admin sends email or link
   - Click link in email
2. **If Account Exists**:
   - Click "Accept Invitation"
   - Automatically joined to workspace
3. **If No Account**:
   - Register first
   - Automatically joined after registration
4. **Project Assignment**:
   - Receive notification when added to project
   - Can access project dashboard/tasks

## API Endpoints

### Admin Endpoints (Protected)
```bash
# Get team members
GET /api/team/members
Header: Authorization: Bearer <token>

# Get team stats
GET /api/team/stats
Header: Authorization: Bearer <token>

# Invite member by email
POST /api/team/invite
Body: { email: "user@example.com", role: "employee" }

# Generate invite link
POST /api/team/generate-link
Body: { role: "employee" }

# Get pending invites
GET /api/team/invites/pending

# Block member
PATCH /api/team/block/{userId}

# Remove member
DELETE /api/team/remove/{userId}
```

### Public Endpoint
```bash
# Join workspace via invite token
POST /api/team/join/{token}
(No auth required - public endpoint)
```

## Database Schema

### WorkspaceInvite Collection
```javascript
{
  _id: ObjectId,
  token: String (unique, hex),
  workspaceId: ObjectId (ref: Workspace),
  email: String (lowercase),
  role: String (enum: employee, manager),
  createdBy: ObjectId (ref: User),
  expiresAt: Date,
  status: String (enum: pending, accepted, rejected, expired),
  acceptedBy: ObjectId (ref: User, optional),
  acceptedAt: Date (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Project Updates
```javascript
// Added field:
teamMembers: [ObjectId] (ref: User, array)
```

## Notification Types
- `team_member_invited` - Admin receives when invite sent
- `team_member_joined` - Admin receives when member joins
- `team_member_blocked` - Admin receives when member blocked
- `user_added` - Member receives when added to project
- `user_removed` - Member receives when removed from project

## Role-Based Access Control

### Admin Only
- ✅ Access `/team` page
- ✅ View all members
- ✅ Send invitations
- ✅ Generate links
- ✅ Block/Remove members
- ✅ Assign members to projects

### Employees
- ✅ Accept invitations
- ✅ Register and join workspace
- ✅ View projects they're assigned to
- ❌ Cannot access team page
- ❌ Cannot invite members
- ❌ Cannot manage members

## Environment Variables Required
```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
REACT_APP_API_URL=http://localhost:5000
```

## UI Components Used
- `HeroHeader` - Title and stats display
- `Card` - Container for table
- `Button` - Actions
- `Modal` - Invite dialogs
- `Input` - Email field
- `Select` - Role dropdown
- `Spinner` - Loading state
- `Toast` - Success/Error messages

## Key Features

### Email Invitations
- Sends HTML email with personalized message
- Includes accept link with unique token
- 7-day expiration

### Invite Links
- Unique token-based
- Can be copied and shared
- Expires in 7 days
- No email needed

### Real-Time Updates
- Socket.IO integration
- Notifications push immediately
- Member count updates live

### Notifications
- Email sent for invites
- In-app notifications for joins
- Project assignment notifications
- Automatic unread badge update

## Common Workflows

### Invite Single Member
1. Go to Team page
2. Click "Invite Member"
3. Enter email
4. Select role
5. Send invite
6. Member receives email

### Share Team Link
1. Go to Team page
2. Click "Generate Invite Link"
3. Copy link
4. Share via Slack/Chat/Email
5. Anyone can click to join

### Remove Team Member
1. Go to Team page
2. Click menu (⋮) on member
3. Select "Remove"
4. Confirm action
5. Member access revoked

### Assign to Project
1. Create/Edit project
2. Scroll to "Assign Team Members"
3. Check team members
4. Save project
5. Members notified automatically

## Troubleshooting

### Email Not Sending
- Check EMAIL_USER and EMAIL_PASS in .env
- Verify Gmail 2FA app password (not regular password)
- Check spam folder

### Invite Link Not Working
- Link may have expired (7 days max)
- Generate new link
- Check token matches database

### Members Not Appearing
- Ensure members are in same workspace
- Check user.workspaceId matches

### Notifications Not Showing
- Check Socket.IO connection
- Verify notification permissions
- Clear browser cache

## Performance Considerations
- Pagination recommended for large teams
- Invite links cached server-side (7 days)
- Member queries indexed on workspaceId
- Batch notifications for bulk actions

## Security Notes
- All team routes require authentication
- Admin routes verify user role
- Tokens are cryptographically secure
- Email addresses validated
- Workspace isolation enforced
- No sensitive data in notifications

## Future Enhancements
- [ ] Bulk invite from CSV
- [ ] Team member role management
- [ ] Member activity logs
- [ ] Team analytics dashboard
- [ ] Custom invite templates
- [ ] Invite reminders
- [ ] Team chat integration
- [ ] Member permissions granularity
