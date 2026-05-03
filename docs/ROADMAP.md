# 📌 Finance AI Bot — Development Roadmap

This document tracks the planned evolution of the project from MVP → production-ready system.

---

# 🧭 Guiding Principles

- Backend logic is **deterministic**
- AI is used for **interpretation, not control**
- Database schema is **strict and controlled**
- Features are built in **layers (foundation → intelligence → integration)**

---

# 🚀 Phase 1 — Core Product (MVP Completion)

## 4. Natural Language Responses

Convert structured output into user-friendly responses:

Example:

> “Você gastou R$500 este mês.  
> Maior categoria: alimentação (R$300)”

---

# 🧱 Phase 2 — Data Model Stabilization

## 5. Finalize Database Schema

Entities:

### User

- id
- phoneNumber
- createdAt

### Expense

- id
- userId
- amount
- category
- subcategory (optional)
- description
- date
- createdAt

---

## 6. Subcategories

- Store raw classification (e.g. "Uber", "iFood")
- Keep main category fixed

Enables:

- “quanto gastei com uber?”

---

# 💳 Phase 3 — Financial Intelligence

## 7. Card System

### Card Model

- id
- userId
- name
- limit
- closingDay
- dueDay

### Features

- Link expenses to cards
- Track spending per card

---

## 8. Card Limit Tracking

- Compute total spent per card
- Compute remaining balance

Example:

> “Você ainda tem R$500 disponível no Nubank”

---

## 9. Budget System

### CategoryBudget Model

- id
- userId
- category
- monthlyLimit

---

## 10. Budget Warnings

Trigger when:

- user reaches ~80% of:
    - card limit
    - category budget

Rules:

- Backend computes thresholds
- AI generates explanation

Example:

> “Você já usou 85% do seu limite em alimentação”

---

# 🤖 Phase 4 — AI Improvements

## 11. Improved Prompt Design

- Strict JSON output
- Fixed categories
- Card awareness
- Intent classification

---

## 12. Context-Aware Responses

Pass into LLM:

- totals
- category breakdown
- remaining budget

Goal:

- smarter, more helpful responses

---

# 🌐 Phase 5 — Deployment & Integration

## 13. Deploy Backend

- Deploy to Render
- Configure environment variables
- Expose public endpoint

---

## 14. WhatsApp Integration

- Receive messages via webhook
- Send responses
- Map phone → user

---

# 🧠 Phase 6 — Multi-user & Scaling

## 15. User System

- Each user has:
    - expenses
    - cards
    - budgets

---

## 16. Data Isolation

- Ensure queries are user-scoped
- Prepare for future RLS usage

---

# 📊 Phase 7 — Advanced Features

## 17. Custom Categories (Optional)

- Allow user-defined labels
- Map to base categories

---

## 18. Advanced Insights

- Weekly reports
- Spending trends
- Category analysis

---

# ⚠️ Key Constraints

- LLM must NOT:
    - create categories
    - define schema
    - control business logic

- Backend MUST:
    - validate all inputs
    - control data integrity
    - compute financial truth

---

# 🧭 Recommended Next Step

👉 Implement **Natural Language Summary Responses**

Reason:

- Low effort
- High user impact
- Makes the system feel “alive”

---

# 🧠 Long-Term Vision

A conversational financial assistant that:

- understands natural input
- tracks structured financial data
- provides proactive insights
- integrates directly with messaging platforms
