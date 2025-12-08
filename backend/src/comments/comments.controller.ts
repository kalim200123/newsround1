import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';
import { CommentsService } from './comments.service';
import {
  CreateCommentDto,
  ReportCommentDto,
  ToggleReactionDto,
  UpdateCommentDto,
} from './dto/comments.dto';

@ApiTags('Comments')
@Controller('api/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('topics/:topicId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '토픽 댓글 조회' })
  @ApiParam({ name: 'topicId', description: '토픽 ID' })
  @ApiResponse({ status: 200, description: '댓글 목록 반환' })
  async getComments(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Req() req: any,
  ) {
    const userId = req.user ? req.user.userId : null;
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return this.commentsService.getComments(topicId, userId, baseUrl);
  }

  @Post('topics/:topicId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: '토픽 댓글 작성' })
  @ApiParam({ name: 'topicId', description: '토픽 ID' })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, description: '댓글 작성 성공' })
  async createComment(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.createComment(
      topicId,
      req.user.userId,
      createCommentDto.content,
      createCommentDto.parentCommentId,
      createCommentDto.userVoteSide,
    );
  }

  @Delete(':commentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: '댓글 삭제' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({ status: 200, description: '댓글 삭제 성공' })
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: any,
  ) {
    return this.commentsService.deleteComment(commentId, req.user.userId);
  }

  @Patch(':commentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: '댓글 수정' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiBody({ type: UpdateCommentDto })
  @ApiResponse({ status: 200, description: '댓글 수정 성공' })
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.updateComment(
      commentId,
      req.user.userId,
      updateCommentDto.content,
    );
  }

  @Post(':commentId/reactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: '댓글 반응(좋아요/싫어요)' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiBody({ type: ToggleReactionDto })
  @ApiResponse({ status: 200, description: '반응 처리 성공' })
  async toggleReaction(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() toggleReactionDto: ToggleReactionDto,
    @Req() req: any,
  ) {
    return this.commentsService.toggleReaction(
      commentId,
      req.user.userId,
      toggleReactionDto.reactionType,
    );
  }

  @Post(':commentId/reports')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({ summary: '댓글 신고' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiBody({ type: ReportCommentDto })
  @ApiResponse({ status: 201, description: '신고 접수 성공' })
  async reportComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() reportCommentDto: ReportCommentDto,
    @Req() req: any,
  ) {
    return this.commentsService.reportComment(
      commentId,
      req.user.userId,
      reportCommentDto.reason,
    );
  }
}
