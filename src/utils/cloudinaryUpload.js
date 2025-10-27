// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'school_portal';

export const uploadToCloudinary = async (file, folder = 'study-materials') => {
  try {
    console.log('Uploading file to Cloudinary:', file.name);
    console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME);
    console.log('Upload Preset:', CLOUDINARY_UPLOAD_PRESET);
    console.log('Folder:', folder);
    
    // Create FormData for the file
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    
    // Upload to Cloudinary using the upload API
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
    console.log('Upload URL:', uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Upload failed with status:', response.status);
      console.error('Error response:', errorText);
      throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Cloudinary upload successful:', result);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      fileName: file.name,
      fileSize: result.bytes,
      format: result.format
    };
    
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    console.log('Deleting from Cloudinary:', publicId);
    
    // For client-side deletion, we'll use a serverless function or API endpoint
    // For now, we'll just log the deletion request
    console.log('File deletion requested for publicId:', publicId);
    console.log('Note: File deletion should be handled server-side for security');
    
    return { result: 'ok' };
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};
