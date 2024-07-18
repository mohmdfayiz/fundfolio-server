import { Body, Controller, HttpCode, HttpStatus, Post, Request, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { Public } from 'src/common/constants';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('signin')
    signIn(@Body() signinDto: SigninDto) {
        return this.authService.signIn(signinDto.email, signinDto.password);
    }

    @Public()
    @Post('signup')
    signUp(@Body() signupDto: SignupDto) {
        return this.authService.signUp(signupDto.username, signupDto.email);
    }

    @HttpCode(HttpStatus.OK)
    @Post('password')
    setPassword(@Request() req, @Body() { password }: { password: string }) {
        const userId = req.user.userId;
        return this.authService.setPassword(userId, password);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('refresh-token')
    refreshToken(@Body('refreshToken') refreshToken: string) {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token is required');
        }
        return this.authService.refreshToken(refreshToken);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    logout(@Body('refreshToken') refreshToken: string, @Body('allDevices') allDevices: boolean) {
        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token is required');
        }
        return this.authService.logout(refreshToken, allDevices);
    }
}
