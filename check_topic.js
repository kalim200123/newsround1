require("dotenv").config({ path: "c:\\Users\\RST\\.vscode\\news\\news-server\\.env" });
const mysql = require("mysql2/promise");

async function checkApiQuery() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: process.env.DB_PORT || 3306,
      ssl: { rejectUnauthorized: false },
    });

    const topicId = 420076;
    const userId = null; // Simulate unauthenticated user

    console.log(`Running API Query for Topic ${topicId}...`);

    // 1. Topic Query
    const [topicRows] = await connection.execute(
      `
      SELECT 
        t.id, t.display_name, t.summary, t.published_at, t.view_count, t.collection_status,
        t.vote_count_left, t.vote_count_right,
        t.stance_left, t.stance_right,
        t.vote_start_at, t.vote_end_at,
        v.side as my_vote
      FROM tn_topic t
      LEFT JOIN tn_topic_vote v ON t.id = v.topic_id AND v.user_id = ?
      WHERE t.id = ? AND t.status = 'OPEN'
      `,
      [userId, topicId]
    );
    console.log("Topic Rows:", topicRows);

    if (topicRows.length > 0) {
      // 2. Article Query
      const [articleRows] = await connection.execute(
        `
        SELECT 
          a.id, a.source, a.source_domain, a.side, a.title, a.url, a.published_at, a.is_featured, a.thumbnail_url, a.view_count,
          MAX(IF(s_user.id IS NOT NULL, 1, 0)) AS isSaved
        FROM 
          tn_article a
        LEFT JOIN
          tn_user_saved_articles s_user ON a.id = s_user.article_id AND s_user.user_id = ?
        WHERE 
          a.topic_id = ? AND a.status = 'published'
        GROUP BY
          a.id
        ORDER BY 
          a.display_order ASC, a.published_at DESC
        `,
        [userId, topicId]
      );
      console.log("Article Rows Count:", articleRows.length);
      if (articleRows.length > 0) {
        console.log("First Article:", articleRows[0]);
      }
    } else {
      console.log("Topic not found or not OPEN.");
      // Check actual status
      const [check] = await connection.execute("SELECT id, status, topic_type FROM tn_topic WHERE id = ?", [topicId]);
      console.log("Actual DB Status:", check);
    }

    await connection.end();
  } catch (error) {
    console.error("Error:", error);
  }
}

checkApiQuery();
