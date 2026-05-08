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

console.log('Cloud:', CLOUDINARY_CLOUD_NAME);
console.log('Preset:', CLOUDINARY_UPLOAD_PRESET);

export async function uploadToCloudinary(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  
  const data = await res.json();
  
  if (data.secure_url) {
    return data.secure_url;
  } else {
    alert('خطأ: ' + JSON.stringify(data.error));
    return null;
  }
}
