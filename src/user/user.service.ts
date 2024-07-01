import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose from 'mongoose';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {

    constructor(
        @InjectModel(User.name)
        private userModel: mongoose.Model<User>
    ) { }

    async get(id: string): Promise<User> {
        const user = await this.userModel.findById(id);
        if (!user) { throw new NotFoundException('User not found') }
        return user;
    }

    async getLoginUser(email: string): Promise<User> {
        return await this.userModel.findOne({ email }).select('+password');
    }

    async register(user: CreateUserDto): Promise<User> {
        return await this.userModel.create(user);
    }

    async update(id: string, user: UpdateUserDto): Promise<User> {
        return await this.userModel.findByIdAndUpdate(id, { $set: user }, { new: true });
    }

    async delete(id: string): Promise<User> {
        return await this.userModel.findByIdAndDelete(id);
    }

}
