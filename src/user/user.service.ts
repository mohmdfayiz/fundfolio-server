import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {

    private readonly users = [
        {
            id: 1,
            username: 'john',
            email: '7bI8d@example.com',
        },
        {
            id: 2,
            username: 'chris',
            email: '6KXUZ@example.com',
        },
        {
            id: 3,
            username: 'maria',
            email: 'JpjQZ@example.com',
        },
    ];

    getUserData(id: string) {
        const user = this.users.find(user => user.id === parseInt(id));

        if(!user) {
            return {
                success: false,
                message: 'User not found'
            }
        }

        return {
            success: true,
            data: user
        };
    }

    createUser(userData: CreateUserDto) {
        const user = { id: this.users.length + 1, ...userData }
        this.users.push(user);

        return {
            success: true,
            message: 'User created successfully',
            data: user
        }
    }
}
