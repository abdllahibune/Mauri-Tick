/**
 * Cloudinary helper for image uploads
 */
const CLOUDINARY_UPLOAD_PRESET = "YOUR_UPLOAD_PRESET"; // User should set this
const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME"; // User should set this

export async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('فشل رفع الصورة');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}
