import { Body, Controller, Delete, Get, Param, Post, Put, Request } from '@nestjs/common';
import { NoteService } from './note.service';
import { Note } from './schemas/note.schema';


@Controller('note')
export class NoteController {

    constructor(private noteService: NoteService) { }

    @Get()
    async getNotes(@Request() req) {
        const userId = req.user.userId
        return await this.noteService.getNotes(userId);
    }

    @Post()
    async createNote(@Request() req, @Body() note: Note) {
        const userId = req.user.userId
        return await this.noteService.createNote(userId, note);
    }

    @Put(':id')
    async updateNote(@Param('id') id: string, @Body() note: Note) {
        return await this.noteService.updateNote(id, note);
    }

    @Delete(':id')
    async deleteNote(@Param('id') id: string) {
        return await this.noteService.deleteNote(id);
    }

    @Post(':id/:action')
    async pinNote(@Param('id') id: string, @Param('action') action: string) {
        return await this.noteService.pinNote(id, action);
    }

}

