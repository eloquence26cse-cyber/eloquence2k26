const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const adminController = require('../controllers/adminController');

const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit for PDF pass documents
});

const handleMultipartOrJson = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    upload.fields([{ name: 'screenshot', maxCount: 1 }, { name: 'paymentScreenshot', maxCount: 1 }])(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message || 'File upload error' });
      }
      if (req.files) {
        req.file = (req.files.screenshot && req.files.screenshot[0]) || (req.files.paymentScreenshot && req.files.paymentScreenshot[0]);
      }
      next();
    });
  } else {
    next();
  }
};

// ── Public Routes ─────────────────────────────────────────────────────────────
router.get('/health', apiController.getHealth);
router.get('/status', apiController.getStatus);
router.post('/register', handleMultipartOrJson, apiController.registerEvent);
router.post('/registrations/:id/payment-screenshot', handleMultipartOrJson, apiController.uploadPaymentScreenshot);
router.post('/payment/create-order', apiController.createPaymentOrder);
router.post('/payment/verify-and-register', apiController.verifyPaymentAndRegister);
router.get('/registrations', apiController.getRegistrations);
router.get('/registrations/:id', apiController.getRegistrationById);
router.post('/registrations/import-pdf', uploadPdf.any(), adminController.importPdfPass);
router.post('/registrations/save-imported', adminController.saveImportedRegistrations);
router.get('/events', apiController.getPublicEvents);
router.get('/registration-status', apiController.getRegistrationStatus);

// Public Sponsors & Coordinators
router.get('/sponsors', apiController.getActiveSponsors);
router.get('/sponsors/:id', apiController.getPublicSponsorById);
router.get('/coordinators', apiController.getActiveCoordinators);
router.get('/coordinators/event/:eventId', apiController.getCoordinatorsByEvent);
router.get('/student-coordinators', apiController.getStudentCoordinators);
router.get('/homepage-coordinators', apiController.getPublicHomepageCoordinators);

// Participant List Dispatch
router.post('/send-participant-list', apiController.sendParticipantList);
router.get('/dispatches', apiController.getDispatches);
router.put('/dispatches/:id', apiController.updateDispatch);
router.delete('/dispatches/:id', apiController.deleteDispatch);

// ── Admin Auth & Dashboard ───────────────────────────────────────────────────
router.post('/admin/login', adminController.login);
router.get('/admin/dashboard', adminController.verifyToken, adminController.getDashboardData);

