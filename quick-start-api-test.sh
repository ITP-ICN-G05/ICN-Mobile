#!/bin/bash

# ICN Mobile API Quick Start and Test Script
# This script will help you quickly start backend services and test API connections

echo "🚀 ICN Mobile API Quick Start Script"
echo "=================================="

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
check_docker() {
    echo -e "${BLUE}📋 Checking Docker status...${NC}"
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running, please start Docker Desktop${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Check backend directory
check_backend_directory() {
    echo -e "${BLUE}📋 Checking backend directory...${NC}"
    if [ ! -d "../ICN-Backend" ]; then
        echo -e "${RED}❌ ICN-Backend directory not found, please ensure correct project structure${NC}"
        echo "Expected structure:"
        echo "ICN/"
        echo "├── ICN-Backend/"
        echo "└── ICN-Mobile/"
        exit 1
    fi
    echo -e "${GREEN}✅ Found ICN-Backend directory${NC}"
}

# Start MongoDB
start_mongodb() {
    echo -e "${BLUE}📋 Starting MongoDB...${NC}"
    cd ../ICN-Backend/infra/mongo
    
    if docker-compose ps | grep -q "Up"; then
        echo -e "${YELLOW}⚠️  MongoDB container is already running${NC}"
    else
        echo -e "${BLUE}🔄 Starting MongoDB container...${NC}"
        docker-compose up -d
        
        # Wait for MongoDB to start
        echo -e "${BLUE}⏳ Waiting for MongoDB to start...${NC}"
        sleep 10
        
        if docker-compose ps | grep -q "Up"; then
            echo -e "${GREEN}✅ MongoDB started successfully${NC}"
        else
            echo -e "${RED}❌ MongoDB startup failed${NC}"
            exit 1
        fi
    fi
    
    cd ../../..
}

# Start backend service
start_backend() {
    echo -e "${BLUE}📋 Starting backend service...${NC}"
    cd ../ICN-Backend
    
    # Check Java version
    if ! java -version 2>&1 | grep -q "18"; then
        echo -e "${YELLOW}⚠️  Recommend using Java 18, current version:${NC}"
        java -version
    fi
    
    # Check Maven
    if ! command -v mvn &> /dev/null; then
        echo -e "${RED}❌ Maven not found, please install Maven${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔄 Building backend project...${NC}"
    mvn clean install -DskipTests
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend build successful${NC}"
    else
        echo -e "${RED}❌ Backend build failed${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🔄 Starting backend service...${NC}"
    echo -e "${YELLOW}💡 Backend service will start in background, please wait...${NC}"
    
    # Start Spring Boot application in background
    nohup mvn spring-boot:run > backend.log 2>&1 &
    BACKEND_PID=$!
    
    # Wait for backend to start
    echo -e "${BLUE}⏳ Waiting for backend service to start...${NC}"
    sleep 15
    
    # Test backend connection
    if curl -s http://localhost:8082/api/user/getCode?email=test@example.com > /dev/null; then
        echo -e "${GREEN}✅ Backend service started successfully${NC}"
        echo -e "${GREEN}🌐 API service address: http://localhost:8082/api${NC}"
    else
        echo -e "${RED}❌ Backend service startup failed or not responding${NC}"
        echo -e "${YELLOW}💡 Please check backend.log file for detailed error information${NC}"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    cd ../ICN-Mobile
}

# Test API connection
test_api_connection() {
    echo -e "${BLUE}📋 Testing API connection...${NC}"
    
    # Test basic connection
    echo -e "${BLUE}🔄 Testing basic connection...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8082/api/user/getCode?email=test@example.com | grep -q "202\|400"; then
        echo -e "${GREEN}✅ Basic connection test passed${NC}"
    else
        echo -e "${RED}❌ Basic connection test failed${NC}"
        return 1
    fi
    
    # Test organisation search API
    echo -e "${BLUE}🔄 Testing organisation search API...${NC}"
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8082/api/organisation/general?locationX=0&locationY=0&lenX=100&lenY=100" | grep -q "200\|400"; then
        echo -e "${GREEN}✅ Organisation search API test passed${NC}"
    else
        echo -e "${RED}❌ Organisation search API test failed${NC}"
        return 1
    fi
    
    echo -e "${GREEN}🎉 All API tests passed!${NC}"
}

# Show mobile startup instructions
show_mobile_instructions() {
    echo -e "${BLUE}📱 Mobile startup instructions:${NC}"
    echo "=================================="
    echo -e "${YELLOW}1. Start mobile development environment:${NC}"
    echo "   make dev"
    echo ""
    echo -e "${YELLOW}2. Or start Expo directly:${NC}"
    echo "   make start"
    echo ""
    echo -e "${YELLOW}3. Test API connection in app:${NC}"
    echo "   - Import ApiIntegrationTest component"
    echo "   - Run API test suite"
    echo ""
    echo -e "${YELLOW}4. Platform-specific configuration:${NC}"
    echo "   - Android emulator: Use 10.0.2.2:8082"
    echo "   - iOS simulator: Use localhost:8082"
    echo "   - Physical device: Use your computer's IP address"
    echo ""
    echo -e "${GREEN}📚 Detailed instructions: ICN_MOBILE_API_SETUP_GUIDE.md${NC}"
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🔄 Cleaning up resources...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend service stopped${NC}"
    fi
}

# Set cleanup trap
trap cleanup EXIT

# Main execution flow
main() {
    echo -e "${GREEN}🎯 Starting ICN Mobile API setup...${NC}"
    echo ""
    
    check_docker
    check_backend_directory
    start_mongodb
    start_backend
    test_api_connection
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 API setup completed!${NC}"
        echo ""
        show_mobile_instructions
        echo ""
        echo -e "${YELLOW}💡 Press Ctrl+C to stop backend service${NC}"
        
        # Keep script running, wait for user interruption
        while true; do
            sleep 1
        done
    else
        echo -e "${RED}❌ API setup failed${NC}"
        exit 1
    fi
}

# Run main function
main
