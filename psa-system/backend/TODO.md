# Backend Authentication and MongoDB Setup TODO

## Completed Tasks

- [x] Update `config/db.js` to export MONGO_URI and JWT_SECRET properly
- [x] Create `models/User.js` with Mongoose schema for user data
- [x] Create `controller/authController.js` with register and login functions
- [x] Create `routes/auth.js` to define /register and /login routes
- [x] Create `middleware/auth.js` for JWT token verification
- [x] Update `server.js` to connect to MongoDB using config, import routes, and set up middleware

## Pending Tasks

- [ ] Test MongoDB connection and auth endpoints
- [ ] Update frontend components to call backend APIs instead of simulating
- [ ] Add retry logic to frontend API calls (Login.jsx and SignIn.jsx)
- [ ] Add retry logic to backend database operations (authController.js)
