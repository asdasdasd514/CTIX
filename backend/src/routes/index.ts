import { Router } from 'express';
import * as authCtrl from '../controllers/authController';
import * as mediaCtrl from '../controllers/mediaController';
import * as incidentCtrl from '../controllers/incidentController';
import * as teamCtrl from '../controllers/teamController';
import * as statsCtrl from '../controllers/statsController';
import * as userCtrl from '../controllers/userController';
import { requireAuth, optionalAuth } from '../middlewares/auth';
import { uploadImages } from '../middlewares/upload';

export const apiRouter = Router();

// Auth
apiRouter.post('/auth/register', authCtrl.register);
apiRouter.post('/auth/login', authCtrl.login);
apiRouter.post('/auth/demo-login', authCtrl.demoLogin);
apiRouter.get('/auth/me', requireAuth, authCtrl.getMe);

// Media (Cloudinary)
apiRouter.post('/media/upload', uploadImages.array('files', 6), mediaCtrl.uploadMedia);
apiRouter.delete('/media', mediaCtrl.deleteMedia);

// Incidents (MOD-01, MOD-02, MOD-03, MOD-04, MOD-05)
apiRouter.get('/incidents', optionalAuth, incidentCtrl.listIncidents);
apiRouter.get('/incidents/:id', optionalAuth, incidentCtrl.getIncidentById);
apiRouter.post('/incidents', optionalAuth, incidentCtrl.createIncident);
apiRouter.patch('/incidents/:id', optionalAuth, incidentCtrl.updateIncident);
apiRouter.delete('/incidents/:id', optionalAuth, incidentCtrl.deleteIncident);
apiRouter.post('/incidents/:id/upvote', optionalAuth, incidentCtrl.upvoteIncident);
apiRouter.post('/incidents/:id/rating', optionalAuth, incidentCtrl.rateIncident);
apiRouter.post('/incidents/:id/assign', optionalAuth, incidentCtrl.assignIncident);
apiRouter.post('/incidents/:id/verify', optionalAuth, incidentCtrl.verifyIncident);
apiRouter.post('/incidents/:id/start', optionalAuth, incidentCtrl.startIncident);
apiRouter.post('/incidents/:id/resolve', optionalAuth, incidentCtrl.resolveIncident);
apiRouter.patch('/incidents/:id/workflow/:stepId', optionalAuth, incidentCtrl.toggleWorkflowStep);

// Teams & Members (MOD-04)
apiRouter.get('/teams', teamCtrl.getTeams);
apiRouter.post('/teams/units', teamCtrl.createUnit);
apiRouter.patch('/teams/units/:id', teamCtrl.updateUnit);
apiRouter.delete('/teams/units/:id', teamCtrl.deleteUnit);
apiRouter.post('/teams/members', teamCtrl.createMember);
apiRouter.patch('/teams/members/:id', teamCtrl.updateMember);
apiRouter.delete('/teams/members/:id', teamCtrl.deleteMember);

// Users / Accounts Management (Admin)
apiRouter.get('/users', userCtrl.listUsers);
apiRouter.post('/users', userCtrl.createUser);
apiRouter.patch('/users/:id', userCtrl.updateUser);
apiRouter.delete('/users/:id', userCtrl.deleteUser);

// Stats
apiRouter.get('/stats/summary', statsCtrl.getSummaryStats);
