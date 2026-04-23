

# 📌 Profile Aggregation API

A backend service that accepts a name, aggregates data from external APIs (**Genderize, Agify, Nationalize**), processes the result, and stores it in a database with proper validation, idempotency, and error handling.

---

## 🚀 Features

* Accepts user name via `POST /api/profiles`
* Fetches data from:

  * Gender prediction API
  * Age prediction API
  * Nationality prediction API
* Aggregates and transforms responses
* Classifies age into groups
* Stores result in database
* Ensures **idempotency** (no duplicate names)
* Handles edge cases and validation properly
* Uses **UUID v7** for IDs
* Uses **UTC ISO 8601 timestamps**
* Global error handling with `express-async-errors`
* Standardized HTTP responses with `http-status-codes`
* CORS enabled (`Access-Control-Allow-Origin: *`)

---

## 🛠️ Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* Axios
* UUID
* express-async-errors
* http-status-codes
* CORS

---

## 📂 Project Structure

```
project/
│
├── controllers/
│   └── profileController.js
│
├── models/
│   └── Profile.js
│
├── routes/
│   └── profileRoutes.js
│
├── utils/
│   ├── fetchApis.js
│   └── classifyAge.js
│
├── app.js
├── server.js
└── README.md
```

---

## ⚙️ Installation

```bash
# Clone the repo
git clone <https://github.com/Onileola14/task-one.git>

# Navigate into project
cd project

# Install dependencies
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

Seed your database with the 2026 profiles from this file: link <https://drive.google.com/file/d/1Up06dcS9OfUEnDj_u6OV_xTRntupFhPH/view>

Re-running the seed should not create duplicate records.
---

## ▶️ Running the Server

```bash
npm start
```

Server will run on:

```
http://localhost:5000
```

---

## 📡 API Endpoint

### ➤ Create Profile

**POST** `/api/profiles`

### Request Body

```json
{
  "name": "ella"
}
```

---

## ✅ Success Response

```json
{
  "status": "success",
  "data": {
    "id": "b3f9c1e2-7d4a-4c91-9c2a-1f0a8e5b6d12",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "DRC",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

---

## 🔁 Idempotency Behavior

If the same name is submitted again:

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { ...existing profile }
}
```

---

## ❌ Error Handling

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error message here"
}
```

---

## ⚠️ Validation Rules

| Condition             | Status Code | Message               |
| --------------------- | ----------- | --------------------- |
| Missing or empty name | 400         | Name is required      |
| Name is not a string  | 422         | Name must be a string |

---

## 🚨 Edge Cases

| Scenario                    | Response |
| --------------------------- | -------- |
| Gender is null or count = 0 | 404      |
| Age is null                 | 404      |
| No country data             | 404      |

---

## 🧠 Processing Logic

* **Genderize**

  * Extract: `gender`, `probability`, `count → sample_size`

* **Agify**

  * Extract: `age`
  * Classify:

    * 0–12 → child
    * 13–19 → teenager
    * 20–59 → adult
    * 60+ → senior

* **Nationalize**

  * Select country with highest probability

---

## 🧩 Middleware & Utilities

* `express-async-errors` → handles async errors globally
* `http-status-codes` → cleaner status code usage
* `cors` → allows public API access
* Custom utilities:

  * API aggregation
  * Age classification

---

## 📌 Important Notes

* All timestamps are in **UTC (ISO 8601 format)**
* IDs are generated using **UUID v7**
* Duplicate names are prevented (unique constraint)
* API responses strictly follow the required structure

---

## 💡 Possible Improvements

* Add Redis caching for API responses
* Add rate limiting
* Add request logging (Winston/Morgan)
* Add unit & integration tests
* Dockerize the application

---

## 👨‍💻 Author

**Salami Tunde Onileola**
Backend Developer | Node.js Engineer
