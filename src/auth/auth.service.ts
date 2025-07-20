import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Token } from './schemas/token.schema';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import mongoose, { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(Token.name)
        private tokenModel: mongoose.Model<Token>,
        private userService: UserService,
        private jwtService: JwtService,
        private configService: ConfigService
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

        // Generate JWTs
        const accessToken = await this.generateAccessToken(user._id.toString(), user.email);
        const refreshToken = await this.generateRefreshToken(user._id.toString(), user.email);

        // Save refresh token
        await this.tokenModel.create({ userId: user._id, refreshToken });

        return {
            user: { _id: user._id, email: user.email, username: user.username, profilePic: user.profilePic, currency: user?.currency },
            accessToken,
            refreshToken,
        };
    }

    async signUp(username: string, email: string) {

        const user = await this.userService.register({ username, email });

        const accessToken = await this.generateAccessToken(user._id.toString(), user.email);
        const refreshToken = await this.generateRefreshToken(user._id.toString(), user.email);

        await this.tokenModel.create({ userId: user._id, refreshToken });

        return {
            user: { _id: user._id, email: user.email, username: user.username },
            accessToken,
            refreshToken,
        }
    }

    async setPassword(id: string, password: string) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.userService.update(id, { password: hashedPassword });
    }

    async refreshToken(refreshToken: string) {

        try {
            // Verify the refresh token
            const payload: { userId: string; email: string } = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
            });

            // Check if the refresh token exists
            const token = await this.tokenModel.findOne({ userId: new Types.ObjectId(payload.userId), refreshToken });
            if (!token) {
                throw new UnauthorizedException('Refresh token not found');
            }

            // Generate new access token
            const newAccessToken = await this.generateAccessToken(payload.userId, payload.email);
            const newRefreshToken = await this.generateRefreshToken(payload.userId, payload.email);

            // Update the refresh token
            token.refreshToken = newRefreshToken;
            await token.save();

            return {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    async logout(refreshToken: string, allDevices: boolean) {

        if (allDevices) {
            try {
                // Verify the refresh token
                const payload: { userId: string; email: string } = await this.jwtService.verifyAsync(refreshToken, {
                    secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
                });
                await this.tokenModel.deleteMany({ userId: new Types.ObjectId(payload.userId) });
            } catch (error) {
                await this.tokenModel.deleteOne({ refreshToken });
            }
        } else {
            await this.tokenModel.deleteOne({ refreshToken });
        }

        return { message: 'Logout successful' };
    }

    private async generateAccessToken(userId: string, email: string): Promise<string> {
        return this.jwtService.signAsync(
            { userId, email },
            {
                secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                expiresIn: this.configService.get<string | number>('JWT_ACCESS_TOKEN_EXPIRES_IN')
            }
        );
    }

    private async generateRefreshToken(userId: string, email: string): Promise<string> {
        return this.jwtService.signAsync(
            { userId, email },
            {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
                expiresIn: this.configService.get<string | number>('JWT_REFRESH_TOKEN_EXPIRES_IN')
            }
        );
    }
}
