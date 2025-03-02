# Conference Transcription App with SQLite

This application provides a real-time transcription system for conferences with speaker management, Q&A capabilities, and summarization powered by Amazon Transcribe and Gemini AI.

## Features

- **Real-time transcription** using Amazon Transcribe Streaming API
- **Speaker management** to track who is speaking
- **SQLite database** for persistent storage of all data
- **Q&A system** for audience to submit questions
- **AI-powered summarization** via Gemini API
- **Multi-language support**
- **Admin interface** for managing speakers, conference details, and Q&A

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the application (both frontend and backend):
   ```
   npm start
   ```

   This will start:
   - The SQLite backend server on port 3000
   - The frontend webpack dev server on port 8080

3. Open the application:
   - Main audience view: http://localhost:8080
   - Admin interface: http://localhost:8080/admin.html

## Architecture

The application consists of:

1. **Frontend**:
   - Built with vanilla JavaScript
   - Webpack for bundling
   - Real-time transcription UI
   - Speaker gallery
   - Question submission form

2. **Backend**:
   - Express.js server
   - SQLite database for persistent storage
   - RESTful API endpoints for data management

3. **Database**:
   - SQLite database with tables for:
     - Speakers
     - Transcriptions
     - Questions
     - Conference settings

## Data Management

All data is stored in SQLite for persistence. The admin interface includes a "Reset All Data" button that allows you to clear all speakers, transcriptions, and questions from the database.

## API Endpoints

### Speakers
- `GET /api/speakers` - Get all speakers
- `POST /api/speakers` - Add a new speaker
- `PUT /api/speakers/:id` - Update a speaker
- `DELETE /api/speakers/:id` - Delete a speaker

### Transcriptions
- `GET /api/transcriptions` - Get all transcriptions
- `GET /api/transcriptions/speaker/:speakerId` - Get transcriptions for a specific speaker
- `POST /api/transcriptions` - Add a new transcription

### Questions
- `GET /api/questions` - Get all questions
- `POST /api/questions` - Add a new question
- `PUT /api/questions/:id/answer` - Answer a question
- `PUT /api/questions/:id/skip` - Skip a question

### Conference Settings
- `GET /api/settings` - Get conference settings
- `PATCH /api/settings` - Update conference settings

### Reset Data
- `POST /api/reset` - Reset all data in the database

## License

This sample code is made available under the MIT-0 license. See the LICENSE file.
