import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsPhoneNumber,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({
    description: '사용자 이메일 주소',
    example: 'test@example.com',
  })
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호 (8자 이상)',
    example: 'password123',
  })
  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  password: string;

  @ApiProperty({ description: '사용자 이름', example: '홍길동' })
  @IsString()
  name: string;

  @ApiProperty({ description: '사용자 닉네임', example: '길동이' })
  @IsString()
  nickname: string;

  @ApiProperty({
    description: '대한민국 휴대폰 번호 (선택 사항)',
    example: '010-1234-5678',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('KR', {
    message: '유효한 대한민국 휴대폰 번호를 입력해주세요.',
  })
  phone?: string;
}