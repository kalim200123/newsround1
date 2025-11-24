import subprocess
import sys
import os
import time

def run_script(script_name):
    print(f"\n[Pipeline] Starting {script_name}...")
    start_time = time.time()
    
    # 현재 실행 중인 파이썬 인터프리터 사용
    python_exe = sys.executable
    script_path = os.path.join(os.path.dirname(__file__), script_name)
    
    # 서브프로세스로 실행 (메모리 격리 및 해제 보장)
    # check=False로 설정하여 에러가 나도 일단 다음 단계 진행 여부를 결정할 수 있게 함
    result = subprocess.run([python_exe, script_path], capture_output=False)
    
    elapsed = time.time() - start_time
    print(f"[Pipeline] Finished {script_name} in {elapsed:.2f}s. Exit code: {result.returncode}")
    
    return result.returncode == 0

if __name__ == "__main__":
    print("=== Starting News Collection & Embedding Pipeline ===")
    
    # 1. RSS 수집 (기사 긁어오기)
    if not run_script("rss_collector.py"):
        print("[Pipeline] RSS collection failed. Aborting pipeline.")
        sys.exit(1)
        
    # 2. 벡터 임베딩 (새로 들어온 기사 처리)
    # rss_collector가 끝난 후 실행되므로 메모리가 확보된 상태임
    if not run_script("daily_vectorizer.py"):
        print("[Pipeline] Vector indexing failed.")
        sys.exit(1)
        
    print("=== Pipeline Completed Successfully ===")
