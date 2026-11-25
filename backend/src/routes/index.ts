import { Router } from 'express';
import * as authCtrl from '../controllers/authController';
import * as mediaCtrl from '../controllers/mediaController';
import * as incidentCtrl from '../controllers/incidentController';
import * as teamCtrl from '../controllers/teamController';
import * as statsCtrl from '../controllers/statsController';
import * as userCtrl from '../controllers/userController';
import * as aiCtrl from '../controllers/aiController';
import { requireAuth, optionalAuth, requireRole } from '../middlewares/auth';
import { uploadImages, uploadAudio } from '../middlewares/upload';

export const apiRouter = Router();

// Auth
apiRouter.post('/auth/register', authCtrl.register);
apiRouter.post('/auth/login', authCtrl.login);
apiRouter.post('/auth/demo-login', authCtrl.demoLogin);
apiRouter.get('/auth/me', requireAuth, authCtrl.getMe);

// Media (Cloudinary)
apiRouter.post('/media/upload', uploadImages.array('files', 8), mediaCtrl.uploadMedia);
apiRouter.delete('/media', mediaCtrl.deleteMedia);

// Incidents (MOD-01, MOD-02, MOD-03, MOD-04, MOD-05)
apiRouter.post('/incidents/check-duplicate', optionalAuth, incidentCtrl.checkDuplicates);
apiRouter.get('/incidents', optionalAuth, incidentCtrl.listIncidents);
apiRouter.get('/incidents/:id', optionalAuth, incidentCtrl.getIncidentById);
apiRouter.post('/incidents', optionalAuth, incidentCtrl.createIncident);
apiRouter.patch('/incidents/:id', optionalAuth, incidentCtrl.updateIncident);
apiRouter.delete('/incidents/:id', optionalAuth, incidentCtrl.deleteIncident);
apiRouter.post('/incidents/:id/upvote', optionalAuth, incidentCtrl.upvoteIncident);
apiRouter.post('/incidents/:id/link-duplicate', optionalAuth, incidentCtrl.linkDuplicate);
apiRouter.post('/incidents/:targetId/merge/:sourceId', requireAuth, requireRole('officer', 'leader'), incidentCtrl.mergeIncidents);
apiRouter.post('/incidents/:id/rating', optionalAuth, incidentCtrl.rateIncident);
apiRouter.post('/incidents/:id/approve', requireAuth, requireRole('officer', 'leader'), incidentCtrl.approveIncident);
apiRouter.post('/incidents/:id/reject', requireAuth, requireRole('officer', 'leader'), incidentCtrl.rejectIncident);
apiRouter.post('/incidents/:id/assign', requireAuth, requireRole('officer', 'leader'), incidentCtrl.assignIncident);
apiRouter.post('/incidents/:id/verify', requireAuth, requireRole('officer', 'leader', 'volunteer'), incidentCtrl.verifyIncident);
apiRouter.post('/incidents/:id/start', requireAuth, requireRole('officer', 'leader', 'volunteer'), incidentCtrl.startIncident);
apiRouter.post('/incidents/:id/resolve', requireAuth, requireRole('officer', 'leader', 'volunteer'), incidentCtrl.resolveIncident);
apiRouter.patch('/incidents/:id/workflow/:stepId', requireAuth, requireRole('officer', 'leader', 'volunteer'), incidentCtrl.toggleWorkflowStep);

// Teams & Members (MOD-04)
apiRouter.get('/teams', teamCtrl.getTeams);
apiRouter.post('/teams/units', requireAuth, requireRole('officer', 'leader'), teamCtrl.createUnit);
apiRouter.patch('/teams/units/:id', requireAuth, requireRole('officer', 'leader'), teamCtrl.updateUnit);
apiRouter.delete('/teams/units/:id', requireAuth, requireRole('officer', 'leader'), teamCtrl.deleteUnit);
apiRouter.post('/teams/members', requireAuth, requireRole('officer', 'leader'), teamCtrl.createMember);
apiRouter.patch('/teams/members/:id', requireAuth, requireRole('officer', 'leader'), teamCtrl.updateMember);
apiRouter.delete('/teams/members/:id', requireAuth, requireRole('officer', 'leader'), teamCtrl.deleteMember);

// Users / Accounts Management (Admin + Self Profile Update)
apiRouter.get('/users', requireAuth, requireRole('officer', 'leader'), userCtrl.listUsers);
apiRouter.post('/users', requireAuth, requireRole('officer', 'leader'), userCtrl.createUser);
apiRouter.patch('/users/:id', requireAuth, userCtrl.updateUser);
apiRouter.delete('/users/:id', requireAuth, requireRole('officer', 'leader'), userCtrl.deleteUser);

// AI Assistant (Chatbot & Direct Audio Voice Command)
apiRouter.post('/ai/assistant', optionalAuth, aiCtrl.citizenAssistant);
apiRouter.post('/ai/voice-command', optionalAuth, uploadAudio.single('audio'), aiCtrl.citizenVoiceCommand);

// Stats
apiRouter.get('/stats/summary', statsCtrl.getSummaryStats);
