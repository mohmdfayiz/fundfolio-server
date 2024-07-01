import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService
    ) { }

    async signIn(email: string, password: string) {
        const user = await this.userService.getLoginUser(email);

        if (!user) {
            throw new UnauthorizedException('Incorrect email or password');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Incorrect email or password');
        }

        return {
            user: { _id: user._id, email: user.email, username: user.username },
            token: await this.jwtService.signAsync({ userId: user._id, email: user.email })
        };
    }

    async signUp(username: string, email: string) {
        const user = await this.userService.register({ username, email });
        return {
            user: { _id: user._id, email: user.email, username: user.username },
            token: await this.jwtService.signAsync({ userId: user._id, email: user.email })
        }
    }

    async setPassword(id: string, password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.userService.update(id, { password: hashedPassword });
    }
}
