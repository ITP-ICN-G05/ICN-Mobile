# ICN Navigator Mobile MVP - Development Makefile
# Sprint 2 Development Commands

.PHONY: help build up down setup dev clean logs shell install test lint format fix-expo clean-install diagnose

# Default target
help:
	@echo "🚀 ICN Navigator Mobile MVP - Development Commands"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make setup       - Smart initial setup (skips if already built)"
	@echo "  make rebuild     - Force rebuild Docker images"
	@echo "  make install     - Smart dependency install (skips if exists)"
	@echo "  make reinstall   - Force reinstall dependencies"
	@echo "  make fix-expo    - Fix Expo dependencies and versions"
	@echo "  make clean-install - Clean install with legacy peer deps"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev       - Start development environment"
	@echo "  make start     - Start Expo server (tunnel mode)"
	@echo "  make start-lan - Start Expo server (LAN mode)"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start containers in background"
	@echo "  make down      - Stop and remove containers"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make shell     - Open bash shell in container"
	@echo "  make logs      - View container logs"
	@echo "  make status    - Check environment status"
	@echo "  make diagnose  - Run comprehensive diagnostics"
	@echo "  make clean     - Clean up Docker resources"
	@echo ""
	@echo "Code Quality Commands:"
	@echo "  make lint      - Run ESLint"
	@echo "  make format    - Format code with Prettier"
	@echo "  make test      - Run tests"
	@echo ""
	@echo "Sprint 2 Status: Week 1 - Foundation Setup"

# Setup and Installation
setup:
	@echo "🏗️ Setting up ICN Navigator Mobile MVP development environment..."
	@if docker images | grep -q "icn-mobile"; then \
		echo "✅ Docker image already exists, skipping build..."; \
	else \
		echo "🔨 Building Docker image for the first time..."; \
		docker-compose build; \
	fi
	@if docker-compose ps | grep -q "Up"; then \
		echo "✅ Containers already running, skipping startup..."; \
	else \
		echo "⬆️ Starting containers..."; \
		make up; \
	fi
	@echo "📱 Running project setup..."
	make shell-setup

shell-setup:
	@echo "📱 Running initial project setup..."
	@if docker-compose exec icn-mobile-dev bash -c "test -d ICNNavigatorMobile/node_modules"; then \
		echo "✅ Dependencies already installed, skipping npm install..."; \
	else \
		echo "📦 Installing dependencies for the first time..."; \
		docker-compose exec icn-mobile-dev bash -c "chmod +x setup.sh && sed -i 's/\r$$//' setup.sh && ./setup.sh"; \
	fi

# Force rebuild (useful when Dockerfile changes)
rebuild:
	@echo "🔨 Force rebuilding Docker images..."
	docker-compose build --no-cache

install:
	@echo "📦 Installing dependencies..."
	@if docker-compose exec icn-mobile-dev bash -c "test -d ICNNavigatorMobile/node_modules && test -f ICNNavigatorMobile/package-lock.json"; then \
		echo "✅ Dependencies already installed, skipping..."; \
		echo "💡 Use 'make reinstall' to force reinstall dependencies"; \
	else \
		echo "📦 Installing dependencies..."; \
		docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npm install --legacy-peer-deps"; \
	fi

# Force reinstall dependencies
reinstall:
	@echo "🔄 Force reinstalling dependencies..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps"

# Fix Expo dependencies and versions
fix-expo:
	@echo "🔧 Fixing Expo dependencies and versions..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npx expo install --fix --legacy-peer-deps"

# Clean install with legacy peer deps
clean-install:
	@echo "🧹 Clean install with legacy peer deps..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && rm -rf node_modules package-lock.json && npm cache clean --force && npm install --legacy-peer-deps"

# Development
dev:
	@echo "🚀 Starting ICN Navigator Mobile development environment..."
	docker-compose up

build:
	@echo "🔨 Building Docker images..."
	docker-compose build

up:
	@echo "⬆️ Starting containers..."
	docker-compose up -d

down:
	@echo "⬇️ Stopping containers..."
	docker-compose down

# Development Utilities  
shell:
	@echo "🐚 Opening shell in mobile development container..."
	docker-compose exec icn-mobile-dev bash

logs:
	@echo "📋 Viewing container logs..."
	docker-compose logs -f icn-mobile-dev

# Code Quality
lint:
	@echo "🔍 Running ESLint..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npm run lint"

format:
	@echo "✨ Formatting code with Prettier..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npm run format"

test:
	@echo "🧪 Running tests..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npm test"

# Expo specific commands
start:
	@echo "📱 Starting Expo development server..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npx expo start --tunnel --clear"

start-lan:
	@echo "📱 Starting Expo development server (LAN)..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npx expo start --lan --clear"

start-localhost:
	@echo "📱 Starting Expo development server (localhost)..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npx expo start --localhost --clear"

android:
	@echo "🤖 Starting on Android..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npm run android"

ios:
	@echo "🍎 Starting on iOS simulator..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npm run ios"

# Cleanup
clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

clean-all:
	@echo "🧹 Deep cleaning Docker resources..."
	docker-compose down -v --rmi all
	docker system prune -a -f
	docker volume prune -f

# Status and Info
status:
	@echo "📊 Development Environment Status:"
	@echo ""
	docker-compose ps
	@echo ""
	@echo "💾 Disk Usage:"
	docker system df
	@echo ""
	@echo "🌐 Network Info:"
	docker network ls | grep icn

# Diagnostic commands
diagnose:
	@echo "🔍 Running diagnostics..."
	@echo "📋 Container Status:"
	docker-compose ps
	@echo ""
	@echo "📦 Node/NPM versions in container:"
	docker-compose exec icn-mobile-dev bash -c "node --version && npm --version"
	@echo ""
	@echo "📱 Expo CLI version:"
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npx expo --version" || echo "Expo CLI not available"
	@echo ""
	@echo "📁 Project structure:"
	docker-compose exec icn-mobile-dev bash -c "ls -la ICNNavigatorMobile/" || echo "Project directory not found"

# Quick development workflow
quick-start: build up install start

# Emergency reset
reset: clean setup