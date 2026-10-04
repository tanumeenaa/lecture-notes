import { Router } from 'express';
import { createSlot, currentLecture, deleteSlot, listSlots } from '../controllers/timetableController.js';

export const timetableRoutes = Router();
timetableRoutes.get('/current', currentLecture);
timetableRoutes.get('/', listSlots);
timetableRoutes.post('/', createSlot);
timetableRoutes.delete('/:id', deleteSlot);