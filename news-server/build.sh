#!/bin/bash

# Exit on error
set -e

# Install Node.js dependencies (assuming npm, change to yarn if you use it)
echo "Installing Node.js dependencies..."
npm install

# Install Python dependencies from the news-data directory
echo "Installing Python dependencies..."
pip install -r ../news-data/requirements.txt

echo "Build script finished successfully."
