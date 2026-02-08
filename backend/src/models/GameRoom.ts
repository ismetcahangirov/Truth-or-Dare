import mongoose, { Schema, Document } from 'mongoose';

export interface IGameRoom extends Document {
    code: string;
    hostId: mongoose.Schema.Types.ObjectId;
    players: { userId: mongoose.Schema.Types.ObjectId; socketId?: string; name: string; avatar?: string }[];
    status: 'WAITING' | 'PLAYING' | 'FINISHED';
    settings: {
        maxPlayers: number;
        turnDuration: number;
    };
    currentTurn?: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
}

const GameRoomSchema: Schema = new Schema({
    code: { type: String, required: true, unique: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    players: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        socketId: { type: String },
        name: { type: String },
        avatar: { type: String }
    }],
    status: { type: String, enum: ['WAITING', 'PLAYING', 'FINISHED'], default: 'WAITING' },
    settings: {
        maxPlayers: { type: Number, default: 8 },
        turnDuration: { type: Number, default: 60 }
    },
    currentTurn: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model<IGameRoom>('GameRoom', GameRoomSchema);
