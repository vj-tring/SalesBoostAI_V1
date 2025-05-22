# AI Sales Chatbot Platform

## Overview

This is a comprehensive AI-powered sales chatbot platform built with a full-stack TypeScript architecture. The application provides an intelligent customer service solution that integrates with Shopify, uses OpenAI for natural language processing, and includes real-time conversation management with a React-based dashboard.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite for development and building
- **Real-time Updates**: WebSocket connection for live data synchronization

### Backend Architecture
- **Runtime**: Node.js with TypeScript (ESM modules)
- **Framework**: Express.js for REST API and WebSocket server
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **AI Integration**: OpenAI GPT-4o for conversation processing
- **E-commerce Integration**: Shopify REST API
- **Session Management**: PostgreSQL-backed sessions

### Key Design Decisions
- **Monorepo Structure**: Client, server, and shared code in a single repository for easier development
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Real-time Communication**: WebSocket integration for live dashboard updates
- **Serverless Database**: Neon Database for scalable PostgreSQL hosting
- **Component-based UI**: Reusable UI components with consistent design system

## Key Components

### Database Schema
- **Users**: Admin user management with role-based access
- **Conversations**: Customer chat sessions with status tracking
- **Messages**: Individual messages with role-based categorization (user/assistant/system)
- **Products**: Shopify product synchronization with local caching
- **Orders**: Order tracking with conversation attribution
- **Recommendations**: AI-generated product recommendations
- **Webhooks**: External service integrations
- **API Metrics**: Performance and usage analytics

### AI Service Layer
- **OpenAI Integration**: GPT-4o model for natural language processing
- **Context-Aware Responses**: Customer history and product catalog integration
- **Intent Recognition**: Automatic categorization of customer inquiries
- **Recommendation Engine**: Cross-sell and upsell suggestions
- **Escalation Logic**: Automatic human handoff for complex issues

### Shopify Integration
- **Product Synchronization**: Automated product catalog updates
- **Order Management**: Real-time order status tracking
- **Customer Data**: Integration with Shopify customer profiles
- **Webhook Support**: Real-time notifications from Shopify

### Real-time Features
- **WebSocket Server**: Live conversation updates
- **Dashboard Metrics**: Real-time performance monitoring
- **Conversation Monitoring**: Live chat session tracking
- **System Health**: Service status monitoring

## Data Flow

1. **Customer Interaction**: Messages received via API endpoints
2. **AI Processing**: OpenAI analyzes message context and customer history
3. **Product Integration**: AI accesses product catalog for recommendations
4. **Response Generation**: Contextual responses with product suggestions
5. **Database Storage**: All interactions logged for analytics
6. **Real-time Updates**: Dashboard receives live updates via WebSocket
7. **External Webhooks**: Third-party services notified of events

## External Dependencies

### Core Services
- **OpenAI API**: GPT-4o model for conversation processing
- **Shopify REST API**: E-commerce platform integration
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket**: Real-time communication protocol

### Development Tools
- **Drizzle ORM**: Type-safe database operations
- **Zod**: Runtime type validation
- **TanStack Query**: Data fetching and caching
- **Axios**: HTTP client for external API calls

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Icon library
- **React Hook Form**: Form state management

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with Vite dev server
- **Production**: Node.js server with built static assets
- **Database**: Environment-based connection strings
- **API Keys**: Secure environment variable management

### Build Process
1. **Frontend Build**: Vite builds React app to static assets
2. **Backend Build**: ESBuild bundles Node.js server
3. **Asset Serving**: Express serves built frontend in production
4. **Database Migrations**: Drizzle handles schema changes

### Replit Integration
- **Auto-deployment**: Configured for Replit's autoscale deployment
- **Development Mode**: Integrated with Replit's development environment
- **Port Configuration**: Standard web application port setup (5000 → 80)
- **Module System**: Node.js 20 with PostgreSQL 16 support

### Monitoring and Analytics
- **Health Checks**: API endpoint for service status monitoring
- **Performance Metrics**: Built-in analytics for conversation and sales tracking
- **Error Handling**: Comprehensive error logging and user feedback
- **WebSocket Monitoring**: Connection status and real-time data flow tracking