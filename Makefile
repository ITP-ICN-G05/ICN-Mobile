# ICN Navigator Mobile MVP - Development Makefile
# Sprint 2 Development Commands

.PHONY: help build up down setup dev clean logs shell install test lint format

# Default target
help:
	@echo "🚀 ICN Navigator Mobile MVP - Development Commands"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make setup     - Initial project setup with Docker"
	@echo "  make install   - Install dependencies inside container"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev       - Start development environment"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start containers in background"
	@echo "  make down      - Stop and remove containers"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make shell     - Open bash shell in container"
	@echo "  make logs      - View container logs"
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
	docker-compose build
	make up
	make shell-setup

shell-setup:
	@echo "📱 Running initial project setup..."
	docker-compose exec icn-mobile-dev bash -c "chmod +x setup.sh && ./setup.sh"

install:
	@echo "📦 Installing dependencies..."
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npm install"

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
	docker-compose exec icn-mobile-dev bash -c "cd ICNNavigatorMobile && npm start"

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

# Quick development workflow
quick-start: build up install start

# Emergency reset
reset: clean setup