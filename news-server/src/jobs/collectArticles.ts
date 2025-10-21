import { spawn } from "child_process";
import path from "path";

/**
 * home_article_collector.py 파이썬 스크립트를 실행합니다.
 * 이 함수는 스크립트의 완료를 기다리지 않습니다 (fire-and-forget).
 */
export const collectLatestArticles = () => {
  // Render 환경에서는 프로젝트 루트에서 실행되므로, 상대 경로를 사용합니다.
  const scriptPath = path.resolve(process.cwd(), "news-data", "home_article_collector.py");
  
  console.log(`Executing python script: ${scriptPath}`);

  const pythonProcess = spawn("python3", ["-u", scriptPath]);

  // 파이썬 스크립트의 출력을 Node.js 로그에 연결하여 Render 대시보드에서 확인할 수 있도록 합니다.
  pythonProcess.stdout.on("data", (data) => {
    console.log(`[python-stdout] ${data.toString().trim()}`);
  });

  pythonProcess.stderr.on("data", (data) => {
    console.error(`[python-stderr] ${data.toString().trim()}`);
  });

  pythonProcess.on("close", (code) => {
    console.log(`Python script exited with code ${code}`);
  });

  pythonProcess.on("error", (err) => {
    console.error("Failed to start python script:", err);
  });
};

// 로컬 테스트용
if (require.main === module) {
  collectLatestArticles();
}
