# ComfortNest - Real Estate Property Website

A modern, responsive real estate property listing website built with HTML, CSS, JavaScript, and Node.js. Features a beautiful mobile-responsive design with advanced property search, user management, and admin dashboard capabilities.

## 🏠 Features

- **Property Listings**: Browse and search through available properties with detailed information
- **Responsive Design**: Mobile-first design that works perfectly on all devices
- **User Authentication**: Secure login and registration system with JWT tokens
- **Admin Dashboard**: Comprehensive property and user management for administrators
- **Advanced Search**: Filter properties by location, price, bedrooms, property type
- **Interactive Mobile Menu**: Smooth hamburger menu with proper navigation
- **Contact Forms**: Professional contact and inquiry functionality
- **Image Galleries**: Property photo slideshows with Swiper.js
- **Property Management**: Add, edit, and delete properties with image uploads
- **User Management**: Admin can manage user accounts and permissions
- **Email Integration**: Password reset functionality with email OTP
- **Professional UI**: Clean, modern interface with consistent styling

## 🛠️ Technologies Used

- **Frontend**:
  - HTML5 with semantic markup
  - CSS3 with modern features (Grid, Flexbox, Custom Properties)
  - Vanilla JavaScript (ES6+)
  - Bootstrap 5 for responsive components
  - Font Awesome icons
  - Swiper.js for image carousels
  - EmailJS for client-side email functionality
  - Responsive mobile-first design

- **Backend**:
  - Node.js with Express.js framework
  - MongoDB with Mongoose ODM
  - JSON Web Tokens (JWT) for authentication
  - bcrypt.js for password hashing
  - Multer for file uploads
  - CORS for cross-origin requests
  - Morgan for HTTP request logging
  - Nodemon for development auto-restart
  - Nodemailer for server-side email functionality

- **Database**:
  - MongoDB for data storage
  - Mongoose for object modeling
  - User and Property collections with relationships

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- NPM or Yarn package manager

### Quick Start

1. **Download/Extract the project**
   - Extract the project files to your desired directory

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/comfortnest-db
   JWT_SECRET=your_super_secure_jwt_secret_key_here
   JWT_EXPIRE=7d
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   ```

4. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Or use MongoDB Atlas cloud database

5. **Start the application**

   **Option A: Using start.bat (Windows)**
   ```bash
   start.bat
   ```

   **Option B: Using npm commands**
   ```bash
   # Development mode (with auto-restart)
   npm run dev

   # Production mode
   npm start
   ```

6. **Access the application**
   - Open your browser and go to `http://localhost:5000`
   - Default admin credentials: `comfortnestproject@gmail.com` / `admin123`

## 📖 Usage

### For Users:
1. **Homepage**: Visit `http://localhost:5000` to browse properties
2. **Registration**: Create a new account with email and password
3. **Login**: Sign in to access personalized features
4. **Property Search**: Use filters to find properties by location, price, type
5. **Property Details**: View detailed information and image galleries
6. **Contact**: Use contact forms to inquire about properties

### For Admins:
1. **Admin Dashboard**: Access `http://localhost:5000/admin.html`
2. **Login**: Use admin credentials to access dashboard
3. **User Management**: View, edit, and manage user accounts
4. **Property Management**: Add, edit, delete, and manage all properties
5. **Analytics**: View user and property statistics

### Key Pages:
- **Homepage** (`index.html`) - Property listings and search
- **About** (`about.html`) - Company information
- **Contact** (`contact.html`) - Contact form and information
- **Login** (`login.html`) - User authentication
- **Sign Up** (`sign up.html`) - User registration
- **Admin Dashboard** (`admin.html`) - Administrative interface
- **Add Property** (`add-property.html`) - Property creation form
- **Property Details** (`detail.html`) - Individual property view

## 🔌 API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - User login with email/password
- `POST /api/users/send-password-reset-otp` - Send password reset OTP
- `POST /api/users/reset-password` - Reset password with OTP

### User Management
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Properties
- `GET /api/properties` - Get all properties with optional filters
- `GET /api/properties/:id` - Get a single property by ID
- `POST /api/properties` - Create a new property (protected)
- `PUT /api/properties/:id` - Update a property (protected)
- `DELETE /api/properties/:id` - Delete a property (protected)

