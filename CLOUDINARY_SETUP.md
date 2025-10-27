# Cloudinary Setup Instructions

## 1. Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com) and sign up for a free account
2. After signing up, you'll be taken to your dashboard

## 2. Get Your Cloudinary Credentials
1. In your Cloudinary dashboard, you'll see:
   - **Cloud Name**: Your unique cloud identifier
   - **API Key**: Your API key
   - **API Secret**: Your API secret

## 3. Create Upload Preset
1. Go to **Settings** → **Upload** in your Cloudinary dashboard
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Name it `school_portal`
5. Set **Signing Mode** to **Unsigned** (for client-side uploads)
6. Set **Folder** to `study-materials`
7. Click **Save**

## 4. Configure Environment Variables
Create a `.env` file in your project root with:

```env
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
REACT_APP_CLOUDINARY_API_KEY=your-api-key
REACT_APP_CLOUDINARY_API_SECRET=your-api-secret
```

Replace the values with your actual Cloudinary credentials.

## 5. Restart Your Development Server
After adding the environment variables, restart your React development server:

```bash
npm start
```

## 6. Test the Upload
1. Login as a teacher
2. Go to Study Materials
3. Click "Upload Material"
4. Fill in the form and select a file
5. Click "Upload Material"
6. The file should be uploaded to Cloudinary and stored in the `study-materials` folder

## Troubleshooting

### Common Issues:
1. **"Upload failed" error**: Check your Cloudinary credentials
2. **"Upload preset not found"**: Make sure you created the `school_portal` preset
3. **CORS errors**: Ensure your Cloudinary account allows uploads from your domain

### File Size Limits:
- Free Cloudinary accounts have a 10MB file size limit
- For larger files, consider upgrading your Cloudinary plan

### Supported File Types:
- Images: JPG, PNG, GIF, WebP, etc.
- Documents: PDF, DOC, DOCX, TXT, etc.
- Videos: MP4, MOV, AVI, etc.

## Security Notes:
- The API secret is only used for server-side operations
- Client-side uploads use unsigned presets for security
- Files are stored in your private Cloudinary account
