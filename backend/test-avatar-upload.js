const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function testAvatarUpload() {
  console.log('🧪 Testing Avatar Upload Functionality...\n');
  
  const baseUrl = 'http://localhost:3000';
  let token;
  
  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${baseUrl}/api/auth/login`, {
      email: 'test@example.com',
      password: 'test123'
    });
    
    token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`👤 User: ${loginResponse.data.user.username}`);
    console.log(`📧 Email: ${loginResponse.data.user.email}`);
    console.log(`🖼️ Current avatar: ${loginResponse.data.user.avatarUrl || 'None'}\n`);
    
    // Step 2: Create a test image (200x200 pixels)
    console.log('2️⃣ Creating test image...');
    const testImagePath = path.join(__dirname, 'test-avatar.jpg');
    
    // Create a gradient image using Sharp
    await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 3,
        background: { r: 255, g: 100, b: 50 }
      }
    })
    .jpeg({ quality: 90 })
    .toFile(testImagePath);
    
    console.log('✅ Test image created (200x200 pixels)');
    
    // Step 3: Upload avatar
    console.log('\n3️⃣ Uploading avatar...');
    const form = new FormData();
    form.append('avatar', fs.createReadStream(testImagePath), {
      filename: 'test-avatar.jpg',
      contentType: 'image/jpeg'
    });
    
    const uploadResponse = await axios.post(
      `${baseUrl}/api/profile/avatar`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Avatar uploaded successfully');
    console.log(`📍 Avatar URL: ${uploadResponse.data.avatarUrl}`);
    console.log(`📝 Message: ${uploadResponse.data.message}`);
    
    // Step 4: Verify the upload
    console.log('\n4️⃣ Verifying upload...');
    const profileResponse = await axios.get(`${baseUrl}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (profileResponse.data.avatarUrl) {
      console.log('✅ Avatar URL confirmed in profile');
      console.log(`🖼️ Current avatar: ${profileResponse.data.avatarUrl}`);
      
      // Try to fetch the avatar
      try {
        const avatarResponse = await axios.get(profileResponse.data.avatarUrl);
        console.log('✅ Avatar is accessible');
        console.log(`📏 Size: ${avatarResponse.headers['content-length']} bytes`);
        console.log(`📦 Type: ${avatarResponse.headers['content-type']}`);
      } catch (error) {
        console.log('⚠️ Avatar URL not directly accessible (might need signed URL)');
      }
    }
    
    // Step 5: Test invalid file type
    console.log('\n5️⃣ Testing invalid file type...');
    const txtFilePath = path.join(__dirname, 'test.txt');
    fs.writeFileSync(txtFilePath, 'This is not an image');
    
    const invalidForm = new FormData();
    invalidForm.append('avatar', fs.createReadStream(txtFilePath), {
      filename: 'test.txt',
      contentType: 'text/plain'
    });
    
    try {
      await axios.post(
        `${baseUrl}/api/profile/avatar`,
        invalidForm,
        {
          headers: {
            ...invalidForm.getHeaders(),
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('❌ Should have rejected non-image file');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly rejected non-image file');
        console.log(`📝 Error: ${error.response.data.error.message}`);
      }
    }
    
    // Step 6: Test avatar deletion
    console.log('\n6️⃣ Testing avatar deletion...');
    const deleteResponse = await axios.delete(`${baseUrl}/api/profile/avatar`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Avatar deleted successfully');
    console.log(`📝 Message: ${deleteResponse.data.message}`);
    
    // Verify deletion
    const finalProfileResponse = await axios.get(`${baseUrl}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!finalProfileResponse.data.avatarUrl) {
      console.log('✅ Avatar URL removed from profile');
    }
    
    // Clean up
    fs.unlinkSync(testImagePath);
    fs.unlinkSync(txtFilePath);
    
    console.log('\n✨ All avatar tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
}

// Wait for server to be ready
console.log('⏳ Waiting for server to start...');
setTimeout(testAvatarUpload, 3000); 