# Expo React Native Development Environment
FROM node:20-bookworm-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    python3 \
    build-essential \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Expo CLI and related tools globally
RUN npm install -g @expo/cli @expo/ngrok

# Set environment variables
ENV EXPO_NO_TELEMETRY=1 \
    CHOKIDAR_USEPOLLING=1 \
    WATCHPACK_POLLING=true

# Expose Expo ports (mobile-only, no web)
EXPOSE 8081 19000 19001 19002

# Start bash for interactive project creation
CMD ["bash"]