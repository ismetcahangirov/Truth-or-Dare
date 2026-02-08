import { Request, Response } from 'express';
import GameRoom from '../models/GameRoom';
import { generateRoomCode } from '../utils/helpers';

const createRoom = async (req: Request, res: Response) => {
    try {
        const hostId = (req as any).user.id;
        let code = generateRoomCode();

        // Ensure uniqueness
        let existingRoom = await GameRoom.findOne({ code });
        while (existingRoom) {
            code = generateRoomCode();
            existingRoom = await GameRoom.findOne({ code });
        }

        const newRoom = new GameRoom({
            code,
            hostId,
            players: [], // Host joins via socket usually, or here
            status: 'WAITING'
        });

        await newRoom.save();
        res.status(201).json(newRoom);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRoom = async (req: Request, res: Response) => {
    try {
        const { code } = req.params;
        const room = await GameRoom.findOne({ code }).populate('hostId', 'username avatar');
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }
        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export default { createRoom, getRoom };
