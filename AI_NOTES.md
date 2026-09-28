# AI_NOTES.md

## AI Tools Used

I used two AI tools during this project:

- ChatGPT
- Cursor

## How I Used AI

I first uploaded the project task document to ChatGPT to understand the requirements clearly.

ChatGPT helped me:
- understand the task
- create the overall implementation plan
- design the application architecture
- plan the UI structure
- split the project into smaller implementation sections

The project was divided into sections such as:
- Authentication
- Workspace management
- Document upload
- Document processing
- AI integration
- Embeddings
- RAG retrieval
- RAG answer generation
- Chat integration
- Tool calling

For each section, I first discussed the implementation approach with ChatGPT.

Then I asked ChatGPT to prepare a focused implementation prompt.

I provided that prompt to Cursor, and Cursor implemented the code.

For the UI, I first created the UI structure and architecture with ChatGPT, then gave that plan to Cursor to implement the frontend.

I also provided the original project requirement document to both ChatGPT and Cursor so that they had the correct project context.

## Key Technical Decisions

### 1. Shared Vector Store

I used one shared `document_chunks` table for all workspaces.

Each chunk contains a `workspace_id`, and workspace filtering is applied inside the vector search query itself.

This was important because strict workspace isolation is one of the main requirements of the project.

### 2. Server-Side Workspace Resolution

The client never directly controls the workspace ID used for secure operations.

The active workspace is resolved and validated on the server before document upload, retrieval, or other workspace-specific operations.

### 3. Document Processing Pipeline

I used the following pipeline:

Upload → Extract Text → Chunk → Generate Embeddings → Store in pgvector → Retrieve → Generate RAG Answer

The ingestion flow was also designed to be idempotent so duplicate processing does not create duplicate chunks.

## AI Mistake / Wrong Turn

One issue during development was that AI-generated implementations sometimes tried to add too much functionality at once or suggested solutions that were more complex than required.

I noticed this when the implementation started becoming difficult to verify step by step.

To fix this, I changed the workflow and split the project into smaller sections.

Each feature was then planned, implemented, and tested separately before moving to the next one.

This made it easier to understand the code and identify problems.

## What I Would Improve With More Time

With more time, I would improve:

- citation accuracy so only the exact supporting chunks are shown
- streaming AI responses
- better tool-calling workflows
- more automated security and workspace-isolation tests
- better observability for latency, token usage, and retrieval results