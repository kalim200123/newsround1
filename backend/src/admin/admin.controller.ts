import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminNotificationDto } from './dto/admin-notification.dto';

@ApiTags('Admin')
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('health')
  @ApiOperation({ summary: 'Admin API 상태 확인' })
  @ApiResponse({
    status: 200,
    description: 'Admin API가 정상적으로 동작하고 있습니다.',
  })
  checkHealth() {
    return { status: 'ok' };
  }

  @Post('login')
  @ApiOperation({ summary: '관리자 로그인' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({ status: 200, description: '로그인 성공, JWT 토큰 반환' })
  @ApiResponse({ status: 401, description: '잘못된 인증 정보' })
  async login(@Body() loginDto: AdminLoginDto) {
    return this.adminService.login(loginDto);
  }

  @Get('stats')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: '관리자 대시보드 통계 조회' })
  @ApiResponse({ status: 200, description: '통계 데이터' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('stats/visitors/weekly')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: '주간 순 방문자 수 통계 조회' })
  @ApiResponse({
    status: 200,
    description: '지난 7일간의 방문자 수 데이터 배열',
  })
  async getWeeklyVisitors() {
    return this.adminService.getWeeklyVisitors();
  }

  @Get('download')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: '첨부파일 다운로드 URL 조회 (관리자용)' })
  @ApiQuery({
    name: 'path',
    required: true,
    description: '다운로드할 파일의 S3 키',
  })
  @ApiResponse({ status: 200, description: '다운로드용 Presigned URL' })
  async getDownloadUrl(@Query('path') path: string) {
    return this.adminService.getDownloadUrl(path);
  }

  @Post('notifications')
  @UseGuards(AdminGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: '관리자 알림 발송' })
  @ApiBody({ type: AdminNotificationDto })
  @ApiResponse({ status: 201, description: '알림 발송 성공' })
  async sendNotification(@Body() dto: AdminNotificationDto) {
    await this.adminService.sendNotification(dto);
    return { message: 'Notification sent successfully.' };
  }
}