// ── Admin User Management ────────────────────────────────────────────────────
router.get('/admin/users', adminController.verifyToken, adminController.getUsers);
router.post('/admin/users', adminController.verifyToken, adminController.requireWriteAccess, adminController.createUser);
router.put('/admin/users/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.updateUser);
router.delete('/admin/users/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.deleteUser);

// ── Admin Role Management ────────────────────────────────────────────────────
router.get('/admin/roles', adminController.verifyToken, adminController.getRoles);
router.post('/admin/roles', adminController.verifyToken, adminController.requireWriteAccess, adminController.createRole);
router.put('/admin/roles/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.updateRole);
router.delete('/admin/roles/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.deleteRole);

// ── Admin Event Allocation Management ────────────────────────────────────────
router.get('/admin/event-allocations', adminController.verifyToken, adminController.getEventAllocations);
router.post('/admin/event-allocations', adminController.verifyToken, adminController.requireWriteAccess, adminController.updateEventAllocation);

// ── Admin Event Management ───────────────────────────────────────────────────
router.get('/admin/events', adminController.verifyToken, adminController.getEvents);
router.post('/admin/events', adminController.verifyToken, adminController.requireWriteAccess, adminController.createEvent);
router.put('/admin/events/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.updateEvent);
router.delete('/admin/events/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.deleteEvent);

// ── Admin Sponsor Management ─────────────────────────────────────────────────
router.get('/admin/sponsors', adminController.verifyToken, adminController.getSponsors);
router.get('/admin/sponsors/:id', adminController.verifyToken, adminController.getSponsorById);
router.post('/admin/sponsors', adminController.verifyToken, adminController.requireWriteAccess, adminController.createSponsor);
router.put('/admin/sponsors/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.updateSponsor);
router.patch('/admin/sponsors/:id/toggle', adminController.verifyToken, adminController.requireWriteAccess, adminController.toggleSponsorStatus);
router.delete('/admin/sponsors/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.deleteSponsor);
router.post('/admin/upload', adminController.verifyToken, adminController.requireWriteAccess, adminController.uploadLogo);

// ── Admin Coordinator Management ─────────────────────────────────────────────
router.get('/admin/coordinators', adminController.verifyToken, adminController.getCoordinators);
router.get('/admin/coordinators/:id', adminController.verifyToken, adminController.getCoordinatorById);
router.post('/admin/coordinators', adminController.verifyToken, adminController.requireWriteAccess, adminController.createCoordinator);
router.put('/admin/coordinators/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.updateCoordinator);
router.patch('/admin/coordinators/:id/toggle', adminController.verifyToken, adminController.requireWriteAccess, adminController.toggleCoordinatorStatus);
router.delete('/admin/coordinators/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.deleteCoordinator);

// ── Admin Registration Management ──────────────────────────────────────────
router.delete('/admin/registrations/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.deleteRegistration);
router.get('/admin/registrations/:id/payment-screenshot', adminController.verifyToken, adminController.getRegistrationScreenshot);
router.patch('/admin/registrations/:id/payment-status', adminController.verifyToken, adminController.updatePaymentStatus);
router.patch('/admin/registrations/:id/verify', adminController.verifyToken, adminController.verifyRegistration);
router.post('/admin/registrations/:id/verify', adminController.verifyToken, adminController.verifyRegistration);
router.patch('/admin/registrations/:id/verification', adminController.verifyToken, adminController.verifyRegistration);
router.post('/admin/registrations/:id/verification', adminController.verifyToken, adminController.verifyRegistration);
router.patch('/admin/registrations/:id/flag', adminController.verifyToken, adminController.verifyRegistration);
router.post('/admin/registrations/:id/flag', adminController.verifyToken, adminController.verifyRegistration);
router.post('/admin/registrations/import-pdf', adminController.verifyToken, uploadPdf.any(), adminController.importPdfPass);
router.post('/admin/registrations/save-imported', adminController.verifyToken, adminController.saveImportedRegistrations);

// ── Admin Homepage Coordinator Team Management ───────────────────────────
router.get('/admin/homepage-coordinators', adminController.verifyToken, adminController.getHomepageCoordinators);
router.get('/admin/homepage-coordinators/:id', adminController.verifyToken, adminController.getHomepageCoordinatorById);
router.post('/admin/homepage-coordinators', adminController.verifyToken, adminController.requireWriteAccess, adminController.createHomepageCoordinator);
router.put('/admin/homepage-coordinators/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.updateHomepageCoordinator);
router.patch('/admin/homepage-coordinators/:id/toggle', adminController.verifyToken, adminController.requireWriteAccess, adminController.toggleHomepageCoordinatorStatus);
router.delete('/admin/homepage-coordinators/:id', adminController.verifyToken, adminController.requireWriteAccess, adminController.deleteHomepageCoordinator);

// ── Admin Registration Access Control (Close RG - Superadmin & Admin only) ──
router.get('/admin/registration-status', adminController.verifyToken, adminController.requireAdminOrSuperadmin, adminController.getAdminRegistrationStatus);
router.post('/admin/registration-status', adminController.verifyToken, adminController.requireAdminOrSuperadmin, adminController.updateRegistrationStatus);

// ── Event Coordinator & Winner Endpoints ──────────────────────────────
router.get('/winners', apiController.getEventWinners);
router.get('/winners/:eventId', apiController.getEventWinners);
router.post('/winners', apiController.submitEventWinners);
router.put('/events/:id/coordinator-update', apiController.updateEventCoordinatorDetails);

// ── Certificates, Attendance Logs & Event Scores DB Endpoints ────────
router.get('/certificates', apiController.getCertificates);
router.post('/certificates', apiController.createCertificate);
router.delete('/certificates/:id', apiController.deleteCertificate);

router.get('/attendance-logs', apiController.getAttendanceLogs);
router.post('/attendance-logs', apiController.createAttendanceLog);

router.get('/event-scores', apiController.getEventScores);
router.post('/event-scores', apiController.createEventScore);
router.put('/event-scores/:id', apiController.updateEventScore);
router.delete('/event-scores/:id', apiController.deleteEventScore);

module.exports = router;

