import { spawn } from "child_process";
import os from "os";
import path from "path";

// 작업이 이미 실행 중인지 확인하기 위한 잠금 플래그
let isJobRunning = false;

/**
 * home_article_collector.py 파이썬 스크립트를 실행합니다.
 * 이 함수는 스크립트의 완료를 기다리지 않습니다 (fire-and-forget).
 */
export const collectLatestArticles = () => {
  if (isJobRunning) {
    console.log("Article collection job is already running. Skipping.");
    return;
  }

  // 실행 환경(로컬, Docker, Render)에 구애받지 않도록 파일의 절대 경로를 기준으로 스크립트 경로를 계산합니다.
  const projectRoot = path.resolve(__dirname, "..", "..", "..");
  const scriptPath = path.resolve(projectRoot, "news-data", "rss_collector.py");

  console.log(`Executing python script: ${scriptPath}`);

  // 일관성을 위해 다른 파일들과 동일한 방식으로 Python 명령어를 결정합니다.
  const pythonCommand = process.env.PYTHON_EXECUTABLE_PATH || (os.platform() === "win32" ? "python" : "python3");

  isJobRunning = true; // 작업 시작 시 잠금 설정

  const pythonProcess = spawn(pythonCommand, ["-u", scriptPath], {
    env: { ...process.env },
  });

  pythonProcess.stdout.on("data", (data) => {
    console.log(`[python-stdout] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`[python-stderr] ${data.toString().trim()}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`Python script exited with code ${code}`);
    isJobRunning = false; // 작업 종료 시 잠금 해제
  });

  pythonProcess.on("error", (err) => {
    console.error("Failed to start python script:", err);
    isJobRunning = false; // 에러 발생 시에도 잠금 해제
  });
};

// 로컬 테스트용
if (require.main === module) {
  collectLatestArticles();
}
