# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Webhook Configuration Management System** built with Vue 3 + TypeScript + Element Plus. It provides a unified interface to manage webhook configurations across multiple platforms (Feishu, WeChat Work, DingTalk, etc.) with intelligent message routing and template management.

### Core Purpose
- **Unified Webhook Reception**: Single entry point `http://domain.com/webhook/{group}` for all webhook sources
- **Multi-Platform Support**: Feishu, WeChat Work, DingTalk, Slack, Discord, Teams, custom webhooks
- **Intelligent Message Routing**: Keyword-based automatic message distribution and user mentions
- **Template Management**: Customizable Feishu card message templates with real-time preview

## Development Commands

```bash
# Install dependencies
npm install

# Development server (runs on http://localhost:3000+)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint and fix code
npm run lint
```

## Architecture Overview

### Data Flow Architecture
```
Webhook Sources → Unified Endpoint (/webhook/{group}) → Message Parser → Rule Engine → Platform Senders
```

### Core Data Model
- **Groups**: Contain webhooks and represent notification channels with unique identifiers
- **Users**: Multi-platform user ID mappings (Feishu ID, WeChat Work ID, etc.)
- **Rules**: Keyword matching logic with user mentions and template styling
- **Templates**: Feishu card message templates with conditions and styling
- **Webhooks**: Platform-specific webhook configurations with test status

### State Management (Pinia)
- **stores/groups.ts**: Group CRUD operations, webhook management, status testing
- **stores/users.ts**: User management with multi-platform ID mapping
- **stores/rules.ts**: Rule configuration with keyword matching and user assignments
- **stores/templates.ts**: Template management with Feishu card preview

### Key Technical Components

#### ConfigManager (`src/utils/config-manager.ts`)
- **Single Source of Truth**: Centralized localStorage-based data persistence
- **Version Management**: Handles configuration migration and compatibility
- **Import/Export**: Backup/restore functionality for all configuration data
- **Data Validation**: Ensures data integrity across all operations

#### Message Parser (`src/utils/message-parser.ts`)
- **Multi-Format Support**: Tencent CLS, Prometheus, Coding CI/CD, generic text
- **Standardization**: Converts all message formats to `StandardMessage` interface
- **Confidence Scoring**: Ranks parsing confidence for intelligent routing

#### Feishu Card System
- **Real-time Preview**: Live template preview with configurable styling
- **Color Themes**: Red (critical), Yellow (warning), Green (success), Blue (info)
- **Dynamic Content**: Template-based content generation with field substitution

## Important Implementation Details

### Element Plus Icons Management
- **No Global Registration**: Icons are imported per-component to avoid conflicts
- **Explicit Imports**: Each Vue component imports only the icons it uses from `@element-plus/icons-vue`
- **Example Pattern**:
```typescript
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
```

### Development Server Notes
- **Port Conflicts**: Development server may use ports 3000-3002 due to conflicts
- **Vite Cache**: If experiencing blank pages, clear Vite cache with `rm -rf node_modules/.vite`
- **Hot Reload**: All components support hot reload during development

### Data Persistence Strategy
- **localStorage Only**: Pure frontend solution with no backend dependencies
- **Auto-Save**: All configuration changes are automatically persisted
- **Demo Data**: Automatic initialization with demo data on first load
- **Recovery**: Import/export functionality for configuration backup/restore

### Component Architecture Patterns
- **Composition API**: All Vue components use `<script setup>` syntax
- **TypeScript**: Full TypeScript support with strict type checking
- **Element Plus**: Primary UI component library with custom theming
- **Reactive State**: Pinia stores with computed properties for derived data

### File Organization Conventions
- **Working Versions**: Files ending with `-working.vue` are currently functional versions
- **Simple Versions**: Files ending with `-simple.vue` are minimal implementations for troubleshooting
- **Component Files**: Dialog components in `/components/` directory with descriptive names
- **Store Files**: One store per domain (groups, users, rules, templates)

### Routing Structure
- **Layout-Based**: All routes wrapped in main layout component
- **Nested Routes**: Group detail pages nested under groups (`/groups/:id`)
- **Meta Information**: Route titles stored in meta field for breadcrumb navigation

## Critical Configuration Files

- **src/types/index.ts**: Complete TypeScript type definitions for all data models
- **src/utils/config-manager.ts**: Core data persistence and management logic
- **src/utils/init-demo-data.ts**: Automatic demo data initialization
- **src/router/index.ts**: Vue Router configuration with nested routes
- **vite.config.ts**: Vite build configuration with auto-imports

## Development Workflow

When working with this codebase:
1. **Check Component Dependencies**: Ensure all icons are properly imported per-component
2. **Use Working Versions**: Prefer `-working.vue` files when available
3. **Test Data Changes**: Verify data persistence through ConfigManager operations
4. **Validate Templates**: Use FeishuCardPreview component for template testing
5. **Multi-Platform Testing**: Test webhook configurations across different platforms

## Current Status

The application is in active development with all core functionality implemented. The development server runs on http://localhost:3002/ with a simplified layout component. All UI icons have been properly configured and the system supports full CRUD operations for groups, users, rules, and templates.