# ASS UI Stock

A stock market analysis and trading assistant UI, built with Next.js and LangGraph.

## Project Structure

- `frontend/`: Next.js based frontend application
- `backend/`: LangGraph based backend service

## Setup

### Prerequisites

- Node.js
- pnpm
- Git

### Installation

1. Clone the repository:
```bash
git clone git@github.com:xiaomayi-ant/ass-ui-stock.git
cd ass-ui-stock
```

2. Install dependencies:
```bash
pnpm install
```

### Configuration

1. Backend Configuration (./backend/.env):
```bash
FINANCIAL_DATASETS_API_KEY=YOUR_API_KEY
TAVILY_API_KEY=YOUR_API_KEY
OPENAI_API_KEY=YOUR_API_KEY
```

2. Frontend Configuration (./frontend/.env):
```bash
LANGGRAPH_API_URL=http://localhost:51497
NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID=stockbroker
```

### Running the Application

1. Start the backend:
```bash
cd backend
npm run start
```

2. Start the frontend:
```bash
cd frontend
npm run dev
```

The frontend will be available at http://localhost:3000 and the backend at http://localhost:51497.

## License

MIT
