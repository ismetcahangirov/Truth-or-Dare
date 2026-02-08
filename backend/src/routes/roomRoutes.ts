import express from 'express';
import roomController from '../controllers/roomController';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware, roomController.createRoom);
router.get('/:code', authMiddleware, roomController.getRoom);

export default router;
