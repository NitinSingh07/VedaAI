# VedaAI – AI Assessment Creator

A full-stack application that allows teachers to create AI-powered question papers.

## Architecture

```
VedaAI/
├── backend/          Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/   MongoDB + Redis setup
│   │   ├── models/   Assignment + QuestionPaper (Mongoose)
│   │   ├── queues/   BullMQ queue definition
│   │   ├── routes/   REST API endpoints
│   │   ├── services/ WebSocket + AI (Claude) service
│   │   ├── workers/  BullMQ background worker
│   │   └── index.ts  Express server entry
└── frontend/         Next.js 14 + TypeScript
    └── src/
        ├── app/      Pages (dashboard, create, result, history)
        ├── components/  Sidebar, QuestionTypeSelector, etc.
        ├── hooks/    useWebSocket
        ├── store/    Zustand store
        └── types/    TypeScript interfaces
```

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- Anthropic API key

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm run dev           # Start API server (port 5000)
npm run worker        # Start BullMQ worker (separate terminal)
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev           # Start Next.js (port 3000)
```

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
```

## Flow

1. Teacher fills out assignment form (subject, grade, question types, marks)
2. Frontend submits to `POST /api/assignments`
3. Backend creates MongoDB record + adds BullMQ job
4. Worker picks up job → calls Claude AI → parses structured response
5. Stores QuestionPaper in MongoDB → Redis pub/sub notification
6. WebSocket forwards notification to frontend
7. Frontend navigates to result page showing structured question paper
8. Teacher can download as PDF or regenerate

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/assignments | Create assignment + start generation |
| GET | /api/assignments | List all assignments |
| GET | /api/assignments/:id | Get assignment details |
| GET | /api/assignments/:id/status | Get generation status |
| GET | /api/assignments/:id/paper | Get generated question paper |
| POST | /api/assignments/:id/regenerate | Regenerate question paper |

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand, WebSocket
- **Backend**: Node.js, Express, TypeScript, WebSocket (ws)
- **Database**: MongoDB (Mongoose)
- **Cache/Queue**: Redis, BullMQ
- **AI**: Anthropic Claude (claude-sonnet-4-6)
