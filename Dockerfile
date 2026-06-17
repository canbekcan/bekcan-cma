FROM node:18-slim

WORKDIR /app

# Copy backend package.json
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm install

# Copy frontend and backend code
COPY frontend ./frontend
COPY backend ./backend

# Set the working directory to backend to run the server
WORKDIR /app/backend

EXPOSE 4000

CMD ["node", "server.js"]
