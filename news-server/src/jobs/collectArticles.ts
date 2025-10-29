import { spawn } from "child_process";
import path from "path";
import os from "os";

/**
 * home_article_collector.py 파이썬 스크립트를 실행합니다.
 * 이 함수는 스크립트의 완료를 기다리지 않습니다 (fire-and-forget).
 */
export const collectLatestArticles = () => {
  // 실행 환경(로컬, Docker, Render)에 구애받지 않도록 파일의 절대 경로를 기준으로 스크립트 경로를 계산합니다.
  // __dirname: .../news-server/dist/jobs (컴파일 후) 또는 .../news-server/src/jobs (개발 중)
  // 현재 구조에서는 src/jobs를 기준으로 3단계 위가 프로젝트 루트입니다.
  const projectRoot = path.resolve(__dirname, "..", "..", "..");
  const scriptPath = path.resolve(projectRoot, "news-data", "home_article_collector.py");
  
  console.log(`Executing python script: ${scriptPath}`);

  // 운영체제에 따라 올바른 Python 명령어를 선택합니다.
  const pythonCommand = os.platform() === 'win32' ? 'python' : 'python3';

  // spawn 함수는 세 번째 인자로 옵션을 받습니다.
  const pythonProcess = spawn(pythonCommand, ["-u", scriptPath], {
    // env 객체를 통해 자식 프로세스에 환경 변수를 전달할 수 있습니다.
    env: {
      ...process.env, // 현재 실행 중인 Node.js 프로세스의 환경 변수를 그대로 전달합니다.
    },
  });

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
