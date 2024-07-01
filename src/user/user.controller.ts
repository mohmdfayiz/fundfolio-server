import { Body, Controller, Delete, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { UserService } from './user.service';


@Controller('user')
export class UserController {

    constructor(private userService: UserService) { }

    @Get()
    async getUsers(@Req() req) {
        const id = req.user.userId
        return await this.userService.get(id);
    }

    @Patch()
    async updateUser(@Req() req, @Body() user: User) {
        const id = req.user.userId
        return await this.userService.update(id, user);
    }

    @Delete()
    async deleteUser(@Req() req) {
        const id = req.user.userId
        return await this.userService.delete(id);
    }
}
