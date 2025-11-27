import cron from "node-cron";
import pool from "../config/db";

/**
 * 토픽 자동 마감 스케줄러
 * 매분 실행되어 vote_end_at이 지난 토픽의 상태를 CLOSED로 변경합니다.
 */
export const initTopicScheduler = () => {
  // 매일 자정(00:00)에 실행
  cron.schedule("0 0 * * *", async () => {
    const connection = await pool.getConnection();
    try {
      // 마감 시간이 지났는데 아직 OPEN 상태인 토픽 찾기
      const [rows]: any = await connection.query(
        "SELECT id, display_name FROM tn_topic WHERE status = 'OPEN' AND vote_end_at <= NOW()"
      );

      if (rows.length > 0) {
        console.log(`[Scheduler] Found ${rows.length} expired topics. Closing them...`);

        // 상태를 CLOSED로 업데이트
        const [result]: any = await connection.query(
          "UPDATE tn_topic SET status = 'CLOSED' WHERE status = 'OPEN' AND vote_end_at <= NOW()"
        );

        if (result.affectedRows > 0) {
          console.log(`[Scheduler] Successfully closed ${result.affectedRows} topics.`);
          rows.forEach((row: any) => {
            console.log(` - Closed Topic ID: ${row.id}, Name: ${row.display_name}`);
          });
        }
      }
    } catch (error) {
      console.error("[Scheduler] Error checking expired topics:", error);
    } finally {
      connection.release();
    }
  });

  console.log("[Scheduler] Topic auto-close scheduler initialized.");
};
