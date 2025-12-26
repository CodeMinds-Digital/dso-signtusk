# Quick Demo Guide - DocuSign Alternative

Since you have the development server running successfully at `http://localhost:3000`, here's how to quickly test the demo functionality:

## 🚀 Current Status

✅ **Development server is running** at http://localhost:3000  
✅ **Authentication system is working** (redirects to /signin)  
✅ **All build issues resolved**

## 🎯 Quick Demo Steps

### 1. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the sign-in page.

### 2. Test User Registration

1. Click on "Sign Up" or navigate to `/signup`
2. Create a test account:
   - **Name**: Demo User
   - **Email**: demo@test.com
   - **Password**: DemoPass123!

### 3. Test Authentication Flow

1. Sign in with your created account
2. Explore the dashboard
3. Test navigation between different sections

### 4. Test Core Features

Based on the codebase, you can test:

- **Document Management**: Create and manage documents
- **User Profile**: Update user settings
- **Organization Features**: If available in the UI
- **Template System**: Create and use document templates

## 🧪 Manual Demo User Creation

If you want to create demo users programmatically, you can use the browser's developer console:

### Option 1: Browser Console Demo

1. Open Developer Tools (F12)
2. Go to the Console tab
3. Run this code to simulate user creation:

```javascript
// This is a conceptual example - adjust based on your actual API
fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Demo Admin',
    email: 'admin@demo.local',
    password: 'admin123'
  })
}).then(r => r.json()).then(console.log);
```

### Option 2: Test Different User Scenarios

Create multiple accounts to test different scenarios:

1. **Admin User**: `admin@demo.local` / `admin123`
2. **Regular User**: `user@demo.local` / `user123`  
3. **Manager User**: `manager@demo.local` / `manager123`

## 📋 Demo Workflow Checklist

- [ ] **Registration**: Create new user account
- [ ] **Login**: Sign in with credentials
- [ ] **Dashboard**: Navigate main interface
- [ ] **Documents**: Create/upload a document
- [ ] **Signing**: Test document signing flow
- [ ] **Templates**: Create document templates
- [ ] **Settings**: Update user preferences
- [ ] **Organization**: Test team features (if available)

## 🔍 Testing Features

### Document Workflow
1. Create a new document
2. Add recipients
3. Set signing fields
4. Send for signature
5. Test the signing process

### User Management
1. Update profile information
2. Change password
3. Test email verification (if implemented)

### Organization Features
1. Create/join organizations
2. Manage team members
3. Set permissions and roles

## 🛠️ Development Testing

### API Testing
You can test API endpoints using curl or Postman:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test authentication (adjust endpoint as needed)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@test.com","password":"DemoPass123!"}'
```

### Database Inspection
If you need to inspect the database, you can:

1. Check the application logs for database queries
2. Use any database admin tools if you have database access
3. Add console.log statements in the code for debugging

## 🎉 Success Indicators

You'll know the demo is working when you can:

- ✅ Successfully register new users
- ✅ Sign in and out without errors
- ✅ Navigate the application interface
- ✅ Create and manage documents
- ✅ Complete basic workflows

## 🚨 Troubleshooting

### If you encounter issues:

1. **Check the browser console** for JavaScript errors
2. **Check the server logs** in your terminal
3. **Verify the server is still running** at http://localhost:3000
4. **Clear browser cache** and cookies if needed

### Common Issues:

- **404 errors**: Check if the development server is still running
- **Authentication issues**: Clear cookies and try again
- **Database errors**: Check server logs for database connection issues

## 🎯 Next Steps

Once you've tested the basic functionality:

1. **Explore the codebase** to understand the architecture
2. **Add custom features** based on your requirements
3. **Set up proper database** with Docker for full functionality
4. **Configure email services** for production-like testing
5. **Add more comprehensive test data** as needed

## 💡 Pro Tips

- Use browser developer tools to inspect network requests
- Check the application logs for detailed error information
- Test with different browsers to ensure compatibility
- Create multiple user accounts to test multi-user scenarios

Happy testing! 🚀

---

**Note**: This demo approach works with your current setup without requiring additional Docker or database configuration. For a full production-like environment, consider setting up the complete infrastructure stack.