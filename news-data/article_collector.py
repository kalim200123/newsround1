import sys
import os
import platform

print("--- Python script started ---")
print(f"Python version: {sys.version}")
print(f"OS: {platform.system()} {platform.release()}")
print(f"Current working directory: {os.getcwd()}")

try:
    print("Importing numpy...")
    import numpy
    print("...numpy OK")

    print("Importing sentence_transformers...")
    import sentence_transformers
    print("...sentence_transformers OK")
    
    print("Importing dateutil...")
    import dateutil
    print("...dateutil OK")

    print("Importing konlpy...")
    import konlpy
    print("...konlpy OK")

    print("--- All major imports successful ---")

except Exception as e:
    print(f"--- IMPORT ERROR ---")
    # print the full traceback
    import traceback
    traceback.print_exc()
    sys.exit(1)