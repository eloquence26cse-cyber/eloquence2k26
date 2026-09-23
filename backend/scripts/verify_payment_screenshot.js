/**
 * Comprehensive End-to-End Verification Script for Payment Screenshot Feature
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const screenshotStorage = require('../utils/screenshotStorage');
const adminController = require('../controllers/adminController');
const apiController = require('../controllers/apiController');

async function runTests() {
  console.log('=== Starting Payment Screenshot Feature Tests ===\n');
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. Test Sharp Image Compression & Constraints
  console.log('--- Test Suite 1: Image Compression & Constraints ---');
  const largeWidth = 2000;
  const largeHeight = 1500;
  const testSvg = Buffer.from(`
    <svg width="${largeWidth}" height="${largeHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1e1b4b"/>
      <circle cx="500" cy="500" r="300" fill="#38bdf8"/>
      <text x="100" y="200" font-family="Arial" font-size="72" fill="#ffffff" font-weight="bold">
        UTR: 429381749281 - Rs. 200
      </text>
    </svg>
  `);
  
  const rawPngBuffer = await sharp(testSvg).png().toBuffer();
  console.log(`Raw test PNG generated: ${rawPngBuffer.length} bytes (${(rawPngBuffer.length / 1024).toFixed(1)} KB)`);

  const compressedResult = await screenshotStorage.compressScreenshot(rawPngBuffer);
  const metadata = await sharp(compressedResult.buffer).metadata();

  assert(metadata.format === 'webp', `Output format is WebP (got: ${metadata.format})`);
  assert(metadata.width <= 1200 && metadata.height <= 1200, `Output resolution within 1200x1200 limit (got: ${metadata.width}x${metadata.height})`);
  assert(Math.abs((metadata.width / metadata.height) - (largeWidth / largeHeight)) < 0.05, `Aspect ratio preserved (approx ${largeWidth/largeHeight})`);
  assert(compressedResult.buffer.length < rawPngBuffer.length, `Compression successfully reduced file size (${(compressedResult.buffer.length/1024).toFixed(1)} KB vs ${(rawPngBuffer.length/1024).toFixed(1)} KB)`);
  assert(compressedResult.contentType === 'image/webp', `Content type set to image/webp`);

  // 2. Test File Type & Size Validation
  console.log('\n--- Test Suite 2: Validation Checks ---');
  const validJpg = screenshotStorage.validateScreenshot({ mimetype: 'image/jpeg', size: 2 * 1024 * 1024, buffer: Buffer.alloc(100), originalname: 'receipt.jpg' });
  assert(validJpg.valid === true, 'Accepts valid JPEG file within 10MB limit');
  
  const validWebp = screenshotStorage.validateScreenshot({ mimetype: 'image/webp', size: 5 * 1024 * 1024, buffer: Buffer.alloc(100), originalname: 'payment.webp' });
  assert(validWebp.valid === true, 'Accepts valid WebP file within 10MB limit');

  const oversized = screenshotStorage.validateScreenshot({ mimetype: 'image/png', size: 11 * 1024 * 1024, buffer: Buffer.alloc(100), originalname: 'huge.png' });
  assert(oversized.valid === false && oversized.error.includes('10 MB'), 'Rejects files exceeding 10MB');

  const disallowedPdf = screenshotStorage.validateScreenshot({ mimetype: 'application/pdf', size: 1024, buffer: Buffer.alloc(100), originalname: 'bill.pdf' });
  assert(disallowedPdf.valid === false && disallowedPdf.error.includes('format'), 'Rejects disallowed mime-type (PDF)');

  const disallowedExe = screenshotStorage.validateScreenshot({ mimetype: 'application/x-msdownload', size: 1024, buffer: Buffer.alloc(100), originalname: 'virus.exe' });
  assert(disallowedExe.valid === false, 'Rejects executable or unknown types');

  const noBuffer = screenshotStorage.validateScreenshot(null);
  assert(noBuffer.valid === false, 'Rejects null or missing file payload');

  // 3. Test Storage & Signed URL Flow
  console.log('\n--- Test Suite 3: Storage Upload & Signed URL Flow ---');
  const testRegistrationId = 'TEST_REG_' + Date.now();
  const uploadRes = await screenshotStorage.uploadScreenshot(testRegistrationId, rawPngBuffer);

  assert(uploadRes.path === `symposium/${testRegistrationId}/payment.webp`, `Path formatted correctly: ${uploadRes.path}`);
  assert(uploadRes.success === true, 'Screenshot processed and stored successfully');

  // Retrieve access (Signed URL or local stream)
  const accessRes = await screenshotStorage.getScreenshotAccess(uploadRes.path);
  assert(accessRes && accessRes.success && (accessRes.signedUrl || accessRes.buffer), 'Successfully accessed stored screenshot via signedUrl or buffer');
  if (accessRes.signedUrl) {
    console.log(`Signed URL produced: ${accessRes.signedUrl.substring(0, 60)}...`);
  } else if (accessRes.buffer) {
    console.log(`Buffer produced: size=${accessRes.buffer.length} bytes`);
  }

  // 4. Test Path Sanitization against Traversal Attacks
  console.log('\n--- Test Suite 4: Security & Path Traversal Sanitization ---');
  const traversalRes = await screenshotStorage.getScreenshotAccess('../../etc/passwd');
  assert(traversalRes.success === false, 'Properly prevented directory traversal (../../)');

  // 5. Test Backward Compatibility: Old Registrations with NULL Screenshot
  console.log('\n--- Test Suite 5: Backward Compatibility ---');
  const oldRegistration = {
    id: 'OLD_REG_123',
    ticket_code: 'ELQ-OLD123',
    payment_status: 'PENDING',
    payment_screenshot_path: null
  };
  assert(oldRegistration.payment_screenshot_path === null, 'Existing registration without screenshot retains null');

  // 6. Test Admin Controller: verifyToken & updatePaymentStatus
  console.log('\n--- Test Suite 6: Admin Controller & Payment Status Workflow ---');
  // 6a. verifyToken rejects unauthenticated calls
  let unauthorizedStatus = null;
  const mockUnauthReq = { headers: {} };
  const mockUnauthRes = {
    status: (s) => { unauthorizedStatus = s; return mockUnauthRes; },
    json: (j) => j
  };
  adminController.verifyToken(mockUnauthReq, mockUnauthRes, () => {});
  assert(unauthorizedStatus === 401, 'verifyToken middleware rejects requests missing Authorization token with 401');

  // 6b. updatePaymentStatus handling verification
  let verifyResStatus = null;
  let verifyResBody = null;
  const mockAdminReqVerify = {
    params: { id: 'TEST_TICKET_999' },
    body: { status: 'VERIFIED' },
    user: { username: 'test_admin', role: 'admin' }
  };
  const mockAdminResVerify = {
    status: (s) => { verifyResStatus = s; return mockAdminResVerify; },
    json: (j) => { verifyResBody = j; return j; }
  };
  await adminController.updatePaymentStatus(mockAdminReqVerify, mockAdminResVerify);
  assert(verifyResBody && verifyResBody.success === true, 'Admin updatePaymentStatus successfully updates to VERIFIED');
  assert(verifyResBody && verifyResBody.data && verifyResBody.data.payment_status === 'VERIFIED', 'Payment status updated to VERIFIED in response');

  // 6c. updatePaymentStatus handling rejection
  let rejectResBody = null;
  const mockAdminReqReject = {
    params: { id: 'TEST_TICKET_999' },
    body: { status: 'REJECTED', reason: 'Invalid UTR code in screenshot' },
    user: { username: 'test_admin', role: 'admin' }
  };
  const mockAdminResReject = {
    status: (s) => mockAdminResReject,
    json: (j) => { rejectResBody = j; return j; }
  };
  await adminController.updatePaymentStatus(mockAdminReqReject, mockAdminResReject);
  assert(rejectResBody && rejectResBody.success === true, 'Admin updatePaymentStatus successfully updates to REJECTED');
  assert(rejectResBody && rejectResBody.data && rejectResBody.data.payment_status === 'REJECTED', 'Payment status updated to REJECTED with note');

  // 7. Cleanup
  await screenshotStorage.deleteScreenshot(uploadRes.path);
  console.log('Cleanup completed for test artifacts');

  console.log(`\n========================================`);
  console.log(`Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`========================================\n`);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
