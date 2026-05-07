/**
 * Cloudinary helper for image uploads
 */

// Cloudinary setup:
// 1. Go to cloudinary.com
// 2. Settings > Upload > Add upload preset
// 3. Set signing mode to "Unsigned"
// 4. Copy preset name to CLOUDINARY_UPLOAD_PRESET
// 5. Copy cloud name to CLOUDINARY_CLOUD_NAME

const CLOUDINARY_UPLOAD_PRESET = "mauri_tick"; 
const CLOUDINARY_CLOUD_NAME = "dnq359vms";

export async function uploadToCloudinary(file: File, onProgress?: (progress: number) => void): Promise<string> {
  // If progress is needed, note that fetch doesn't support upload progress natively in all browsers
  // but we can simulate it or just use the requested fetch pattern.
  if (onProgress) onProgress(50); // Fake start

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const data = await response.json();
    
    if (data.secure_url) {
      if (onProgress) onProgress(100);
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'فشل رفع الصورة');
    }
  } catch (error: any) {
    throw new Error(error.message || 'خطأ في الاتصال بخدمة رفع الصور');
  }
}
