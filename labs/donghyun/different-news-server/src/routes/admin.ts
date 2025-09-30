import { exec } from "child_process";
import { Request, Response, Router } from "express";
import path from "path";
import pool from "../config/db";
import { authenticateAdmin, handleAdminLogin } from "../middleware/auth";

const router = Router();

// Admin API 상태 확인
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

router.post("/login", handleAdminLogin);

router.use(authenticateAdmin);

// [추가] '제안됨' 상태의 토픽 후보 목록 조회 API
router.get("/topics/suggested", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT * FROM topics WHERE status = 'suggested' ORDER BY created_at DESC");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching suggested topics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// [신규] '발행됨' 상태의 모든 토픽 목록 조회 API
router.get("/topics/published", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, display_name, published_at FROM topics WHERE status = 'published' ORDER BY published_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching published topics:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// [신규] 관리자가 직접 새 토픽을 생성하고 발행
router.post("/topics", async (req: Request, res: Response) => {
  const { displayName, searchKeywords, summary } = req.body;

  if (!displayName || !searchKeywords) {
    return res.status(400).json({ message: "Display name and search keywords are required." });
  }

  try {
    // 1. 새 토픽을 DB에 삽입
    const [result]: any = await pool.query(
      "INSERT INTO topics (core_keyword, sub_description, display_name, search_keywords, summary, status, collection_status, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'pending', NOW())",
      [displayName, "관리자 직접 생성", displayName, searchKeywords, summary || ""]
    );
    const newTopicId = result.insertId;

    if (!newTopicId) {
      throw new Error("Failed to create new topic, no insertId returned.");
    }

    // 2. 파이썬 스크립트를 호출하여 기사 수집 시작
    const pythonScriptPath = path.join(__dirname, "../../../different-news-data/article_collector.py");
    const command = `python "${pythonScriptPath}" ${newTopicId}`;

    console.log(`Executing command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing article_collector.py: ${error}`);
        return;
      }
      console.log(`article_collector.py stdout: ${stdout}`);
      console.error(`article_collector.py stderr: ${stderr}`);
    });

    res
      .status(201)
      .json({ message: `Topic ${newTopicId} has been created and published. Article collection started.` });
  } catch (error) {
    console.error("Error creating new topic:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 특정 토픽의 상태를 'published'로 변경 (발행)
router.patch("/topics/:topicId/publish", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  // [수정] thumbnailUrl을 요청 본문에서 받지 않습니다.
  const { displayName, searchKeywords, summary } = req.body;

  if (!displayName || !searchKeywords) {
    return res.status(400).json({ message: "Display name and search keywords are required." });
  }

  try {
    const [result]: any = await pool.query(
      // [수정] SQL UPDATE문에서 thumbnail_url 부분을 제거합니다.
      "UPDATE topics SET status = 'published', collection_status = 'pending', display_name = ?, search_keywords = ?, summary = ?, published_at = NOW() WHERE id = ? AND status = 'suggested'",
      [displayName, searchKeywords, summary, topicId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Topic not found or already handled." });
    }

    const pythonScriptPath = path.join(__dirname, "../../../different-news-data/article_collector.py");
    const command = `python "${pythonScriptPath}" ${topicId}`;

    console.log(`Executing command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing article_collector.py: ${error}`);
        return;
      }
      console.log(`article_collector.py stdout: ${stdout}`);
      console.error(`article_collector.py stderr: ${stderr}`);
    });

    res.json({ message: `Topic ${topicId} has been published. Article collection started in the background.` });
  } catch (error) {
    console.error("Error publishing topic:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 특정 토픽의 상태를 'rejected'로 변경 (거절)
router.patch("/topics/:topicId/reject", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const [result]: any = await pool.query(
      "UPDATE topics SET status = 'rejected' WHERE id = ? AND status = 'suggested'",
      [topicId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Topic not found or already handled." });
    }

    res.json({ message: `Topic ${topicId} has been rejected.` });
  } catch (error) {
    console.error("Error rejecting topic:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// [신규] 특정 토픽을 '보관' 상태로 변경 (소프트 삭제)
router.patch("/topics/:topicId/archive", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  try {
    const [result]: any = await pool.query(
      "UPDATE topics SET status = 'archived' WHERE id = ? AND status = 'published'",
      [topicId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Topic not found or not published." });
    }

    res.json({ message: `Topic ${topicId} has been archived.` });
  } catch (error) {
    console.error("Error archiving topic:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 특정 토픽에 속한 '제안된' 기사 목록 조회
router.get("/topics/:topicId/articles", async (req: Request, res: Response) => {
  const { topicId } = req.params;

  const numericTopicId = parseInt(topicId, 10);
  if (isNaN(numericTopicId)) {
    return res.status(400).json({ message: "Invalid topic ID." });
  }

  try {
    const [articles] = await pool.query("SELECT * FROM articles WHERE topic_id = ? ORDER BY `display_order` ASC", [
      numericTopicId,
    ]);
    res.json(articles);
  } catch (error) {
    console.error("Error fetching suggested articles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/topics/:topicId/articles/order", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const { left, right } = req.body;

  const numericTopicId = parseInt(topicId, 10);
  if (isNaN(numericTopicId)) {
    return res.status(400).json({ message: "Invalid topic ID." });
  }

  if (!Array.isArray(left) || !Array.isArray(right)) {
    return res.status(400).json({ message: "Invalid request body. 'left' and 'right' arrays are required." });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // [수정] Promise.all 대신 순차적으로 실행
    for (let i = 0; i < left.length; i++) {
      const articleId = left[i];
      const displayOrder = i;
      await connection.query("UPDATE articles SET display_order = ? WHERE id = ? AND topic_id = ?", [
        displayOrder,
        articleId,
        numericTopicId,
      ]);
    }

    for (let i = 0; i < right.length; i++) {
      const articleId = right[i];
      const displayOrder = i;
      await connection.query("UPDATE articles SET display_order = ? WHERE id = ? AND topic_id = ?", [
        displayOrder,
        articleId,
        numericTopicId,
      ]);
    }

    await connection.commit();
    connection.release();

    res.json({ message: "Article order updated successfully." });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Error updating article order:", error);
    res.status(500).json({ message: "Server error while updating article order." });
  }
});

router.patch("/articles/:articleId/feature", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  try {
    const connection = await pool.getConnection();
    await connection.beginTransaction(); // 트랜잭션 시작

    // 1. 이 기사가 속한 토픽 ID와 진영(side)을 찾습니다.
    const [rows]: any = await connection.query("SELECT topic_id, side FROM articles WHERE id = ?", [articleId]);
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Article not found." });
    }
    const { topic_id, side } = rows[0];

    // 2. 해당 토픽의 같은 진영에 있는 다른 모든 기사를 '대표 아님'으로 설정합니다.
    await connection.query("UPDATE articles SET is_featured = FALSE WHERE topic_id = ? AND side = ?", [topic_id, side]);

    // 3. 선택한 기사만 '대표'로 설정합니다.
    await connection.query("UPDATE articles SET is_featured = TRUE WHERE id = ?", [articleId]);

    await connection.commit(); // 모든 쿼리 성공 시 최종 반영
    connection.release();
    res.json({ message: `Article ${articleId} has been set as featured.` });
  } catch (error) {
    console.error("Error featuring article:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.patch("/articles/:articleId/delete", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  try {
    const [result]: any = await pool.query("UPDATE articles SET status = 'deleted' WHERE id = ?", [articleId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found." });
    }
    res.json({ message: `Article ${articleId} has been deleted.` });
  } catch (error) {
    console.error("Error deleting article:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 특정 기사의 상태를 'published'로 변경 (발행)
router.patch("/articles/:articleId/publish", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  const { publishedAt } = req.body as { publishedAt?: string };

  let normalizedPublishedAt: string | null = null;
  if (typeof publishedAt === "string") {
    const trimmed = publishedAt.trim();
    if (trimmed) {
      const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})(?::(\d{2}))?$/);
      if (!match) {
        return res.status(400).json({ message: "Invalid publishedAt format. Use YYYY-MM-DD HH:mm" });
      }
      const seconds = match[3] ? `:${match[3]}` : ":00";
      normalizedPublishedAt = `${match[1]} ${match[2]}${seconds}`;
    }
  } else if (publishedAt !== undefined) {
    return res.status(400).json({ message: "publishedAt must be a string when provided." });
  }

  try {
    const updateFields: string[] = ["status = 'published'"];
    const params: Array<string | number> = [];

    if (normalizedPublishedAt) {
      updateFields.push("published_at = ?");
      params.push(normalizedPublishedAt);
    }

    params.push(articleId);

    const sql = `UPDATE articles SET ${updateFields.join(", ")} WHERE id = ?`;
    const [result]: any = await pool.query(sql, params);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found." });
    }
    res.json({ message: `Article ${articleId} has been published.` });
  } catch (error) {
    console.error("Error publishing article:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 특정 기사의 상태를 'suggested'로 변경 (발행 취소)
router.patch("/articles/:articleId/unpublish", async (req: Request, res: Response) => {
  const { articleId } = req.params;
  try {
    const [result]: any = await pool.query(
      "UPDATE articles SET status = 'suggested' WHERE id = ? AND status = 'published'",
      [articleId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Article not found or not published." });
    }
    res.json({ message: `Article ${articleId} has been unpublished.` });
  } catch (error) {
    console.error("Error unpublishing article:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/topics/:topicId/recollect", async (req: Request, res: Response) => {
  const { topicId } = req.params;
  const payload = req.body as { searchKeywords?: string };
  const normalizedKeywords = typeof payload?.searchKeywords === "string" ? payload.searchKeywords.trim() : undefined;

  try {
    const [rows]: any = await pool.query("SELECT id FROM topics WHERE id = ? AND status = 'published'", [topicId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Published topic not found." });
    }

    if (normalizedKeywords) {
      await pool.query(
        "UPDATE topics SET collection_status = 'pending', search_keywords = ?, updated_at = NOW() WHERE id = ?",
        [normalizedKeywords, topicId]
      );
    } else {
      await pool.query("UPDATE topics SET collection_status = 'pending', updated_at = NOW() WHERE id = ?", [topicId]);
    }

    const pythonScriptPath = path.join(__dirname, "../../../different-news-data/article_collector.py");
    const command = `python "${pythonScriptPath}" ${topicId}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing article_collector.py for recollect: ${error}`);
        return;
      }
      console.log(`Recollect stdout: ${stdout}`);
      console.error(`Recollect stderr: ${stderr}`);
    });

    res.json({ message: `Recollection started for topic ${topicId}.`, searchKeywords: normalizedKeywords });
  } catch (error) {
    console.error("Error starting recollection:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
