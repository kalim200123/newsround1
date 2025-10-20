# 1. Base Image with Node.js
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# 2. Install Python AND build tools
RUN apt-get update && apt-get install -y python3 python3-pip build-essential && apt-get clean

# 3. Install Python Dependencies (this layer is cached if requirements.txt doesn't change)
COPY news-data/requirements.txt ./news-data/requirements.txt
RUN pip3 install --no-cache-dir -r news-data/requirements.txt

# 4. Install Node.js Dependencies (this layer is cached if package.json doesn't change)
COPY news-server/package.json ./news-server/package.json
COPY news-server/package-lock.json ./news-server/package-lock.json
RUN cd news-server && npm install

# 5. Copy all source code
COPY . .

# 6. Build TypeScript
RUN cd news-server && npm run build

# 7. Set the final command to run the server
CMD ["node", "news-server/dist/app.js"]
