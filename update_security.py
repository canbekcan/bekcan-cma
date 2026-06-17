import re

with open('backend/server.js', 'r', encoding='utf-8') as f:
    content = f.read()

security_code = """
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security Middlewares
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "data:", "https:", "http:"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    connectSrc: ["'self'", "http://localhost:4000", "https://conf.bekcan.com"]
  }
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { error: 'Too many requests from this IP' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 login requests per window
  message: { error: 'Too many login attempts, please try again later' }
});

app.use('/api/', apiLimiter);
app.post('/api/auth/login', authLimiter);

app.use(cors());
"""

content = content.replace("app.use(cors());", security_code)

with open('backend/server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Security updates applied to server.js")
