# API Key Restrictions - Complete Implementation Guide

## 🎯 **Goal: Restrict API Key to Prevent Abuse**

This guide will help you restrict your Firebase API key to only work from authorized domains.

## ⏱️ **Time Required: 10 minutes**

---

## 🚀 **Step-by-Step Implementation**

### **Step 1: Access Google Cloud Console**

1. **Open Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Select Your Project**
   - Click the project dropdown at the top
   - Select: `customer-abe40`

3. **Navigate to Credentials**
   - In the left sidebar, click **APIs & Services**
   - Click **Credentials**

### **Step 2: Find Your Firebase API Key**

1. **Locate API Keys Section**
   - Scroll down to **API Keys** section
   - Look for the key that starts with: `AIzaSyAVTq89H0x_KzlgxiobbCGUhdnqICsBi48`

2. **Edit the API Key**
   - Click the **pencil icon** (Edit) next to your API key
   - This will open the API key configuration page

### **Step 3: Configure Application Restrictions**

1. **Set Application Restrictions**
   - In the **Application restrictions** section
   - Select **HTTP referrers (web sites)**
   - Click **Add an item**

2. **Add Authorized Domains**
   - Add these referrers one by one:
     ```
     https://yourdomain.com/*
     https://yourdomain.com
     http://localhost:3000/*
     http://localhost:3000
     https://customer-abe40.web.app/*
     https://customer-abe40.firebaseapp.com/*
     ```

3. **Replace `yourdomain.com`**
   - Replace `yourdomain.com` with your actual domain
   - If you don't have a domain yet, keep the localhost entries

### **Step 4: Configure API Restrictions**

1. **Set API Restrictions**
   - In the **API restrictions** section
   - Select **Restrict key**

2. **Select Allowed APIs**
   - Check these APIs:
     - ✅ **Firebase Authentication API**
     - ✅ **Cloud Firestore API**
     - ✅ **Firebase Storage API**
     - ✅ **Firebase Hosting API**

3. **Save Changes**
   - Click **Save** at the bottom
   - Wait for confirmation

### **Step 5: Verify Restrictions**

1. **Test from Authorized Domain**
   - Open your app from `localhost:3000`
   - Should work normally

2. **Test from Unauthorized Domain**
   - Try accessing Firebase from another domain
   - Should get 403 Forbidden error

---

## ✅ **Verification Checklist**

- [ ] API key restricted to specific domains
- [ ] Only required APIs enabled
- [ ] App works from localhost
- [ ] App works from your domain
- [ ] Unauthorized domains blocked

---

## 🔒 **Security Benefits**

### **Before Restrictions:**
- ❌ API key works from any domain
- ❌ Anyone can use your API key
- ❌ High risk of abuse
- ❌ Unauthorized access possible

### **After Restrictions:**
- ✅ API key only works from your domains
- ✅ Unauthorized domains blocked
- ✅ Low risk of abuse
- ✅ Secure access only

---

## 🚨 **Important Notes**

1. **Domain Changes**: If you change domains, update the restrictions
2. **Development**: Always include localhost for development
3. **Testing**: Test thoroughly after making changes
4. **Backup**: Keep a backup of your API key

---

## 📞 **Troubleshooting**

### **If App Stops Working:**
1. Check if your domain is in the referrers list
2. Verify API restrictions include required APIs
3. Clear browser cache and try again

### **If Still Getting 403 Errors:**
1. Wait 5-10 minutes for changes to propagate
2. Check domain spelling in referrers
3. Ensure HTTPS is used for production domains

---

## 🎉 **Success!**

Your API key is now restricted and secure! This prevents unauthorized access and API key abuse.

**Next Step**: Deploy Firestore Security Rules
