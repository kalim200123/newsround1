import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum TopicType {
  VOTING = 'VOTING',
  DEFAULT = 'DEFAULT',
}

export class CreateTopicDto {
  @ApiProperty({ description: '토픽 제목', example: '2024 총선' })
  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @ApiProperty({
    description: '검색/임베딩 키워드 (콤마로 구분)',
    example: '총선,국회의원,선거',
  })
  @IsString()
  @IsNotEmpty()
  searchKeywords!: string;

  @ApiPropertyOptional({
    description: '토픽 요약',
    example: '제22대 국회의원 선거에 대한 요약입니다.',
  })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ description: 'LEFT 입장', example: '여당 승리 필요' })
  @IsString()
  @IsOptional()
  stanceLeft?: string;

  @ApiPropertyOptional({ description: 'RIGHT 입장', example: '야당 견제 필요' })
  @IsString()
  @IsOptional()
  stanceRight?: string;

  @ApiPropertyOptional({
    description: '토픽 유형',
    enum: TopicType,
    default: TopicType.VOTING,
  })
  @IsEnum(TopicType)
  @IsOptional()
  topicType?: TopicType;
}
