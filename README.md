# TheSimGov

A comprehensive government and business simulation MMO built with Next.js 16, React 18, and TypeScript.

## Overview

TheSimGov is a multiplayer simulation game where players manage businesses, participate in politics, and interact in a dynamic economy. The game features:

- **Company Management**: Build and operate companies across multiple industries (Energy, Media, Technology, Finance, R&D)
- **Political System**: Run for office, vote on bills, manage government departments
- **Employee Marketplace**: Hire employees, manage training, and optimize workforce
- **Real Estate**: Purchase and develop properties
- **Media Ecosystem**: Create content, build audiences, manage monetization
- **Social Features**: Clans, chat, endorsements, and player interactions

## Tech Stack

- **Framework**: Next.js 16 with App Router and Turbopack
- **UI**: React 18, HeroUI components, Tailwind CSS
- **Authentication**: NextAuth.js with credentials provider
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for live updates
- **TypeScript**: Strict type checking throughout

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB instance (local or cloud)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and NextAuth secret

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start playing.

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

- `/src/app` - Next.js app router pages and layouts
- `/src/components` - Reusable React components
- `/src/lib/db` - Database models and utilities
- `/src/services` - Business logic and API services
- `/dev` - Development tracking and documentation
- `/docs` - Technical documentation

## Development

This project follows AAA quality standards with comprehensive documentation, type safety, and testing requirements. See `/dev/README.md` for development guidelines and tracking.

## License

Proprietary - All rights reserved
