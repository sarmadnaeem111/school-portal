# Storage Security Rules - Complete Deployment Guide

## 🎯 **Goal: Deploy Security Rules to Protect File Uploads**

This guide will help you deploy comprehensive security rules to protect your Firebase Storage.

## ⏱️ **Time Required: 15 minutes**

---

## 🚀 **Step-by-Step Implementation**

### **Step 1: Access Firebase Storage**

1. **Open Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Sign in with your Google account

2. **Select Your Project**
   - Click on your project: `customer-abe40`

3. **Navigate to Storage**
   - In the left sidebar, click **Storage**
   - Click on the **Rules** tab

### **Step 2: Deploy Storage Rules**

1. **Open Rules Editor**
   - Click **Edit rules** button
   - This opens the rules editor

2. **Clear Existing Rules**
   - Select all existing rules (Ctrl+A)
   - Delete them (Delete key)

3. **Copy Storage Rules**
   - Open the file `STORAGE_SECURITY_RULES.txt`
   - Copy the entire content (Ctrl+A, Ctrl+C)

4. **Paste New Rules**
   - Paste the rules into the editor (Ctrl+V)
   - Verify the rules are properly formatted

5. **Publish Rules**
   - Click **Publish** button
   - Wait for confirmation

### **Step 3: Verify Rules Deployment**

1. **Check Rules Status**
   - Look for "Rules published successfully" message
   - Rules should show as "Active"

2. **Test Rules (Optional)**
   - Try uploading a file without authentication
   - Should be blocked

---

## 🔒 **Storage Rules Features**

### **File Type Validation:**
- ✅ Images (jpg, png, gif, etc.)
- ✅ PDFs
- ✅ Word documents
- ✅ Excel spreadsheets
- ✅ Text files
- ❌ Executable files blocked
- ❌ Script files blocked

### **File Size Limits:**
- ✅ Maximum 10MB per file
- ✅ Prevents large file abuse
- ✅ Protects storage costs

### **User Access Control:**
- ✅ Users can only upload to their own folders
- ✅ Teachers can upload study materials
- ✅ Students can upload assignments
- ✅ Admins have full access
- ✅ File name sanitization

### **Directory Structure:**
- ✅ **Profile Pictures**: `/profilePictures/{userId}/`
- ✅ **Study Materials**: `/studyMaterials/{materialId}/`
- ✅ **Assignments**: `/assignments/{assignmentId}/`
- ✅ **Submissions**: `/submissions/{submissionId}/`
- ✅ **Announcements**: `/announcements/{announcementId}/`
- ✅ **School Documents**: `/schoolDocuments/{documentId}/`
- ✅ **Temporary**: `/temp/{userId}/`

---

## ✅ **Verification Checklist**

- [ ] Rules deployed successfully
- [ ] Rules show as "Active"
- [ ] No syntax errors
- [ ] File type validation working
- [ ] File size limits enforced
- [ ] User access control working

---

## 🧪 **Testing Storage Rules**

### **Test 1: Unauthenticated Upload**
1. Try to upload a file without login
2. Should be blocked

### **Test 2: File Type Validation**
1. Try to upload an executable file
2. Should be blocked

### **Test 3: File Size Validation**
1. Try to upload a file larger than 10MB
2. Should be blocked

### **Test 4: User Access**
1. Login as a student
2. Try to upload to another user's folder
3. Should be blocked

---

## 🚨 **Important Notes**

1. **File Types**: Only allow necessary file types
2. **Size Limits**: Adjust limits based on your needs
3. **Backup**: Keep a backup of your rules
4. **Monitoring**: Monitor storage usage

---

## 📞 **Troubleshooting**

### **If Rules Don't Deploy:**
1. Check for syntax errors
2. Ensure all brackets are closed
3. Verify rule format

### **If File Uploads Fail:**
1. Check file type is allowed
2. Verify file size is under limit
3. Ensure user is authenticated
4. Check user has permission

---

## 🎉 **Success!**

Your Firebase Storage is now protected with comprehensive security rules!

**Next Step**: Enable App Check
