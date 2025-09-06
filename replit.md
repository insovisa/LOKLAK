# KsaekVat Discord Bot

## Overview

KsaekVat is a Discord bot built with Discord.js v14 that provides economy, gambling, animal collection, and social interaction features. The bot uses a JSON-based file system for data persistence and includes multiple command categories with various interaction mechanics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Framework**: Node.js with Discord.js v14
- **Data Storage**: JSON file-based system for user data and animal collections
- **Process Management**: Single instance prevention using PID files
- **Logging**: Custom file-based logging system with rotation by date
- **Task Scheduling**: Node-cron for periodic tasks

### Command System
- **Modular Architecture**: Commands organized in category-based folders
- **Dynamic Loading**: Recursive command loading from subdirectories
- **Prefix System**: Multiple prefix support (K, k) and short aliases (h, cf, s, etc.)
- **Cooldown Management**: In-memory cooldown system for rate limiting
- **Permission System**: Admin-only commands with configurable admin IDs

### Event System
- **Event Handlers**: Separate event files for Discord.js events
- **Message Processing**: Custom message parsing for commands and prefixes
- **Error Handling**: Comprehensive error catching and logging

## Key Components

### Data Management
- **Database Module**: JSON file operations for user data persistence
- **User Profiles**: Balance, experience, level, animals, boosters, and statistics
- **Animal System**: Multi-rarity animal collection with values and hunting mechanics

### Economy System
- **Currency**: Riel-based economy with configurable currency symbol
- **Rewards**: Daily and weekly reward claiming with cooldowns
- **Work System**: Various job scenarios with randomized rewards
- **Payment System**: User-to-user money transfers

### Gambling Features
- **Coinflip**: Head/tails betting with 2x multiplier
- **Slots**: Multi-tier slot machine with various payout rates
- **Dice**: Number guessing game with 6x multiplier for exact matches

### Animal Collection
- **Hunting System**: 7-rarity tier animal collection (common to priceless)
- **Random Events**: Distraction scenarios during hunting
- **Zoo System**: Collection viewing with rarity statistics and values

### Social Interactions
- **Expression Commands**: Action-based roleplay commands (kiss, hug, slap, etc.)
- **Animal Images**: API integration for cat, dog, and fox images
- **Battle System**: PvP dueling and NPC fighting with betting

## Data Flow

### User Data Structure
```json
{
  "userId": {
    "balance": 0,
    "experience": 0,
    "level": 1,
    "animals": {},
    "boosters": [],
    "lastDaily": null,
    "lastWeekly": null,
    "joinedAt": timestamp,
    "stats": {}
  }
}
```

### Command Processing Flow
1. Message received and filtered for bot messages
2. Prefix validation (main prefixes or short aliases)
3. Command name extraction and argument parsing
4. Command lookup in collections
5. Permission and cooldown checks
6. Command execution with error handling
7. Response generation and logging

### Animal Hunting Mechanics
- 30% chance of distraction (no reward)
- 70% chance of successful hunt with rarity-based probability
- Exponentially decreasing chances for higher rarities
- Value-based rewards and collection tracking

## External Dependencies

### NPM Packages
- **discord.js**: Discord API wrapper and bot framework
- **node-cron**: Task scheduling for periodic operations

### External APIs
- **Tenor API**: GIF fetching for expression commands (kiss, slap, pat, etc.)
- **TheCatAPI**: Random cat image fetching
- **Dog CEO API**: Random dog image fetching  
- **RandomFox API**: Random fox image fetching

### Configuration Management
- Environment variable support for sensitive data (Discord token, Google/Tenor API key)
- Configurable economy parameters and gambling limits
- Admin permission system with ID-based access control

## Deployment Strategy

### Single Instance Management
- PID file-based instance prevention
- Graceful shutdown handling with cleanup
- Process signal handling (SIGINT, SIGTERM)

### File Structure
- Modular command organization by category
- Separate utility modules for reusable functionality
- Data directory for JSON persistence
- Logs directory for debugging and monitoring

### Error Handling
- Comprehensive try-catch blocks in all command handlers
- Custom logger with multiple severity levels
- File-based error logging with stack traces
- User-friendly error messages in Discord embeds

### Performance Considerations
- In-memory cooldown management for speed
- JSON file operations with error recovery
- Command collection caching for fast lookups
- Minimal API calls with fallback handling