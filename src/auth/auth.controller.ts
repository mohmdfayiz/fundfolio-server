import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @HttpCode(HttpStatus.OK)
    @Post('signin')
    signIn(@Body() signinDto: SigninDto) {
        return this.authService.signIn(signinDto.email, signinDto.password);
    }

    @HttpCode(HttpStatus.CREATED)
    @Post('signup')
    signUp(@Body() signupDto: SignupDto) {
        return this.authService.signUp(signupDto.username, signupDto.email);
    }

    @UseGuards(AuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('password')
    setPassword(@Request() req, @Body() { password }: { password: string }) {
        const userId = req.user.userId;
        return this.authService.setPassword(userId, password);
    }
}
