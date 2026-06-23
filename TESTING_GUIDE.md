# Employee Invitation Flow - Testing Guide

## Prerequisites

✅ Backend server running on http://localhost:5000
✅ Frontend running on http://localhost:5173
✅ MongoDB connected
✅ Admin account created
✅ Gmail SMTP configured (EMAIL_USER, EMAIL_PASS in .env)

## Test Scenario 1: Send Invitation Email

**Step 1: Login as Admin**
```
URL: http://localhost:5173/signin
Email: admin@example.com (or your admin email)
Password: your-password
```

**Step 2: Navigate to Team Management**
```
URL: http://localhost:5173/team
This page is only visible to admins
```

**Step 3: Send Invitation**
- Click "Invite Member" button
- Fill in:
  - Email: `testemployee@example.com`
  - Role: `Employee`
- Click "Send Invite"
- Check console/backend logs for success message

**Expected Result:**
```
✅ 🔵 INVITE CONTROLLER HIT
👤 User: [admin-id]
🏢 Workspace: [workspace-id]
📧 Email: testemployee@example.com
👥 Role: employee
🔧 Creating invite...
✅ Invite created: [token]
📧 Configuring email...
📤 Sending email to: testemployee@example.com
✅ Email sent successfully
📝 Creating notification...
✅ Notification created
✅ INVITE SUCCESS
```

**Step 4: Generate Link with Email**
- Click "Generate Link" button
- Fill in:
  - Email: `testemployee2@example.com` (optional)
  - Role: `Employee`
- Click "Generate"
- See invite link in modal
- Backend should also send email

---

## Test Scenario 2: Accept Invitation (New User)

**Step 1: Copy Invite Link**
- From team page, generate a link with email
- Or get link from email notification
- Format: `http://localhost:5173/invite/{token}`

**Step 2: Open Invite Link (Incognito Window)**
```
URL: http://localhost:5173/invite/1a6332117b1848e30561d05df9de9555
```

**Step 3: Verify Invite Details Load**
- Page should show "Loading" spinner briefly
- Then display registration form
- Pre-filled email: the email from invitation
- Shows: "Joining [Workspace Name] as [Role]"

**Step 4: Fill Registration Form**
```
Full Name: John Employee
Email: testemployee@example.com (pre-filled)
Password: SecurePass123!
Confirm Password: SecurePass123!
```

**Step 5: Submit Form**
- Click "Create Account & Join"
- Should see "Creating Account..." in button
- Toast: "Account created successfully!"
- Auto-redirect to /dashboard

**Expected Backend Logs:**
```
🔵 REGISTER FROM INVITE HIT
✅ User created: [user-id]
✅ Invite marked as accepted
✅ Notifications created
✅ REGISTRATION FROM INVITE SUCCESS
```

**Expected Result:**
✅ User logged in automatically
✅ Redirected to /dashboard
✅ Can see employee dashboard
✅ Can see team members

---

## Test Scenario 3: Invalid/Expired Invitations

**Test Case A: Invalid Token**
```
URL: http://localhost:5173/invite/invalid_token_123
Expected: "Invitation Invalid" page with "Go to Login" button
```

**Test Case B: Expired Token**
1. Create an invitation 8+ days ago
2. Try to accept it
```
Expected: "Invitation Expired" page with "Go to Login" button
```

**Test Case C: Already Accepted Invitation**
1. Accept an invitation successfully
2. Try the same link again
```
Expected: "Invitation has already been used" message
```

---

## Test Scenario 4: Existing User Joins Workspace

**Step 1: Create a user account**
- Register user at /register
- Email: `existinguser@example.com`

**Step 2: Invite that user to workspace**
- As admin, send invite to `existinguser@example.com`

**Step 3: Accept invitation**
- Click invite link
- Fill form with same email
- Click "Create Account & Join"

**Expected Result:**
✅ User joins existing account to new workspace
✅ User logged in with existing account
✅ Workspace assigned
✅ Role assigned from invitation

---

## Test Scenario 5: Form Validation

**Test Case A: Missing Name**
1. Leave Full Name empty
2. Click submit
```
Expected: "Full name is required" error
```

**Test Case B: Invalid Email**
1. Enter: `notanemail`
2. Click submit
```
Expected: "Please enter a valid email address" error
```

**Test Case C: Password Too Short**
1. Enter password: `Pass123`
2. Click submit
```
Expected: "Password must be at least 8 characters" error
```

**Test Case D: Passwords Don't Match**
1. Password: `SecurePass123!`
2. Confirm: `SecurePass124!`
3. Click submit
```
Expected: "Passwords do not match" error
```

---

## Test Scenario 6: Notification Verification

**After accepting invitation:**

**Admin Notifications:**
1. Go to admin's /notifications
2. Should see: "Team Member Joined" notification
3. Message: "[Employee Name] has joined the workspace"

