import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { AdminTopicsService } from './admin-topics.service';
import { CollectLatestDto } from './dto/collect-latest.dto';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateArticleOrderDto } from './dto/update-article-order.dto';
import { UpdateTopicStatusDto } from './dto/update-topic-status.dto';

@ApiTags('Admin Topics')
@Controller('api/admin/topics')
@UseGuards(AdminGuard)
@ApiBearerAuth('bearerAuth')
export class AdminTopicsController {
  constructor(private readonly adminTopicsService: AdminTopicsService) {}

  @Get()
  @ApiOperation({ summary: '토픽 목록 조회 (검색, 상태 필터, 페이징)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiQuery({
    name: 'status',
    required: false,
    description: '토픽 상태 (ALL, PUBLISHED, etc.)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: '제목 또는 키워드 검색',
  })
  @ApiResponse({ status: 200, description: '토픽 목록' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminTopicsService.findAll(
      Number(page),
      Number(limit),
      status,
      search,
    );
  }

  @Post()
  @ApiOperation({ summary: '새 토픽 생성 및 수집 시작' })
  @ApiResponse({ status: 201, description: '토픽 생성 성공' })
  async create(@Body() dto: CreateTopicDto) {
    return this.adminTopicsService.create(dto);
  }

  @Get('published')
  @ApiOperation({ summary: '발행된 토픽 목록 조회 (간소화)' })
  @ApiResponse({ status: 200, description: '발행된 토픽 목록' })
  async findPublished() {
    return this.adminTopicsService.findAll(1, 100, 'OPEN');
  }

  @Get('sidebar')
  @ApiOperation({ summary: '사이드바용 토픽 목록 조회' })
  @ApiResponse({ status: 200, description: '사이드바 토픽 목록' })
  async findSidebar() {
    return this.adminTopicsService.findAll(1, 50, 'OPEN');
  }

  @Get('suggested')
  @ApiOperation({ summary: '추천 토픽 목록 조회 (현재 미사용)' })
  @ApiResponse({ status: 200, description: '빈 배열' })
  async findSuggested() {
    return [];
  }

  @Get(':topicId')
  @ApiOperation({ summary: '토픽 상세 정보 조회' })
  @ApiResponse({ status: 200, description: '토픽 상세 정보' })
  async findOne(@Param('topicId') topicId: number) {
    const topic = await this.adminTopicsService.findOne(topicId);
    return { topic };
  }

  @Patch(':topicId/status')
  @ApiOperation({ summary: '토픽 상태 변경' })
  @ApiResponse({ status: 200, description: '상태 변경 성공' })
  async updateStatus(
    @Param('topicId') topicId: number,
    @Body() dto: UpdateTopicStatusDto,
  ) {
    return this.adminTopicsService.updateStatus(topicId, dto);
  }

  @Post(':topicId/recollect')
  @ApiOperation({ summary: '토픽 기사 재수집 트리거' })
  @ApiResponse({ status: 201, description: '재수집 시작됨' })
  async recollect(@Param('topicId') topicId: number) {
    return this.adminTopicsService.recollect(topicId);
  }

  @Post(':topicId/collect-ai')
  @ApiOperation({ summary: 'AI 기반 기사 수집 트리거' })
  @ApiResponse({ status: 201, description: 'AI 수집 시작됨' })
  async collectAi(@Param('topicId') topicId: number) {
    return this.adminTopicsService.collectAi(topicId);
  }

  @Post(':topicId/collect-latest')
  @ApiOperation({ summary: '최신 기사 수집 (키워드 기반)' })
  @ApiResponse({ status: 201, description: '수집 결과' })
  async collectLatest(
    @Param('topicId') topicId: number,
    @Body() dto: CollectLatestDto,
  ) {
    return this.adminTopicsService.collectLatest(topicId, dto);
  }

  @Post(':topicId/unpublish-all-articles')
  @ApiOperation({ summary: '토픽 내 모든 기사 발행 취소' })
  @ApiResponse({ status: 201, description: '성공 메시지' })
  async unpublishAllArticles(@Param('topicId') topicId: number) {
    return this.adminTopicsService.unpublishAllArticles(topicId);
  }

  @Post(':topicId/delete-all-suggested')
  @ApiOperation({ summary: '토픽 내 모든 추천 기사 삭제' })
  @ApiResponse({ status: 201, description: '성공 메시지' })
  async deleteAllSuggested(@Param('topicId') topicId: number) {
    return this.adminTopicsService.deleteAllSuggested(topicId);
  }

  @Get(':topicId/articles')
  @ApiOperation({ summary: '토픽 내 기사 목록 조회' })
  @ApiResponse({ status: 200, description: '기사 목록' })
  async getArticles(@Param('topicId') topicId: number) {
    return this.adminTopicsService.getArticles(topicId);
  }

  @Patch(':topicId/articles/order')
  @ApiOperation({ summary: '토픽 내 기사 순서 변경' })
  @ApiResponse({ status: 200, description: '순서 변경 성공' })
  async updateArticleOrder(
    @Param('topicId') topicId: number,
    @Body() dto: UpdateArticleOrderDto,
  ) {
    return this.adminTopicsService.updateArticleOrder(topicId, dto);
  }

  @Get(':topicId/votes')
  @ApiOperation({ summary: '토픽 투표 현황 조회' })
  @ApiResponse({ status: 200, description: '투표 현황 (통계 및 투표자 목록)' })
  async getVoteStatistics(@Param('topicId') topicId: number) {
    return this.adminTopicsService.getVoteStatistics(topicId);
  }
}
