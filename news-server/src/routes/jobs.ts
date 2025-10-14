import { Router, Request, Response } from "express";
import { collectLatestArticles } from "../jobs/collectArticles";

const router = Router();

// 이 API의 전체 경로는 /api/jobs/trigger-collector/<SECRET> 이 됩니다.
const JOB_SECRET = process.env.JOB_TRIGGER_SECRET || "";

if (!JOB_SECRET) {
    console.warn('경고: JOB_TRIGGER_SECRET 환경 변수가 설정되지 않았습니다. 작업 트리거 API가 비활성화됩니다.');
}

/**
 * @swagger
 * /api/jobs/trigger-collector/{secret}:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: 최신 기사 수집 작업을 수동으로 트리거합니다.
 *     description: 외부 스케줄러나 관리자가 이 API를 호출하여 최신 기사 수집을 실행합니다. URL의 secret 값은 환경 변수와 일치해야 합니다.
 *     parameters:
 *       - in: path
 *         name: secret
 *         required: true
 *         schema:
 *           type: string
 *         description: 작업을 실행하기 위한 비밀 키
 *     responses:
 *       200:
 *         description: 작업이 성공적으로 실행되었습니다.
 *       401:
 *         description: 비밀 키가 일치하지 않습니다.
 *       500:
 *         description: 작업 실행 중 오류 발생.
 */
if (JOB_SECRET) {
    router.all(`/trigger-collector/${JOB_SECRET}`, async (req: Request, res: Response) => {
        console.log('API를 통해 기사 수집 작업을 시작합니다...');

        // 요청을 즉시 반환하고, 실제 작업은 백그라운드에서 계속 실행합니다.
        res.status(202).json({ message: "Article collection job started." });

        // await를 사용하지 않음으로써, 클라이언트가 응답을 기다리지 않게 합니다.
        collectLatestArticles().then(result => {
            if (result.success) {
                console.log(`백그라운드 작업 완료: ${result.articlesAdded}개의 새 기사 추가됨`);
            } else {
                console.error(`백그라운드 작업 실패: ${result.message}`);
            }
        });
    });
}

export default router;
