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
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        if (response.secure_url) {
          resolve(response.secure_url);
        } else {
          reject(new Error('فشل رفع الصورة: رابط غير موجود'));
        }
      } else {
        try {
          const error = JSON.parse(xhr.responseText);
          reject(new Error(error.error?.message || 'فشل رفع الصورة'));
        } catch (e) {
          reject(new Error('فشل رفع الصورة (خطأ غير معروف)'));
        }
      }
    };

    xhr.onerror = () => reject(new Error('خطأ في الاتصال بخدمة رفع الصور'));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    xhr.send(formData);
  });
}
