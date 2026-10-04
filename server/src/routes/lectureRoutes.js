import { Router } from 'express';
import { createLecture, exportLecture, getLecture, getLectureMedia, getLectureStatus, retryLecture, updateLectureNotes } from '../controllers/lectureController.js';
import { upload } from '../middleware/upload.js';

export const lectureRoutes = Router();
lectureRoutes.post('/', upload, createLecture);
lectureRoutes.get('/:id/status', getLectureStatus);
lectureRoutes.post('/:id/retry', retryLecture);
lectureRoutes.get('/:id/media/:fileId', getLectureMedia);
lectureRoutes.patch('/:id/notes', updateLectureNotes);
lectureRoutes.get('/:id/export', exportLecture);
lectureRoutes.get('/:id', getLecture);