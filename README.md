# Recuro

Recuro is a backend-focused subscription and billing management system built for the **Odoo × SNS Hackathon ’26**.

It provides secure authentication, role-based access control, and core subscription workflows such as plans, subscriptions, invoices, and payments, designed with real-world production practices in mind.

---

## Tech Stack

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- bcrypt (password hashing)
- Session-based authentication
- Swagger (API documentation)

### Database
- Normalized relational schema
- PostgreSQL triggers for invoice & subscription number generation
- Database views for billing metrics
- Strong foreign key constraints and indexes

### Infrastructure
- Ubuntu Server (self-hosted)
- NGINX (reverse proxy)
- PM2 (process manager)

---

Built for **Odoo × SNS Hackathon ’26**.
