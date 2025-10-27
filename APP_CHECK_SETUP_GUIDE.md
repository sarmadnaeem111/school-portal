# App Check Setup - Complete Implementation Guide

## 🎯 **Goal: Enable App Check for Bot Protection**

This guide will help you enable Firebase App Check to protect against bot attacks and automated abuse.

## ⏱️ **Time Required: 20 minutes**

---

## 🚀 **Step-by-Step Implementation**

### **Step 1: Enable App Check in Firebase Console**

1. **Open Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Sign in with your Google account

2. **Select Your Project**
   - Click on your project: `customer-abe40`

3. **Navigate to App Check**
   - In the left sidebar, click **App Check**
   - Click **Get started**

4. **Select Provider**
   - Choose **reCAPTCHA Enterprise**
   - Click **Next**

5. **Register Domains**
   - Add your domains:
     ```
     yourdomain.com
     localhost
     ```
   - Click **Save**

### **Step 2: Configure App Check**

1. **Go to Apps Section**
   - In App Check, click **Apps**
   - Find your web app

2. **Manage App Check**
   - Click **Manage** next to your web app
   - Enable **Enforce** for:
     - ✅ **Authentication**
     - ✅ **Firestore**
     - ✅ **Storage**
   - Click **Save**

3. **Get reCAPTCHA Site Key**
   - Note down the reCAPTCHA site key
   - You'll need this for the code

### **Step 3: Update Environment Variables**

1. **Open .env File**
   - Open your `.env` file in the project root

2. **Add App Check Configuration**
   ```env
   # App Check Configuration
   REACT_APP_ENABLE_APP_CHECK=true
   REACT_APP_RECAPTCHA_SITE_KEY=your-recaptcha-site-key-here
   ```

3. **Replace Site Key**
   - Replace `your-recaptcha-site-key-here` with your actual site key
   - Save the file

### **Step 4: Restart Development Server**

1. **Stop Current Server**
   - Press `Ctrl+C` to stop the development server

2. **Start Server Again**
   ```bash
   npm start
   ```

3. **Verify App Check**
   - Check browser console for "App Check initialized"
   - Should see security messages

---

## 🔒 **App Check Features**

### **Bot Protection:**
- ✅ Blocks automated scripts
- ✅ Prevents bot attacks
- ✅ Validates legitimate users
- ✅ Protects against abuse

### **Integration Points:**
- ✅ **Authentication**: Login/signup protected
- ✅ **Firestore**: Database access protected
- ✅ **Storage**: File uploads protected
- ✅ **All Firebase Services**: Comprehensive protection

### **Development Mode:**
- ✅ Works in development
- ✅ Easy testing
- ✅ No impact on functionality

---

## ✅ **Verification Checklist**

- [ ] App Check enabled in Firebase Console
- [ ] reCAPTCHA Enterprise configured
- [ ] Domains registered
- [ ] Enforcement enabled for all services
- [ ] Environment variables updated
- [ ] Development server restarted
- [ ] App Check initialized in console

---

## 🧪 **Testing App Check**

### **Test 1: Normal Usage**
1. Use the app normally
2. Should work without issues
3. Check console for App Check messages

### **Test 2: Bot Detection**
1. Try to access Firebase directly
2. Should be blocked by App Check
3. Verify protection is working

### **Test 3: Development Mode**
1. Check browser console
2. Should see "App Check initialized"
3. No errors should appear

---

## 🚨 **Important Notes**

1. **Site Key**: Keep your reCAPTCHA site key secure
2. **Domains**: Add all your domains to App Check
3. **Testing**: Test thoroughly after enabling
4. **Monitoring**: Monitor for App Check errors

---

## 📞 **Troubleshooting**

### **If App Check Fails to Initialize:**
1. Check if site key is correct
2. Verify environment variables are loaded
3. Ensure domains are registered
4. Check browser console for errors

### **If App Stops Working:**
1. Disable App Check temporarily
2. Check if reCAPTCHA is working
3. Verify domain configuration
4. Test without App Check first

---

## 🎉 **Success!**

Your application now has App Check protection against bot attacks!

**Final Step**: Verify All Security Measures
