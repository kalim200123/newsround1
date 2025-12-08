# Stage 1: Dependencies & Build
FROM node:18-slim AS builder

# Set working directory
WORKDIR /usr/src/app

# Install Python and build dependencies
# python3-venv: for creating virtual environment
# build-essential, gfortran, python3-dev: for compiling numpy/scikit-learn if wheels are missing (though slim usually has wheels)
RUN apt-get update && \
    apt-get install -y python3 python3-pip python3-venv python3-dev build-essential gfortran && \
    rm -rf /var/lib/apt/lists/*

# Create virtual environment
ENV VIRTUAL_ENV=/opt/venv
RUN python3 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Copy package definition files for the backend
COPY package*.json ./

# Install backend Node.js dependencies
RUN npm install

# Copy the entire backend source code
COPY . ./

# Install Python dependencies for the scripts into the virtual environment
# First, install PyTorch CPU version explicitly to save space and build time (default is GPU which is huge)
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

# then install other requirements
RUN pip install --no-cache-dir -r scripts/requirements.txt

# Build the NestJS application
RUN npm run build

# ---

# Stage 2: Production
FROM node:18-slim AS production

WORKDIR /usr/src/app

# Install Python runtime
# libgomp1 is often needed for scikit-learn/numpy
RUN apt-get update && \
    apt-get install -y python3 python3-venv libgomp1 && \
    rm -rf /var/lib/apt/lists/*

# Copy production node_modules from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy compiled NestJS application from the builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Copy Python scripts
COPY --from=builder /usr/src/app/scripts ./scripts

# Copy public folder (avatars, static files)
COPY --from=builder /usr/src/app/public ./public

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv

# Set environment variables to use the virtual environment
ENV VIRTUAL_ENV=/opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Expose the application port
EXPOSE 3001

# The command to run the application
CMD ["node", "dist/main"]