import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: '사용자 회원가입',
    description: '새로운 사용자를 Newsround1 서비스에 등록합니다.',
  })
  @ApiBody({ type: SignUpDto })
  @ApiResponse({
    status: 201,
    description: '회원가입이 완료되었습니다.',
  })
  @ApiResponse({
    status: 409,
    description: '이미 등록된 이메일, 닉네임 또는 휴대폰번호입니다.',
  })
  @ApiResponse({
    status: 400,
    description: '요청 본문 유효성 검증 실패',
  })
  @ApiResponse({
    status: 500,
    description: '서버 오류가 발생했습니다.',
  })
  async signUp(@Body() signUpDto: SignUpDto): Promise<{ message: string }> {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  @ApiOperation({
    summary: '사용자 로그인',
    description:
      '이메일과 비밀번호를 검증하고 JWT 토큰과 사용자 정보를 반환합니다.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: '로그인 성공, JWT 토큰과 사용자 정보 반환',
  })
  @ApiResponse({
    status: 400,
    description: '요청 본문 유효성 검증 실패',
  })
  @ApiResponse({
    status: 401,
    description: '이메일 또는 비밀번호가 올바르지 않거나 사용 불가 계정',
  })
  @ApiResponse({
    status: 500,
    description: '서버 오류가 발생했습니다.',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<{
    token: string;
    user: {
      id: number;
      name: string;
      email: string;
      nickname: string;
      profile_image_url: string | null;
    };
  }> {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.authService.login(loginDto, baseUrl);
  }
}
