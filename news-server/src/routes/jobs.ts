import { spawn } from "child_process";
import express, { Request, Response } from "express";
import os from "os";
import path from "path";
import { collectLatestArticles } from "../jobs/collectArticles";

const router = express.Router();

const JOB_SECRET = process.env.JOB_TRIGGER_SECRET || "";

if (!JOB_SECRET) {
  console.warn("경고: JOB_TRIGGER_SECRET 환경 변수가 설정되지 않았습니다. 작업 트리거 API가 비활성화됩니다.");
}

// 환경 변수가 있으면 사용하고, 없으면 OS에 따라 기본값(win32: python, other: python3)을 사용합니다.
const pythonCommand = process.env.PYTHON_EXECUTABLE_PATH || (os.platform() === "win32" ? "python" : "python3");

// 각 작업의 동시 실행을 방지하기 위한 잠금 플래그
let isPopularityJobRunning = false;
let isPruningJobRunning = false;
let isVectorIndexerRunning = false;

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
 *       429:
 *         description: 작업이 이미 진행 중입니다.
 */
if (JOB_SECRET) {
  router.all(`/trigger-collector/${JOB_SECRET}`, (req: Request, res: Response) => {
    // 잠금 로직은 collectLatestArticles 함수 내부에 구현되어 있습니다.
    console.log("API를 통해 기사 수집 작업을 시작합니다...");
    collectLatestArticles();
    res.status(202).json({ message: "Article collection job started." });
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
 *       429:
 *         description: 작업이 이미 진행 중입니다.
 */
if (JOB_SECRET) {
  router.all(`/update-popularity/${JOB_SECRET}`, (req: Request, res: Response) => {
    if (isPopularityJobRunning) {
      return res.status(429).json({ message: "Popularity calculation job is already in progress." });
    }

    console.log("Starting popularity score calculation job via API...");
    res.status(202).json({ message: "Popularity score calculation job started." });

    isPopularityJobRunning = true;
    const scriptPath = path.join(__dirname, "../../../news-data/popularity_calculator.py");
    const pythonProcess = spawn(pythonCommand, ["-u", scriptPath]);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[popularity_calculator.py stdout]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[popularity_calculator.py stderr]: ${data.toString().trim()}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`Popularity calculator script exited with code ${code}`);
      isPopularityJobRunning = false;
    });

    pythonProcess.on("error", (err) => {
      console.error("Failed to start popularity calculator script:", err);
      isPopularityJobRunning = false;
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
 *       429:
 *         description: 작업이 이미 진행 중입니다.
 */
if (JOB_SECRET) {
  router.all(`/prune-home-articles/${JOB_SECRET}`, (req: Request, res: Response) => {
    if (isPruningJobRunning) {
      return res.status(429).json({ message: "Home article pruning job is already in progress." });
    }

    console.log("Starting home article pruning job via API...");
    res.status(202).json({ message: "Home article pruning job started." });

    isPruningJobRunning = true;
    const scriptPath = path.join(__dirname, "../../../news-data/home_article_pruner.py");
    const pythonProcess = spawn(pythonCommand, ["-u", scriptPath]);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[home_article_pruner.py stdout]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[home_article_pruner.py stderr]: ${data.toString().trim()}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`Home article pruner script exited with code ${code}`);
      isPruningJobRunning = false;
    });

    pythonProcess.on("error", (err) => {
      console.error("Failed to start home article pruner script:", err);
      isPruningJobRunning = false;
    });
  });
}

/**
 * @swagger
 * /api/jobs/run-vector-indexer/{secret}:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: 벡터 인덱싱 작업을 수동으로 트리거합니다.
 *     description: "tn_home_article 테이블에서 아직 벡터화되지 않은 기사들을 찾아 임베딩을 생성하고 저장합니다."
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
 *       429:
 *         description: 작업이 이미 진행 중입니다.
 */
if (JOB_SECRET) {
  router.all(`/run-vector-indexer/${JOB_SECRET}`, (req: Request, res: Response) => {
    if (isVectorIndexerRunning) {
      return res.status(429).json({ message: "Vector indexer job is already in progress." });
    }

    console.log("Starting vector indexer job via API...");
    res.status(202).json({ message: "Vector indexer job started." });

    isVectorIndexerRunning = true;
    const scriptPath = path.join(__dirname, "../../../news-data/daily_vectorizer.py");
    const pythonProcess = spawn(pythonCommand, ["-u", scriptPath]);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[vector_indexer.py stdout]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[vector_indexer.py stderr]: ${data.toString().trim()}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`Vector indexer script exited with code ${code}`);
      isVectorIndexerRunning = false;
    });

    pythonProcess.on("error", (err) => {
      console.error("Failed to start vector indexer script:", err);
      isVectorIndexerRunning = false;
    });
  });
}

/**
 * @swagger
 * /api/jobs/trigger-pipeline/{secret}:
 *   post:
 *     tags:
 *       - Jobs
 *     summary: 기사 수집 및 임베딩 파이프라인을 순차적으로 실행합니다.
 *     description: "외부 크론잡에서 호출하여 rss_collector.py 실행 후 daily_vectorizer.py를 실행합니다."
 *     parameters:
 *       - in: path
 *         name: secret
 *         required: true
 *         schema:
 *           type: string
 *         description: 작업을 실행하기 위한 비밀 키
 *     responses:
 *       202:
 *         description: 파이프라인이 성공적으로 시작되었습니다.
 *       429:
 *         description: 작업이 이미 진행 중입니다.
 */
if (JOB_SECRET) {
  router.all(`/trigger-pipeline/${JOB_SECRET}`, (req: Request, res: Response) => {
    // 파이프라인은 수집과 임베딩을 모두 포함하므로 두 잠금 플래그를 모두 확인/설정하는 것이 안전하지만,
    // 간단하게 별도의 플래그를 두거나 그냥 실행할 수도 있습니다.
    // 여기서는 쿨하게 그냥 실행하되, 로그를 남깁니다.

    console.log("Starting full pipeline (Collection -> Embedding) via API...");
    res.status(202).json({ message: "Full pipeline started." });

    const scriptPath = path.join(__dirname, "../../../news-data/run_pipeline.py");
    const pythonProcess = spawn(pythonCommand, ["-u", scriptPath]);

    pythonProcess.stdout.on("data", (data) => {
      console.log(`[run_pipeline.py stdout]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`[run_pipeline.py stderr]: ${data.toString().trim()}`);
    });

    pythonProcess.on("close", (code) => {
      console.log(`Pipeline script exited with code ${code}`);
    });

    pythonProcess.on("error", (err) => {
      console.error("Failed to start pipeline script:", err);
    });
  });
}

export default router;
