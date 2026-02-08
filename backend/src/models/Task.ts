import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
    type: 'TRUTH' | 'DARE';
    content: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    category?: string;
}

const TaskSchema: Schema = new Schema({
    type: { type: String, enum: ['TRUTH', 'DARE'], required: true },
    content: { type: String, required: true },
    difficulty: { type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
    category: { type: String, default: 'General' }
});

export default mongoose.model<ITask>('Task', TaskSchema);
