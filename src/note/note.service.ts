import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import { Note } from './schemas/note.schema';

@Injectable()
export class NoteService {

    constructor(
        @InjectModel(Note.name)
        private noteModel: mongoose.Model<Note>
    ) { }

    async getNotes(userId: string) {
        return await this.noteModel.aggregate([
            { $match: { userId: new Types.ObjectId(userId) } },
            // { $sort: { createdAt: -1 } },
            { $sort: { pinned: -1 } },
        ])
    }

    async createNote(userId: string, note: Note) {
        return await this.noteModel.create({ userId: new Types.ObjectId(userId), ...note });
    }

    async updateNote(id: string, note: Note) {
        return await this.noteModel.findByIdAndUpdate(id, {
            $set: {
                userId: new Types.ObjectId(note.userId),
                title: note.title,
                content: note.content,
                pinned: note.pinned,
            }
        }, { new: true });
    }

    async deleteNote(id: string) {
        return await this.noteModel.findByIdAndDelete(id);
    }

    async pinNote(id: string, action: string) {
        const value = action === 'pin' ? true : false;
        return await this.noteModel.findByIdAndUpdate(id, {
            $set: {
                pinned: value
            }
        }, { new: true });
    }

    async deleteAllNotes(userId: string) {
        return await this.noteModel.deleteMany({ userId: new Types.ObjectId(userId) });
    }
}
