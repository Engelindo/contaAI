# 💰ContaAI

An AI-powered personal finance assistant that processes natural language expense inputs and stores them in a structured database.

Users can send messages like:

```
mercado 130 ontem
uber 45
quanto gastei esse mês?
```

And the system will:

- Extract structured financial data using AI
- Store it in a PostgreSQL database
- Provide summaries and insights

---

## 🚀 Tech Stack

- **Backend:** Node.js + TypeScript
- **AI:** OpenAI
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Dev Runner:** tsx

---

## 🧠 How It Works

```
User Message
     ↓
Webhook (Express)
     ↓
AI (parses intent + expense data)
     ↓
Prisma (stores or queries DB)
     ↓
Response returned
```

---

## 📦 Project Structure

```
src/
  server.ts           # App entry point
  routes/
    webhook.ts        # Main endpoint
  ai/
    parseExpense.ts   # AI parsing logic
  db/
    prisma.ts         # Prisma client
  config/
    env.ts            # Environment config
```

---

## ⚙️ Setup Instructions

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd finance-ai-bot
```

---

### 2. Install dependencies

```bash
npm install
```

---

### 3. Create `.env` file

```env
PORT=3000
OPENAI_API_KEY=your_openai_key
DATABASE_URL=your_supabase_postgres_url
```

---

### 4. Initialize Prisma

```bash
npx prisma generate
npx prisma db push
```

---

### 5. Start the server

```bash
npm run dev
```

---

## 🧪 Testing the API

Send a test request:

```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":"mercado 120 ontem"}'
```

---

## 📊 Supported Features

### ✅ Add Expense

```
"ifood 45"
"uber 30 ontem"
```

---

### 📈 Get Summary

```
"quanto gastei esse mês?"
```

---

## 🧩 AI Behavior

The AI:

- Extracts structured data from natural language
- Classifies intent (`add_expense`, `get_summary`)
- Uses a fixed set of categories:
  - FOOD
  - TRANSPORT
  - HOUSING
  - ENTERTAINMENT
  - HEALTH
  - OTHER

---

## 🗄️ Database Schema

```prisma
model Expense {
  id          String   @id @default(cuid())
  amount      Float
  category    String
  description String?
  date        DateTime
  createdAt   DateTime @default(now())
}
```

---

## 🔐 Notes on Security

- Row Level Security (RLS) is not yet enabled
- Future versions will include:
  - user isolation (via phone number)
  - secure access policies

---

## 🚀 Future Improvements

- WhatsApp integration (via WhatsApp Business Platform)
- Multi-user support
- Budget tracking
- Receipt image processing
- Voice input support

