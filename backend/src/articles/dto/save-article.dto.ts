import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class SaveArticleDto {
  @ApiProperty({
    description:
      "기사 타입. 'home'은 tn_home_article의 기사를, 'topic'은 tn_article의 기사를 의미합니다.",
    enum: ['home', 'topic'],
    example: 'home',
  })
  @IsNotEmpty()
  @IsEnum(['home', 'topic'], {
    message: "articleType must be either 'home' or 'topic'.",
  })
  articleType: 'home' | 'topic';
}
