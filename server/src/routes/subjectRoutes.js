import { Router } from 'express';
import { createSubject, deleteSubject, getNotebook, getSubjectContinuity, listSubjects, searchNotes, updateSubject } from '../controllers/subjectController.js';

export const subjectRoutes = Router();
subjectRoutes.get('/', listSubjects);
subjectRoutes.get('/search', searchNotes);
subjectRoutes.post('/', createSubject);
subjectRoutes.get('/:id/notebook', getNotebook);
subjectRoutes.get('/:id/continuity', getSubjectContinuity);
subjectRoutes.patch('/:id', updateSubject);
subjectRoutes.delete('/:id', deleteSubject);