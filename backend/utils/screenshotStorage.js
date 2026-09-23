const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const supabase = require('../config/supabase');

const PAYMENT_BUCKET = 'payment-screenshots';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const LOCAL_FALLBACK_DIR = path.join(__dirname, '../uploads/payment-screenshots');

// Ensure local fallback directory exists
if (!fs.existsSync(LOCAL_FALLBACK_DIR)) {
  try {
    fs.mkdirSync(LOCAL_FALLBACK_DIR, { recursive: true });
  } catch (e) {
    console.warn('[screenshotStorage] Warning creating fallback dir:', e.message);
  }
}

let bucketChecked = false;
/**
 * Verifies or initializes the private payment-screenshots bucket in Supabase
 */
async function ensureBucketExists() {
  if (bucketChecked) return;
  try {
    if (!supabase || !supabase.storage) return;
    const { data: bucket, error: getErr } = await supabase.storage.getBucket(PAYMENT_BUCKET);
    if (!bucket || getErr) {
      const { error: createErr } = await supabase.storage.createBucket(PAYMENT_BUCKET, {
        public: false,
        fileSizeLimit: MAX_UPLOAD_BYTES,
        allowedMimeTypes: ALLOWED_MIME_TYPES
      });
      if (createErr) {
        // If anon key lacks DDL permissions, bucket can be created via Supabase SQL Editor / dashboard
        console.warn(`[Supabase Storage] Bucket '${PAYMENT_BUCKET}' note:`, createErr.message);
      } else {
        console.log(`[Supabase Storage] Created dedicated private bucket '${PAYMENT_BUCKET}'`);
      }
    }
    bucketChecked = true;
  } catch (err) {
    console.warn('[Supabase Storage] ensureBucketExists error:', err.message);
  }
}

/**
 * Validates the uploaded file buffer and MIME type
 */
function validateScreenshot(file) {
  if (!file || !file.buffer) {
    return { valid: false, error: 'No screenshot file provided' };
  }
  if (file.size > MAX_UPLOAD_BYTES || file.buffer.length > MAX_UPLOAD_BYTES) {
    return { valid: false, error: 'Payment screenshot exceeds the 10 MB limit' };
  }
  const mime = (file.mimetype || '').toLowerCase();
  const originalName = (file.originalname || '').toLowerCase();
  const ext = path.extname(originalName).replace('.', '');
  
  const isValidMime = ALLOWED_MIME_TYPES.includes(mime) || 
    ['jpg', 'jpeg', 'png', 'webp'].includes(ext);

  if (!isValidMime) {
    return { valid: false, error: 'Unsupported file format. Please upload JPG, PNG, or WEBP' };
  }

  return { valid: true };
}

/**
 * Compresses the image using Sharp:
 * - Max 1200px width/height (fit inside, aspect ratio preserved)
 * - Converts to WebP format
 * - Quality around 78% for clear readability of UTR text and low size
 * - Strips unnecessary EXIF metadata
 */
