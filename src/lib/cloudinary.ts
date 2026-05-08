// SETUP CLOUDINARY:
// 1. Go to cloudinary.com and create free account
// 2. Dashboard > Settings > Upload
// 3. Click "Add upload preset"
// 4. Set Signing Mode to "Unsigned"
// 5. Save and copy the preset name
// 6. Replace YOUR_UPLOAD_PRESET with preset name
// 7. Replace YOUR_CLOUD_NAME with your cloud name
//    (found on Cloudinary dashboard top-left)

const CLOUDINARY_CLOUD_NAME = "dy5qfryut";
const CLOUDINARY_UPLOAD_PRESET = "mauri_uploads";

export const uploadToCloudinary = async (file: File, onProgress?: (progress: number) => void) => {
  // Validate file - Increased to 10MB as requested
  if (file.size > 10 * 1024 * 1024) {
    alert("الصورة كبيرة جداً — الحد الأقصى 10MB");
    return null;
  }
  
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  
  try {
    // Note: Fetch API doesn't support progress events for uploads natively.
    // For progress tracking, we'd normally use XMLHttpRequest, but we'll stick to the requested fetch pattern.
    // We can simulate progress if needed or just skip it as per the new requested function.
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url as string;
    } else {
      alert("فشل رفع الصورة: " + JSON.stringify(data.error));
      return null;
    }
  } catch (error: any) {
    alert("خطأ في رفع الصورة: " + error.message);
    return null;
  }
};
