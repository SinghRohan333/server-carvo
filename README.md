<div align="center">

# CARVÕ Server

### REST API for a premium car rental platform

![Node.js](https://img.shields.io/badge/Node.js-26.4.0-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.2.1-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Native%20Driver-47A248?style=flat&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)

</div>

---

## About

CARVÕ Server is the backend powering **CARVÕ — DriveFleet**, a premium car rental platform. It's a REST API built on Express and the native MongoDB driver, handling car listings, user-owned car management, and a booking system — with JWT-protected routes guarding any action tied to a specific user.

> 🔗 **Live API:** [carvo-server.vercel.app](https://server-carvo.vercel.app)

This API is consumed by the [CARVÕ client](https://carvo-kappa.vercel.app) (Next.js frontend) — see that repository for the full-stack picture.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Data Models](#data-models)
- [Known Limitations & Roadmap](#known-limitations--roadmap)
- [Author](#author)
- [License](#license)

---

## Features

- 🚗 **Car listings** — fetch all cars or a single car by ID, ready for public browsing
- 🔐 **JWT-protected ownership routes** — adding, editing, and deleting a car is restricted to its verified owner
- 📋 **My Added Cars** — fetch only the cars a logged-in user has personally listed
- 📅 **Booking system** — create bookings, automatically computing total price from daily rate × number of days
- 📈 **Booking count tracking** — each car tracks how many active bookings it has, updated atomically with MongoDB's `$inc`
- 📜 **My Bookings** — fetch a logged-in user's booking history
- ❌ **Cancel bookings** — deletes a booking and decrements the associated car's booking count to stay in sync

---

## Tech Stack

| Technology                          | Purpose                                                 |
| ----------------------------------- | ------------------------------------------------------- |
| **Node.js** (v26.4.0)               | Runtime                                                 |
| **Express** (^5.2.1)                | Web framework / routing                                 |
| **MongoDB** (^7.3.0, native driver) | Database — no ORM/ODM, raw driver queries               |
| **jose-cjs** (^6.2.3)               | JWT signing & verification                              |
| **cors** (^2.8.6)                   | Cross-origin request handling between client and server |

> **Note:** This project uses the **native MongoDB driver**, not Mongoose. Collections are queried directly (`.find()`, `.insertOne()`, `.updateOne()`, etc.) rather than through a schema/model abstraction.

---

## Project Structure

```
carvo-server/
├── public/             # Static assets
├── index.js            # App entry point — server setup and all route definitions
├── .env                # Environment variables (not committed)
├── .gitignore
├── package.json
└── package-lock.json
```

---

## API Endpoints

### Cars

| Method   | Endpoint        | Description                                                        | Auth Required |
| -------- | --------------- | ------------------------------------------------------------------ | :-----------: |
| `GET`    | `/cars`         | Get all cars (supports `search`, `type`, `featured` query filters) |      No       |
| `GET`    | `/cars/my-cars` | Get cars added by the logged-in user                               |    **Yes**    |
| `GET`    | `/cars/:id`     | Get a single car by ID                                             |    **Yes**    |
| `POST`   | `/cars`         | Add a new car                                                      |    **Yes**    |
| `PATCH`  | `/cars/:id`     | Update an existing car (owner only)                                |    **Yes**    |
| `DELETE` | `/cars/:id`     | Delete a car (owner only)                                          |    **Yes**    |

### Bookings

| Method   | Endpoint        | Description                       | Auth Required |
| -------- | --------------- | --------------------------------- | :-----------: |
| `POST`   | `/bookings`     | Create a new booking for a car    |    **Yes**    |
| `GET`    | `/bookings/my`  | Get the logged-in user's bookings |    **Yes**    |
| `DELETE` | `/bookings/:id` | Cancel a booking (owner only)     |    **Yes**    |

> `GET /cars/:id` is intentionally protected — Car Details pages are only viewable by logged-in users, by design choice.

---

## Authentication

Routes marked **Auth Required** are protected by JWT verification logic in `index.js`. A valid token must be sent with the request (typically as an `Authorization: Bearer <token>` header), and the server verifies it using `jose-cjs` before allowing the request to proceed.

On protected routes, the server identifies _who_ is making the request from the verified token, rather than trusting any user-identifying field the client might otherwise send — preventing one user from impersonating another by manipulating request data.

`GET /cars/:id` is intentionally included among the protected routes — Car Details pages are only viewable by logged-in users, by design.

---

## Environment Variables

Create a `.env` file in the project root with the following:

```env
PORT=
CLIENT_URL=
MONGODB_URI=
```

| Variable      | Description                                             |
| ------------- | ------------------------------------------------------- |
| `PORT`        | Port the Express server listens on                      |
| `CLIENT_URL`  | Origin of the frontend app, used for CORS configuration |
| `MONGODB_URI` | MongoDB connection string                               |

> Never commit your actual `.env` file. This table documents variable **names** only.

---

## Getting Started

### Prerequisites

- Node.js (v26.4.0 or compatible)
- A MongoDB instance (local or Atlas)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>

# Install dependencies
npm install

# Set up environment variables
# Create a .env file in the project root (see Environment Variables section above)

# Run the server
npm start
```

The API will be available at `http://localhost:<PORT>`.

---

## Data Models

### Car

```js
{
  ownerId: String,
  carName: String,
  dailyRentPrice: Number,
  carType: String,        // "Sedan" | "SUV" | "Hatchback" | "Luxury" | "Coupe" | "Convertible"
  imageUrl: String,
  seatCapacity: Number,
  pickupLocation: String,
  description: String,
  availabilityStatus: String, // "available" | "booked" | "unavailable"
  featured: Boolean,
  booking_count: Number   // incremented/decremented via $inc as bookings are made/cancelled
}
```

### Booking

```js
{
  carId: ObjectId,
  carName: String,         // snapshotted at time of booking
  carImage: String,        // snapshotted at time of booking
  ownerId: String,         // the user who made the booking
  dailyRentPrice: Number,  // snapshotted at time of booking
  numberOfDays: Number,
  totalPrice: Number,      // dailyRentPrice * numberOfDays
  driverNeeded: Boolean,
  specialNote: String,
  status: String,          // currently always "pending" — no status-update flow exists yet
  createdAt: Date
}
```

> Snapshotting `carName`, `carImage`, and `dailyRentPrice` onto each booking ensures a booking record stays meaningful even if the original car's details change or the car is later deleted.

---

## Known Limitations & Roadmap

This is an actively developed solo project. A few things are intentionally incomplete or deferred:

- **Booking status is static.** Every booking is created with `status: "pending"` — there's currently no flow to mark a booking as confirmed, active, or completed.

Documenting these openly here rather than leaving them as silent gaps.

---

## Author

**Rohan Singh**

---

## License

This project is licensed under the [MIT License](LICENSE).
