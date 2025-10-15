import express, { Request, Response } from "express";
import Parser from "rss-parser";
import { FEEDS } from "../config/feeds";

const router = express.Router();
const parser = new Parser();

/**
 * @swagger
 * /api/scrape-by-category:
 *   get:
 *     summary: 카테고리별 RSS 기사 수집
 *     description: 쿼리 파라미터로 전달된 카테고리에 해당하는 모든 RSS 피드에서 기사를 실시간으로 수집하여 반환합니다.
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
 *         description: 수집된 기사 배열
 *       400:
 *         description: category 파라미터가 누락된 경우입니다.
 *       404:
 *         description: 요청한 카테고리에 해당하는 RSS 피드가 설정되어 있지 않습니다.
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
            const dateString = item.isoDate || item.pubDate;
            allArticles.push({ title: item.title, link: item.link, publishedAt: dateString });
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
