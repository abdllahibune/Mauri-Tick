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

export async function uploadToCloudinary(file: File | string, returnBoth: boolean = false) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'mauri_uploads');
  formData.append('eager', 
    'e_improve,e_sharpen:100,e_vibrance:50,' +
    'q_auto:best,f_auto,w_800,h_800,c_pad,' +
    'b_white'
  );
  formData.append('eager_async', 'false');

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/dy5qfryut/image/upload',
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  
  if (data.secure_url) {
    const original = data.secure_url;
    // Use enhanced version from eager if available, otherwise manual fallback
    let enhanced = original;
    if (data.eager?.[0]?.secure_url) {
      enhanced = data.eager[0].secure_url;
    } else {
      enhanced = original.replace(
        '/upload/',
        '/upload/e_improve,e_sharpen:80,e_vibrance:30,q_auto:best,f_auto/'
      );
    }
    
    if (returnBoth) {
      return { original, enhanced };
    }
    return enhanced;
  }
  
  console.error('Cloudinary upload error:', data.error);
  return null;
}
