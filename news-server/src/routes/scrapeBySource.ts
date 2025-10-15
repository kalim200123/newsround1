import express, { Request, Response } from "express";
import Parser from "rss-parser";
import { FEEDS } from "../config/feeds";

const router = express.Router();
const parser = new Parser();

/**
 * @swagger
 * /api/scrape-by-source:
 *   get:
 *     summary: 언론사별 RSS 기사 수집
 *     description: 쿼리 파라미터로 전달된 언론사(source)에 해당하는 모든 RSS 피드에서 기사를 실시간으로 수집하여 반환합니다.
 *     tags:
 *       - Scrape
 *     parameters:
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *         required: true
 *         description: "수집할 언론사를 지정합니다. (예: 경향신문, 한겨레, 조선일보)"
 *     responses:
 *       200:
 *         description: 수집된 기사 배열
 *       400:
 *         description: source 파라미터가 누락된 경우입니다.
 *       404:
 *         description: 요청한 언론사에 해당하는 RSS 피드가 설정되어 있지 않습니다.
 */
router.get("/", async (req: Request, res: Response) => {
  const source = req.query.source as string;

  if (!source) {
    return res.status(400).json({ error: "Source query parameter is required" });
  }

  const targetFeeds = FEEDS.filter((feed) => feed.source === source);

  if (targetFeeds.length === 0) {
    return res.status(404).json({ error: `No feeds found for source '${source}'` });
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
        message: `Successfully scraped ${allArticles.length} articles for source '${source}'.`,
        articles: allArticles
    });
  } catch (error) {
    console.error(`Error scraping feeds for source '${source}':`, error);
    res.status(500).json({ error: "Failed to scrape feeds" });
  }
});

export default router;
