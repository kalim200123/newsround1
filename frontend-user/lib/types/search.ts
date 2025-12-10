import { Article } from './article';
import { Topic } from './topic';

export interface SearchResult {
  articles: Article[];
  relatedTopics: Topic[];
}
