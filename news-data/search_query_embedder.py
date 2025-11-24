#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# 검색용 파일: news-data/embed_query.py
"""
embed_query.py
- A simple script that takes a query string as a command-line argument.
- Loads the sentence-transformer model.
- Computes the embedding for the query.
- Prints the resulting vector to stdout as a JSON string.
"""

import sys
import json
import os
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import numpy as np

# .env ?�일 로드
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

MODEL_NAME = os.getenv("EMBED_MODEL", "dragonkue/multilingual-e5-small-ko")

def main():
    # Check if at least one argument (the query) is provided
    if len(sys.argv) < 2:
        # Print error to stderr
        print("Usage: python embed_query.py \"your query string\"", file=sys.stderr)
        sys.exit(1)

    query = sys.argv[1]

    try:
        model = SentenceTransformer(MODEL_NAME)
        
        # Add 'query: ' prefix as required by the E5 model
        prefixed_query = f"query: {query}"
        
        # Generate embedding
        embedding = model.encode(prefixed_query, normalize_embeddings=True)
        
        # Convert to a standard Python list of floats and print as JSON
        print(json.dumps(embedding.tolist()))

    except Exception as e:
        print(f"An error occurred during embedding: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
