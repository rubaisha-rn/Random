# Aurex — AI-Powered Learning Management System

Live Deployment: https://aurex-clean-rxbc.vercel.app/

---

# Problem Statement

Traditional Learning Management Systems (LMS) usually provide the same learning experience to every student regardless of their background, learning speed, strengths, weaknesses, or goals. This creates several issues:

- Students get overwhelmed by advanced material too early
- Instructors struggle to identify struggling learners in time
- Learning paths are static instead of adaptive
- Students lack personalized guidance
- Course engagement and completion rates decrease

Aurex solves this problem by introducing AI-powered personalization into the LMS experience.

The platform dynamically adapts learning paths based on student onboarding data, quiz performance, learning pace, and career goals. It also helps instructors proactively identify at-risk students using AI-generated early warning alerts.

---

# Features

## AI Personalized Learning Paths

- Students complete an onboarding questionnaire
- AI analyzes:
  - academic background
  - career goals
  - experience level
  - preferred pace
  - learning style
- The system generates a personalized module roadmap
- Learning paths adapt dynamically after quiz performance

---

## AI Learning Assistant Chatbot

- Built-in AI chatbot for student support
- Answers Data Science and AI-related questions
- Provides practical and encouraging responses
- Uses contextual student information for personalization

---

## Adaptive Quiz System

- Quiz modules track:
  - scores
  - attempts
  - completion
- If a student scores below 60%:
  - the AI regenerates the learning path
  - weaker concepts are reinforced before progression

---

## Instructor AI Analytics Dashboard

- Instructors can:
  - monitor student performance
  - view progress statistics
  - analyze quiz attempts
  - track completion rates

### AI Early Warning Alerts

The AI detects students who may be struggling based on:
- low scores
- repeated failed attempts
- inactivity
- poor completion progress

The system also generates:
- risk level
- reasoning
- actionable instructor recommendations

---

## Role-Based System

The platform supports:
- Students
- Instructors
- Admins

Each role has a separate dashboard and permissions.

---

## Course Management

- Students can browse available courses
- Direct integration with atomcamp course pages
- "More Information" button redirects users to official atomcamp course links

---

## Authentication System

- Secure login and registration using Supabase Auth
- Email/password authentication
- Session persistence

---

# Tech Stack

## Frontend

- React
- Vite
- React Router
- CSS

---

## Backend / APIs

- Vercel Serverless Functions
- REST-style API routes

---

## Database & Authentication

- Supabase
- PostgreSQL
- Supabase Auth

---

## AI Integration

- Gorq API
- Structured JSON prompting

---

## Deployment

- Vercel

Deployment Link:

https://aurex-orcin.vercel.app/

---

# Steps to Run Project

## Running deployed project

The project is deployed on Vercel and runs live at the link:

https://aurex-orcin.vercel.app/

## Running project locally


### 1. Clone the Repository

```bash
git clone <repository-url>
```

---

### 2. Open Project Folder

```bash
cd autocamp-lms
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Configure Environment Variables

Create a `.env` file in the root directory.

Add:

```env
Variables
```
Please note: The secret keys could not be uploaded to GitHub as it violated their privacy laws. It has been provided in the folder. 

---

### 5. Run Development Server

```bash
npm run dev
```

Open:

```txt
http://localhost:5173
```

---

## Production Deployment

The project is deployed on Vercel:

https://aurex-orcin.vercel.app/

---

# Database Tables Used

The project uses the following Supabase tables:

- profiles
- student_profiles
- courses
- modules
- quiz_questions
- progress
- learning_paths
- enrollments

---

# AI Modules

## `/api/ai-path`

Generates personalized learning paths.

---

## `/api/ai-chat`

Handles AI chatbot responses.

---

## `/api/ai-alerts`

Generates AI-powered instructor alerts for struggling students.

---

# Future Improvements

- Real-time notifications
- AI-generated weekly student reports
- Email intervention alerts
- Certificate generation
- Video lesson integration
- Rich analytics charts
- AI-generated study recommendations
- Live classroom integration

---

# Team Members

- Rubaisha Nadeem
- Dina Khan
- Hamza Ahmad

---

# Project Vision

Aurex aims to transform online education from a static one-size-fits-all system into an intelligent adaptive learning ecosystem that personalizes education for every learner while empowering instructors with AI-driven insights.