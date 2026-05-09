// SETUP CLOUDINARY:
// 1. Go to cloudinary.com and create free account
// 2. Dashboard > Settings > Upload
// 3. Click "Add upload preset"
// 4. Set Signing Mode to "Unsigned"
// 5. Save and copy the preset name
// 6. Replace YOUR_UPLOAD_PRESET with preset name
// 7. Replace YOUR_CLOUD_NAME with your cloud name
//    (found on Cloudinary dashboard top-left)

const CLOUD = "dy5qfryut";
const PRESET = "mauri_uploads";

export async function uploadToCloudinary(file: File | string) {
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`,
      { method: 'POST', body: formData }
    );
    
    const data = await res.json();
    
    if (data.secure_url) {
      return data.secure_url;
    }
    
    console.error('Cloudinary upload error:', data.error);
    return null;
    
  } catch(e) {
    console.error('Cloudinary upload exception:', e);
    return null;
  }
}
