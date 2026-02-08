import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    passwordHash: string;
    avatar?: string;
    stats: {
        gamesPlayed: number;
        tasksCompleted: number;
        tasksFailed: number;
    };
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String },
    stats: {
        gamesPlayed: { type: Number, default: 0 },
        tasksCompleted: { type: Number, default: 0 },
        tasksFailed: { type: Number, default: 0 },
    },
}, { timestamps: true });

export default mongoose.model<IUser>('User', UserSchema);
