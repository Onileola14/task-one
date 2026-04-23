# 📌 Profile Aggregation & Intelligence Query API

A backend service that aggregates user profile data from external APIs (**Genderize, Agify, Nationalize**) and exposes a powerful **query engine** for filtering, sorting, pagination, and natural language search.

---

## 🚀 Features

### 🔹 Data Aggregation

* Accepts user name via `POST /api/profiles`
* Fetches data from:

  * Gender prediction API
  * Age prediction API
  * Nationality prediction API
* Aggregates and transforms responses
* Classifies age into groups
* Stores result in database
* Ensures **idempotency** (no duplicate names)

---

### 🔹 Query Engine (Core Feature)

#### 1. Advanced Filtering

Supports:

* `gender`
* `age_group`
* `country_id`
* `min_age`, `max_age`
* `min_gender_probability`
* `min_country_probability`

Example:

```
GET /api/profiles?gender=male&country_id=NG&min_age=25
```

---

#### 2. Sorting

Supports:

* `age`
* `created_at`
* `gender_probability`

Example:

```
GET /api/profiles?sort_by=age&order=desc
```

---

#### 3. Pagination

* `page` (default: 1)
* `limit` (default: 10, max: 50)

Example:

```
GET /api/profiles?page=2&limit=20
```

Response format:

```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": [ ... ]
}
```

---

#### 4. Natural Language Search (🔥 Core Feature)

**Endpoint:**

```
GET /api/profiles/search?q=
```

Examples:

```
/api/profiles/search?q=young males
/api/profiles/search?q=females above 30
/api/profiles/search?q=people from nigeria
/api/profiles/search?q=adult males from kenya
/api/profiles/search?q=male and female teenagers above 17
```

💡 The system converts plain English queries into database filters.

---

## 🛠️ Tech Stack

* Node.js
* Express.js
* MongoDB (Mongoose)
* Axios
* UUID v7
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
git clone https://github.com/Onileola14/task-one.git
cd task-one
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file:

```
MONGO_URI=your_mongodb_connection_string
PORT=5000
```

---

## 🌱 Data Seeding

Seed your database with the 2026 profiles:

```
https://drive.google.com/file/d/1Up06dcS9OfUEnDj_u6OV_xTRntupFhPH/view
```

Re-running the seed will not create duplicate records.

---

## ▶️ Running the Server

```bash
npm start
```

Server runs on:

```
http://localhost:5000
```

---

## 📡 API Endpoints

### ➤ Create Profile

**POST** `/api/profiles`

```json
{
  "name": "ella"
}
```

---

### ➤ Get All Profiles

**GET** `/api/profiles`

Supports filtering, sorting, and pagination.

---

### ➤ Natural Language Search

**GET** `/api/profiles/search?q=`

---

### ➤ Get Single Profile

**GET** `/api/profiles/:id`

---

### ➤ Delete Profile

**DELETE** `/api/profiles/:id`

---

## 🔁 Idempotency Behavior

Submitting the same name twice:

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { ... }
}
```

---

## ❌ Error Handling

All errors follow:

```json
{
  "status": "error",
  "message": "Error message here"
}
```

---

## ⚠️ Validation Rules

| Condition            | Status Code |
| -------------------- | ----------- |
| Missing name         | 400         |
| Invalid type         | 400         |
| Invalid query params | 422         |

---

## 🧠 Processing Logic

### Genderize

* Extract: `gender`, `probability`, `count`

### Agify

* Extract: `age`
* Classification:

  * 0–12 → child
  * 13–19 → teenager
  * 20–59 → adult
  * 60+ → senior

### Nationalize

* Select country with highest probability

---

## 📌 Important Notes

* All timestamps use **UTC**
* IDs use **UUID v7**
* Duplicate names are prevented
* Filtering conditions are **combined (AND logic)**

---

## 💡 Possible Improvements

* Redis caching
* Rate limiting
* Logging (Winston/Morgan)
* Unit & integration tests
* Docker support

---

## 👨‍💻 Author

**Salami Tunde Onileola**
Backend Developer | Node.js Engineer
