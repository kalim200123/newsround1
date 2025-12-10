export const dynamic = "force-dynamic";
import { getBreakingNews, getExclusiveNews } from "@/lib/api/articles";
import { getTrendingKeywords } from "@/lib/api/keywords";
import { getLatestTopics, getPopularTopics, getTopicDetail } from "@/lib/api/topics";
import { Article } from "@/lib/types/article";
import { Topic, TrendingKeyword } from "@/lib/types/topic";
import MainGrid from "./components/MainGrid";

export default async function Home() {
  const [topicDetail, popularTopics, latestTopics, trendingKeywords, breakingNews, exclusiveNews] = await Promise.all([
    getTopicDetail("1").catch((err) => {
      console.error("메인 페이지 토픽 로드 실패:", err);
      return null;
    }),
    getPopularTopics().catch((err) => {
      console.error("인기 토픽 로드 실패:", err);
      return [];
    }),
    getLatestTopics().catch((err) => {
      console.error("최신 토픽 로드 실패:", err);
      return [];
    }),
    getTrendingKeywords().catch((err) => {
      console.error("인기 키워드 로드 실패:", err);
      return [];
    }),
    getBreakingNews().catch((err) => {
      console.error("속보 로드 실패:", err);
      return [];
    }),
    getExclusiveNews().catch((err) => {
      console.error("단독 뉴스 로드 실패:", err);
      return [];
    }),
  ]);

  return (
    <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-12">
        <MainGrid
          mainTopic={topicDetail?.topic}
          popularTopics={popularTopics as Topic[]}
          latestTopics={latestTopics as Topic[]}
          trendingKeywords={trendingKeywords as TrendingKeyword[]}
          breakingNews={breakingNews as Article[]}
          exclusiveNews={exclusiveNews as Article[]}
        />
      </div>
    </main>
  );
}