### Query Parameters for Properties:
- `location` - Filter by location
- `minPrice` & `maxPrice` - Price range filter
- `bedrooms` - Number of bedrooms
- `propertyType` - Type of property (house, apartment, etc.)
- `page` & `limit` - Pagination

## 📁 Project Structure

```
ComfortNest/
├── controllers/              # Backend controllers
│   ├── propertyController.js # Property CRUD operations
│   └── userController.js     # User authentication & management
├── middleware/               # Custom middleware
│   └── authMiddleware.js     # JWT authentication middleware
├── models/                   # MongoDB models
│   ├── propertyModel.js      # Property schema
│   ├── userModel.js          # User schema
│   └── index.js              # Model exports
├── routes/                   # API routes
│   ├── propertyRoutes.js     # Property endpoints
│   └── userRoutes.js         # User endpoints
├── js/                       # Frontend JavaScript
│   ├── api.js                # API communication
│   ├── admin.js              # Admin dashboard logic
│   ├── index.js              # Homepage functionality
│   ├── login.js              # Login page logic
│   ├── signup.js             # Registration logic
│   ├── add-property.js       # Property creation
│   ├── edit-property.js      # Property editing
│   ├── detail.js             # Property details
│   ├── dashboard.js          # User dashboard
│   ├── navbar.js             # Navigation functionality
│   └── slider.js             # Image carousel
├── css/                      # Stylesheets
│   ├── admin.css             # Admin dashboard styles
│   └── style.css             # General styles
├── images/                   # Static images
├── public/                   # Public assets
│   └── uploads/              # Uploaded property images
├── *.html                    # Frontend pages
├── *.css                     # Page-specific styles
├── server.js                 # Express application entry point
├── package.json              # Dependencies and scripts
├── start.bat                 # Windows startup script
└── README.md                 # Project documentation
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000

# Database Configuration
MONGO_URI=mongodb://localhost:27017/comfortnest-db

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRE=7d

# Email Configuration (for Nodemailer)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

### Default Admin Account
The application automatically creates a default admin account:
- **Email**: `comfortnestproject@gmail.com`
- **Password**: `admin123`
- **Role**: Admin

## 🎨 Features Overview

### User Features
- ✅ User registration and authentication
- ✅ Property browsing with advanced search filters
- ✅ Property details with image galleries
- ✅ Contact forms for property inquiries
- ✅ User dashboard for managing account
- ✅ Password reset functionality
- ✅ Responsive design for all devices

### Admin Features
- ✅ Admin dashboard with analytics
- ✅ User management (view, edit, delete users)
- ✅ Property management (add, edit, delete properties)
- ✅ Image upload for properties
- ✅ Search and filter functionality
- ✅ Role-based access control

### Technical Features
- ✅ JWT-based authentication
- ✅ File upload with Multer
- ✅ Image optimization and storage
- ✅ RESTful API design
- ✅ MongoDB integration with Mongoose
- ✅ CORS enabled for cross-origin requests
- ✅ Request logging with Morgan
- ✅ Development auto-restart with Nodemon
- ✅ Server-side email sending with Nodemailer

## 🚀 Deployment

### Local Development
1. Follow the installation steps above
2. Use `npm run dev` for development with auto-restart
3. Access the application at `http://localhost:5000`

### Production Deployment
1. Set `NODE_ENV=production` in your environment
2. Use `npm start` to run the production server
3. Configure your MongoDB connection for production
4. Set up proper environment variables
5. Configure reverse proxy (nginx) if needed

## 🛠️ Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running on your system
- Check the MONGO_URI in your .env file
- Verify MongoDB service is started

**Port Already in Use**
- Change the PORT in .env file
- Kill the process using the port: `netstat -ano | findstr :5000`

**File Upload Issues**
- Ensure the `public/uploads` directory exists
- Check file permissions for the uploads folder
- Verify Multer configuration in propertyController.js

**Authentication Issues**
- Check JWT_SECRET in .env file
- Verify token expiration settings
- Clear browser localStorage if needed

## 📞 Support

For support and questions:
- **Email**: comfortnestproject@gmail.com
- **Project**: ComfortNest Real Estate Platform

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added admin dashboard and user management
- **v1.2.0** - Enhanced property management and image uploads
- **v1.3.0** - Performance optimizations and bug fixes
- **v1.4.0** - Added server-side email functionality with Nodemailer
