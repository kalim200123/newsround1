import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../admin.guard';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { AdminUsersService } from './admin-users.service';

@ApiTags('Admin Users')
@Controller('api/admin/users')
@UseGuards(AdminGuard)
@ApiBearerAuth('bearerAuth')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: '사용자 목록 조회 (검색 및 페이징)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '이메일 또는 닉네임 검색',
  })
  @ApiResponse({ status: 200, description: '사용자 목록' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.adminUsersService.findAll(Number(page), Number(limit), search);
  }

  @Get(':userId')
  @ApiOperation({ summary: '사용자 상세 정보 조회' })
  @ApiResponse({ status: 200, description: '사용자 상세 정보' })
  async findOne(@Param('userId') userId: number) {
    return this.adminUsersService.findOne(userId);
  }

  @Patch(':userId')
  @ApiOperation({ summary: '사용자 상태 및 경고 횟수 수정' })
  @ApiResponse({ status: 200, description: '수정 성공' })
  async updateStatus(
    @Param('userId') userId: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminUsersService.updateStatus(userId, dto);
  }

  @Get(':userId/comments')
  @ApiOperation({ summary: '사용자가 작성한 댓글 목록 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: '댓글 목록' })
  async getComments(
    @Param('userId') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminUsersService.getComments(
      userId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':userId/chats')
  @ApiOperation({ summary: '사용자가 작성한 채팅 목록 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: '채팅 목록' })
  async getChats(
    @Param('userId') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminUsersService.getChats(
      userId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':userId/votes')
  @ApiOperation({ summary: '사용자가 참여한 투표 목록 조회' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: '투표 목록' })
  async getVotes(
    @Param('userId') userId: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.adminUsersService.getVotes(
      userId,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }
}
