# Fix Cloudinary Upload Preset Error

## ❌ Current Error:
```
Upload preset not found
```

## ✅ Solution Steps:

### 1. Create Upload Preset in Cloudinary Dashboard

1. **Go to Cloudinary Dashboard**: https://cloudinary.com/console
2. **Navigate to Settings**: Click on "Settings" in the left sidebar
3. **Go to Upload Tab**: Click on "Upload" tab
4. **Scroll to Upload Presets**: Find the "Upload presets" section
5. **Add New Preset**: Click "Add upload preset" button
6. **Configure Preset**:
   - **Preset name**: `school_portal` (must match exactly)
   - **Signing Mode**: Select "Unsigned" (important for client-side uploads)
   - **Folder**: Set to `study-materials`
   - **Resource Type**: Leave as "Auto" or select "Raw" for documents
   - **Transformation**: Leave empty
7. **Save Preset**: Click "Save" button

### 2. Update Your .env File

Make sure your `.env` file contains:

```env
# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=ducxbdmzv
REACT_APP_CLOUDINARY_API_KEY=your-api-key
REACT_APP_CLOUDINARY_API_SECRET=your-api-secret
REACT_APP_CLOUDINARY_UPLOAD_PRESET=school_portal
```

### 3. Restart Development Server

After creating the preset and updating .env:

```bash
npm start
```

### 4. Test Upload

1. Login as teacher
2. Go to Study Materials
3. Click "Upload Material"
4. Fill form and select file
5. Click "Upload Material"

## 🔍 Debugging Information

The code now logs detailed information:
- Cloud Name
- Upload Preset
- Folder
- Upload URL
- Error details

Check browser console for these logs to verify configuration.

## 📋 Checklist

- [ ] Created `school_portal` preset in Cloudinary
- [ ] Set preset to "Unsigned" mode
- [ ] Set folder to `study-materials`
- [ ] Updated .env with correct cloud name
- [ ] Restarted development server
- [ ] Tested file upload

## 🚨 Common Issues

### Issue: "Upload preset not found"
**Solution**: Create the preset with exact name `school_portal` in Cloudinary dashboard

### Issue: "Invalid cloud name"
**Solution**: Update `REACT_APP_CLOUDINARY_CLOUD_NAME` in .env file

### Issue: "Unauthorized"
**Solution**: Make sure preset is set to "Unsigned" mode

### Issue: "CORS error"
**Solution**: Ensure your domain is allowed in Cloudinary settings (if needed)
