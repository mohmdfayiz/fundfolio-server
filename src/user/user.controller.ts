import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/user.dto';

@Controller('user')
export class UserController {

    constructor(private userService: UserService) { }

    @Get(':id')
    async getUsers(@Param('id') id: string) {
        return await this.userService.get(id);
    }

    @Patch(':id')
    async updateUser(@Param('id') id: string, @Body() user: User) {
        return await this.userService.update(id, user);
    }

    @Delete(':id')
    async deleteUser(@Param('id') id: string) {
        return await this.userService.delete(id);
    }
}
