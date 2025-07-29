# Hyperlocal Food Delivery Platform

A full-stack web application that connects home chefs with nearby customers for fresh, home-cooked meal delivery.

## Project Structure

```
├── backend/                 # Node.js/Express API server
│   ├── config/             # Database and configuration files
│   ├── middleware/         # Express middleware
│   ├── test/              # Backend tests
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── frontend/               # React.js web application
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── contexts/      # React context providers
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and utility services
│   │   └── test/          # Frontend tests
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
```

## Technology Stack

### Backend
- **Node.js** with **Express.js** framework
- **MongoDB** with **Mongoose** ODM
- **Redis** for caching and session management
- **Socket.io** for real-time communications
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Multer** for file uploads

### Frontend
- **React.js** with functional components and hooks
- **React Router** for navigation
- **Context API** for state management
- **Axios** for API calls
- **Socket.io-client** for real-time updates
- **Vite** for build tooling
- **PWA** capabilities with service workers

### External Integrations (Planned)
- **Stripe/Razorpay** for payment processing
- **Google Maps API** for location services
- **Twilio** for SMS notifications
- **SendGrid** for email services

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Redis (optional, for caching)

## Installation

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/hyperlocal-food-delivery
   JWT_SECRET=your-super-secret-jwt-key-here
   # ... other variables
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api/v1
   VITE_SOCKET_URL=http://localhost:5000
   # ... other variables
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /api/v1` - API information

### Authentication (Planned)
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/verify-email/:token` - Email verification

### Users (Planned)
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Meals (Planned)
- `GET /api/v1/meals/search` - Search meals by location
- `GET /api/v1/meals/:id` - Get meal details
- `POST /api/v1/meals` - Create meal (chef only)

## Features

### Current Implementation (Task 1 Complete)
- ✅ Node.js backend with Express.js framework
- ✅ MongoDB connection with Mongoose ODM
- ✅ React.js frontend with Vite build system
- ✅ Basic routing and navigation
- ✅ Context providers for state management
- ✅ Environment configuration
- ✅ CORS and security middleware
- ✅ Error handling middleware
- ✅ PWA capabilities
- ✅ Basic testing setup

### Planned Features
- User authentication and authorization
- Chef registration and approval system
- Location-based meal discovery
- Shopping cart and checkout
- Order management and tracking
- Real-time notifications
- Payment processing
- Admin panel
- Mobile responsiveness

## Development Guidelines

### Code Style
- Use ES6+ features
- Follow React functional component patterns
- Use async/await for asynchronous operations
- Implement proper error handling
- Write tests for new features

### Security
- Input validation and sanitization
- JWT token authentication
- CORS configuration
- Rate limiting
- Secure headers with Helmet

### Performance
- Code splitting and lazy loading
- Image optimization
- Database query optimization
- Caching strategies
- Bundle size optimization

## Testing

The project includes comprehensive testing setup:

### Backend Testing
- Unit tests with Jest
- Integration tests with Supertest
- API endpoint testing

### Frontend Testing
- Component tests with React Testing Library
- Unit tests with Vitest
- End-to-end testing setup (Cypress planned)

Run tests:
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

## Deployment

### Production Build
```bash
# Build frontend
cd frontend && npm run build

# Start backend in production mode
cd backend && NODE_ENV=production npm start
```

### Environment Variables
Ensure all production environment variables are properly configured:
- Database connection strings
- JWT secrets
- API keys for external services
- CORS origins

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Update documentation as needed
4. Use meaningful commit messages
5. Create feature branches for new development

## License

This project is licensed under the MIT License.
