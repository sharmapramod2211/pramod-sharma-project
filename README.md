# pramod-sharma-project 

# ✈️ Flight Booking System

A full-stack flight booking application that allows users to search for flights, select seats, add passenger details, book tickets, make online payments, view bookings, and manage cancellations. This project uses **Angular** for the frontend, **Node.js (Express)** for the backend, and **PostgreSQL** as the database.

---

## 🚀 Features

- 🔐 **User Registration & Login** with OTP Email Verification  
- 📍 **Search Flights** by Source & Destination Cities with Date Filter  
- 🛫 **Flight Selection** from available options  
- 💺 **Seat Selection** with real-time seat status  
- 👤 **Passenger Details** form for each seat selected  
- 🧾 **Booking Confirmation** with auto-generated total fare and GST  
- 💳 **Online Payment Only** (no cash mode supported)  
- 🔁 **Update or Cancel Latest Booking**  
- 📂 **View Past and Current Bookings**

---

## 🛠️ Tech Stack

### 🔷 Frontend
- [Angular](https://angular.io/) (v15+)
- Bootstrap / CSS for styling
- Template-driven forms

### 🔶 Backend
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- Nodemailer (for OTP email)
- JWT (Authentication)

### 🔧 Tools
- [Postman](https://www.postman.com/) – for testing APIs
- Local development using:
  - Frontend: `http://localhost:4200`
  - Backend: `http://localhost:5000`

---

---

## 🔄 Booking Flow (Frontend UI)

1. ✅ **User Registration/Login** (with OTP verification)
2. 🔍 **Search Flights** by selecting:
   - Source city
   - Destination city
   - Date
3. 🛬 **Select a Flight**
4. 🪑 **Choose one or multiple seats**
5. ✍️ **Enter Passenger Details** for each seat
6. 📦 **Confirm Booking** – backend stores booking, seat status, and passenger details
7. 💳 **Make Payment** – online mode only
8. 🧾 **Booking Receipt** is generated
9. 🔁 **User Dashboard**:
   - View **current** or **past** bookings
   - **Cancel** or **Update** the latest trip if needed

---

## 🧪 API Testing (with Postman)

- Base URL: `http://localhost:5000/v1/api/`
- Use JWT token in `Authorization` header
- Available endpoints:
  - `/register` – Register user
  - `/verify-otp` – Verify email OTP
  - `/login` – Login with JWT token
  - `/flight/search` – Search available flights
  - `/booking/create` – Book flight
  - `/booking/update` – Update latest booking
  - `/booking/cancel` – Cancel latest booking
  - `/booking/user` – Get all bookings of user

---

## 💻 Setup Instructions

### 🔹 How to Start

```bash
### 🔹 Backend
cd backend
npm install
npm run dev

### 🔹 Frontend

cd frontend
npm install
ng serve


🧱 Database
PostgreSQL schema includes:

users, airplanes, flight_schedules, cities, seats, bookings, booking_details, payments

Add your database credentials in backend config

Sample data for cities and airplanes should be inserted manually or via seed scripts

📌 Notes
OTP is valid for 30 minutes

Payment must be completed after booking – no cash option

Canceled bookings are not deleted but marked with refund status

Seat status is updated live on booking and reset on cancellation

🧑‍💻 Author
Pramod Sharma
Master’s Student @ DA-IICT | BCA Graduate 
