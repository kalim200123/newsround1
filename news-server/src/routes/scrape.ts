import express, { Request, Response } from "express";
import Parser from "rss-parser";
import { FEEDS } from "../config/feeds";

const router = express.Router();
const parser = new Parser();

/**
 * @swagger
 * /api/scrape:
 *   get:
 *     summary: 카테고리별 RSS 기사 제목 수집
 *     description: 쿼리 파라미터로 전달된 카테고리(정치, 경제, 사회, 문화 등)에 매핑된 모든 RSS 피드에서 기사 제목만 모아서 반환합니다.
 *     tags:
 *       - Scrape
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         required: true
 *         description: "수집할 카테고리를 지정합니다. (예: 정치, 경제, 사회, 문화)"
 *     responses:
 *       200:
 *         description: 설정된 모든 피드에서 수집한 기사 제목 배열입니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 경제 카테고리에서 50개의 기사 제목을 수집했습니다.
 *                 titles:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["[정치] 여야, 국회에서 공방 이어가", "[경제] 원·달러 환율 1400원 돌파"]
 *       400:
 *         description: category 파라미터가 누락된 경우입니다.
 *       404:
 *         description: 요청한 카테고리에 해당하는 RSS 피드가 설정되어 있지 않습니다.
 *       500:
 *         description: RSS 수집 중 서버 내부 오류가 발생했습니다.
 */
router.get("/", async (req: Request, res: Response) => {
  const category = req.query.category as string;

  if (!category) {
    return res.status(400).json({ error: "Category query parameter is required" });
  }

  const targetFeeds = FEEDS.filter((feed) => feed.section === category);

  if (targetFeeds.length === 0) {
    return res.status(404).json({ error: `No feeds found for category '${category}'` });
  }

  try {
    const allArticles: { title: string; link: string; publishedAt: string | undefined }[] = [];
    const promises = targetFeeds.map(feed => parser.parseURL(feed.url));
    const results = await Promise.allSettled(promises);

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        result.value.items.forEach(item => {
          if (item.title && item.link) {
            allArticles.push({ title: item.title, link: item.link, publishedAt: item.pubDate });
          }
        });
      }
    });

    res.json({
        message: `Successfully scraped ${allArticles.length} articles for category '${category}'.`,
        articles: allArticles
    });
  } catch (error) {
    console.error(`Error scraping feeds for category '${category}':`, error);
    res.status(500).json({ error: "Failed to scrape feeds" });
  }
});

export default router;
