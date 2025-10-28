import express, { Router, Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import { collectLatestArticles } from "../jobs/collectArticles";

const router = express.Router();

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
 *       202:
 *         description: 작업이 성공적으로 시작되었습니다.
 */
if (JOB_SECRET) {
    router.all(`/trigger-collector/${JOB_SECRET}`, (req: Request, res: Response) => {
        console.log('API를 통해 기사 수집 작업을 시작합니다...');
        res.status(202).json({ message: "Article collection job started." });
        collectLatestArticles();
    });
}

/**
 * @swagger
 * /api/jobs/update-popularity/{secret}:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: 인기 토픽 점수 계산 작업을 트리거합니다.
 *     description: 외부 스케줄러가 이 API를 주기적으로 호출하여, 모든 토픽의 인기 점수를 다시 계산하고 업데이트합니다.
 *     parameters:
 *       - in: path
 *         name: secret
 *         required: true
 *         schema:
 *           type: string
 *         description: 작업을 실행하기 위한 비밀 키
 *     responses:
 *       202:
 *         description: 작업이 성공적으로 시작되었습니다.
 */
if (JOB_SECRET) {
    router.all(`/update-popularity/${JOB_SECRET}`, (req: Request, res: Response) => {
        console.log('Starting popularity score calculation job via API...');
        res.status(202).json({ message: "Popularity score calculation job started." });

        const scriptPath = path.join(__dirname, "../../../news-data/popularity_calculator.py");
        const pythonProcess = spawn("python3", ["-u", scriptPath]);

        pythonProcess.stdout.on("data", (data) => {
            console.log(`[popularity_calculator.py stdout]: ${data.toString().trim()}`);
        });

        pythonProcess.stderr.on("data", (data) => {
            console.error(`[popularity_calculator.py stderr]: ${data.toString().trim()}`);
        });

        pythonProcess.on("close", (code) => {
            console.log(`Popularity calculator script exited with code ${code}`);
        });
    });
}

/**
 * @swagger
 * /api/jobs/prune-home-articles/{secret}:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: 오래된 홈 기사 삭제 작업을 트리거합니다.
 *     description: "주기적으로 호출하여, tn_home_article 테이블에 쌓인 오래된 기사(기본 7일 이상)를 삭제합니다."
 *     parameters:
 *       - in: path
 *         name: secret
 *         required: true
 *         schema:
 *           type: string
 *         description: 작업을 실행하기 위한 비밀 키
 *     responses:
 *       202:
 *         description: 작업이 성공적으로 시작되었습니다.
 */
if (JOB_SECRET) {
    router.all(`/prune-home-articles/${JOB_SECRET}`, (req: Request, res: Response) => {
        console.log('Starting home article pruning job via API...');
        res.status(202).json({ message: "Home article pruning job started." });

        const scriptPath = path.join(__dirname, "../../../news-data/home_article_pruner.py");
        const pythonProcess = spawn("python3", ["-u", scriptPath]);

        pythonProcess.stdout.on("data", (data) => {
            console.log(`[home_article_pruner.py stdout]: ${data.toString().trim()}`);
        });

        pythonProcess.stderr.on("data", (data) => {
            console.error(`[home_article_pruner.py stderr]: ${data.toString().trim()}`);
        });

        pythonProcess.on("close", (code) => {
            console.log(`Home article pruner script exited with code ${code}`);
        });
    });
}

export default router;