**Employee Notifications:**
1. Go to employee's /notifications
2. Should see: "Welcome to ProTrack!"
3. Message: "Welcome to the workspace. Get started with your first project."

---

## Test Scenario 7: Team Members List

**After employee accepts invitation:**

**Admin view:**
1. Login as admin
2. Go to /team
3. Check "Workspace Members" table
4. New employee should appear with:
   - Name: [Full Name from form]
   - Email: [Email from invitation]
   - Role: [Role from invitation]
   - Joined: [Today's date]

**Employee view:**
1. Employee cannot access /team (requires admin role)
2. Verify 404 or redirect

---

## Test Scenario 8: Database Verification

**MongoDB Check:**
```javascript
// Check Users collection
db.users.findOne({ email: "testemployee@example.com" })
// Should show:
// - role: "employee"
// - workspaceId: [workspace-id]
// - name: [from form]

// Check WorkspaceInvites collection
db.workspaceinvites.findOne({ email: "testemployee@example.com" })
// Should show:
// - status: "accepted"
// - acceptedBy: [user-id]
// - acceptedAt: [date]
```

---

## Common Issues & Solutions

### Issue: "Invitation not found"
**Cause:** Token is invalid or doesn't exist
**Solution:** 
- Generate a new invitation link
- Make sure token is correct (copy-paste from email/link)

### Issue: "Invitation has expired"
**Cause:** Link is more than 7 days old
**Solution:**
- Generate a new invitation link
- Expiration is set to 7 days by default in WorkspaceInvite model

### Issue: Email not received
**Cause:** Gmail SMTP not configured or incorrect credentials
**Solution:**
- Check .env file has EMAIL_USER and EMAIL_PASS
- Verify Gmail app password is correct
- Check backend console for SMTP errors

### Issue: Auto-login not working
**Cause:** JWT token not being set properly
**Solution:**
- Check browser console for errors
- Verify auth store is receiving token
- Check JWT_SECRET is set in .env

### Issue: Redirect loops
**Cause:** ProtectedRoute guard issue
**Solution:**
- Clear browser localStorage
- Clear cookies
- Try incognito/private window

---

## Backend Endpoints to Test Manually

### 1. Validate Token
```bash
curl http://localhost:5000/api/invites/{token}
# Expected response:
{
  "invite": {
    "token": "...",
    "email": "testemployee@example.com",
    "role": "employee",
    "workspaceName": "ProTrack",
    "expiresAt": "2024-..."
  }
}
```

### 2. Register from Invite
```bash
curl -X POST http://localhost:5000/api/invites/accept \
  -H "Content-Type: application/json" \
  -d '{
    "token": "...",
    "name": "John Doe",
    "email": "testemployee@example.com",
    "password": "SecurePass123!"
  }'
# Expected response:
{
  "message": "Account created successfully",
  "token": "jwt-token",
  "user": {
    "userId": "...",
    "name": "John Doe",
    "email": "testemployee@example.com",
    "role": "employee",
    "workspaceId": "..."
  }
}
```

---

## Performance Testing

**Load Test:** Send 100 invitations
```
Expected: All process successfully
Expected time: < 5 seconds
```

**Concurrent Acceptances:** 10 employees accept simultaneously
```
Expected: All create accounts successfully
Expected: No race conditions
Expected: All notifications created
```

---

## Security Testing

✅ SQL Injection: Email field sanitized
✅ XSS: Form inputs escaped
✅ CSRF: Tokens validated
✅ Rate Limiting: Bypassed for /invites route in dev
✅ Token Expiration: 7 days
✅ Password Hashing: bcrypt with salt rounds
✅ JWT: Signed with secret

---

## Final Verification Checklist

- [ ] Backend server logs show successful invite creation
- [ ] Email receives invitation with valid link
- [ ] Clicking link opens beautiful registration page
- [ ] Form validates all fields correctly
- [ ] Password confirmation works
- [ ] Account creates successfully
- [ ] User logged in automatically
- [ ] Redirected to dashboard
- [ ] Dashboard loads with employee data
- [ ] Team members list shows new employee
- [ ] Notifications created for admins
- [ ] Notifications created for employee
- [ ] Invalid token shows error page
- [ ] Expired token shows error page
- [ ] Existing user joins workspace

---

## Success Criteria

✅ Admin sends invitation
✅ Employee receives email
✅ Accept Invitation link works
✅ Beautiful onboarding page
✅ Employee enters details
✅ Account created in MongoDB
✅ Workspace assigned
✅ Role assigned
✅ Employee logged in automatically
✅ Redirect to employee dashboard
✅ No manual login required
✅ Notifications sent
✅ Team members list updated
✅ Same design as login page
✅ Mobile responsive

## 🎉 Ready to Test!
