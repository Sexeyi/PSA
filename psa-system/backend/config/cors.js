// config/cors.js
const corsOptions = {
    // Allow multiple origins
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:5173',  // Vite default
            'http://localhost:3000',  // React default
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
            // Add your production domain here
            // 'https://yourdomain.com'
        ];

        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'CORS policy blocked this origin';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },

    // Allow credentials (cookies, authorization headers)
    credentials: true,

    // Allowed HTTP methods
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    // Allowed headers
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],

    // Expose headers to the client
    exposedHeaders: ['Content-Range', 'X-Content-Range'],

    // Preflight cache duration (seconds)
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours
};

module.exports = corsOptions;