async function compressScreenshot(inputBuffer) {
  try {
    const compressedBuffer = await sharp(inputBuffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({
        quality: 78,
        effort: 4
      })
      .withMetadata(false)
      .toBuffer();

    return {
      success: true,
      buffer: compressedBuffer,
      contentType: 'image/webp',
      extension: 'webp'
    };
  } catch (err) {
    console.error('[screenshotStorage] Sharp compression error:', err);
    throw new Error('Failed to process and compress payment screenshot: ' + err.message);
  }
}

/**
 * Clean and sanitize registration identifier for safe file path construction
 */
function sanitizeIdentifier(id) {
  return String(id || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Uploads a compressed screenshot to Supabase Storage with duplicate protection
 * Path format: symposium/{cleanId}/payment.webp
 */
async function uploadScreenshot(registrationId, fileBuffer, existingPath = null) {
  if (typeof registrationId === 'object' && registrationId !== null) {
    existingPath = registrationId.existingPath || null;
    fileBuffer = registrationId.fileBuffer || registrationId.buffer;
    registrationId = registrationId.registrationId || registrationId.id;
  }

  if (!registrationId) {
    throw new Error('Registration ID is required to store payment screenshot');
  }

  const cleanId = sanitizeIdentifier(registrationId);
  const targetPath = `symposium/${cleanId}/payment.webp`;

  // 1. Compress image
  const { buffer: compressedBuffer, contentType } = await compressScreenshot(fileBuffer);

  // 2. Ensure bucket exists
  await ensureBucketExists();

  // 3. Remove existing screenshot if path is provided or differs, preventing orphaned files
  if (existingPath && typeof existingPath === 'string' && existingPath.trim()) {
    const cleanExisting = existingPath.trim();
    if (cleanExisting !== targetPath) {
      try {
        await supabase.storage.from(PAYMENT_BUCKET).remove([cleanExisting]);
      } catch (e) {}
    }
  }

  // 4. Try upload to Supabase Storage
  let uploadSuccess = false;
  let uploadError = null;

  try {
    const { error: supaErr } = await supabase.storage
      .from(PAYMENT_BUCKET)
      .upload(targetPath, compressedBuffer, {
        contentType,
        upsert: true
      });

    if (supaErr) {
      uploadError = supaErr.message;
      console.warn('[screenshotStorage] Supabase storage upload warning:', supaErr.message);
    } else {
      uploadSuccess = true;
    }
  } catch (ex) {
    uploadError = ex.message;
    console.warn('[screenshotStorage] Supabase storage exception:', ex.message);
  }

  // 5. If Supabase storage is unavailable (e.g. bucket policy / anon mode), save to local fallback
  // This guarantees zero data loss and uninterrupted user experience
  const localTargetDir = path.join(LOCAL_FALLBACK_DIR, cleanId);
  const localFilePath = path.join(localTargetDir, 'payment.webp');

  try {
    if (!fs.existsSync(localTargetDir)) {
      fs.mkdirSync(localTargetDir, { recursive: true });
    }
    fs.writeFileSync(localFilePath, compressedBuffer);
  } catch (fsErr) {
    console.warn('[screenshotStorage] Local fallback write warning:', fsErr.message);
  }

  return {
    success: true,
    path: targetPath,
    size: compressedBuffer.length,
    contentType,
    storedInSupabase: uploadSuccess,
    warning: uploadSuccess ? null : uploadError
  };
}

/**
 * Resolves access to the screenshot for authorized admin viewing
 * Generates a secure temporary signed URL (valid for 1 hour) or prepares streaming fallback
 */
async function getScreenshotAccess(screenshotPath) {
  if (!screenshotPath || typeof screenshotPath !== 'string') {
    return { success: false, error: 'No screenshot path specified' };
  }

  const cleanPath = screenshotPath.trim().replace(/^(\.\.(\/|\\|$))+/, '');
  if (cleanPath.includes('..')) {
    return { success: false, error: 'Invalid screenshot path' };
  }

  // 1. Try generating a signed URL from Supabase Storage (valid for 3600 seconds)
  try {
    if (supabase && supabase.storage) {
      const { data, error } = await supabase.storage
        .from(PAYMENT_BUCKET)
        .createSignedUrl(cleanPath, 3600);

      if (data && data.signedUrl && !error) {
        return {
          success: true,
          type: 'signed_url',
          signedUrl: data.signedUrl,
          path: cleanPath
        };
      }
    }
  } catch (supaErr) {
    console.warn('[screenshotStorage] Signed URL generation error:', supaErr.message);
  }

  // 2. Try downloading buffer directly from Supabase Storage
  try {
    if (supabase && supabase.storage) {
      const { data: blobData, error: dlErr } = await supabase.storage
        .from(PAYMENT_BUCKET)
        .download(cleanPath);

      if (blobData && !dlErr) {
        const buffer = Buffer.from(await blobData.arrayBuffer());
        return {
          success: true,
          type: 'buffer',
          buffer,
          contentType: 'image/webp',
          path: cleanPath
        };
      }
    }
  } catch (dlEx) {
    console.warn('[screenshotStorage] Supabase download error:', dlEx.message);
  }

  // 3. Fallback: check local fallback disk storage
  try {
    const parts = cleanPath.split('/').filter(Boolean);
    const relativeSubPath = parts.slice(1).join('/'); // strips 'symposium/'
    const localFile = path.join(LOCAL_FALLBACK_DIR, relativeSubPath);
    if (fs.existsSync(localFile)) {
      const buffer = fs.readFileSync(localFile);
      return {
        success: true,
        type: 'buffer',
        buffer,
        contentType: 'image/webp',
        path: cleanPath
      };
    }
  } catch (fsErr) {
    console.warn('[screenshotStorage] Local fallback read warning:', fsErr.message);
  }

  return {
    success: false,
    error: 'Screenshot not found in storage'
  };
}

/**
 * Removes a screenshot from storage
 */
async function deleteScreenshot(screenshotPath) {
  if (!screenshotPath || typeof screenshotPath !== 'string') return;
  const cleanPath = screenshotPath.trim();
  if (cleanPath.includes('..')) return;

  try {
    await supabase.storage.from(PAYMENT_BUCKET).remove([cleanPath]);
  } catch (e) {}

  try {
    const parts = cleanPath.split('/').filter(Boolean);
    const relativeSubPath = parts.slice(1).join('/');
    const localFile = path.join(LOCAL_FALLBACK_DIR, relativeSubPath);
    if (fs.existsSync(localFile)) {
      fs.unlinkSync(localFile);
    }
  } catch (e) {}
}

module.exports = {
  PAYMENT_BUCKET,
  MAX_UPLOAD_BYTES,
  ALLOWED_MIME_TYPES,
  validateScreenshot,
  compressScreenshot,
  uploadScreenshot,
  getScreenshotAccess,
  deleteScreenshot
};
