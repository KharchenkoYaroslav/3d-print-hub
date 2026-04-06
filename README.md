# 🔷 3D Print Hub

This is a hub platform for publishing and sharing your 3D models and their specifications.

## 📍 What are the objectives of this project?

The main objective of this project is to explore data storage methods other than SQL, including the document-oriented MongoDB, the in-memory Redis, and the S3-compatible file storage system MinIO.

## 📦 Technologies

- `TypeScript`
- `Nx`
- `NestJS`
- `MongoDB`
- `MinIO/S3`
- `Redis`
- `Swagger`
- `Docker`
- `Vite`
- `React`
- `SCSS`

## 🚀 Features

- **Visual Catalog**: Users can explore a clean, paginated grid of available 3D models.
- **Category Filtering**: A convenient sidebar allows users to filter models by specific categories.
- **Community-Driven Rankings**: The platform highlights the most popular models based on community likes.
- **Creator Portfolios**: Users can view a specific author's page to see their entire collection of uploaded models.

## ℹ️ Known Limitations & Future Work

> [!NOTE]
> This is an educational project. While the learning goals are met, the following features would be required for a production-ready commercial release.

- **Guest system**: allow users to view models without registering.

- **Administration and blocking system**: required to ensure protection against malicious content.

- **Advanced search and filtering system**: The project already allows models to be filtered by users and categories, but it is recommended that the search capabilities be expanded.

- **More parameters**: more model and licensing parameters, as well as model previews, will allow users to obtain more information about a model and its usage permissions before downloading it.

## 🏗️ System Architecture & Infrastructure

The project is structured as a monorepo managed by **Nx**, integrating the frontend client, backend server, and shared modules. Databases and file storage are deployed and managed centrally using **Docker Compose**.

- **Client (`apps/client`)**: A SPA that handles the user interface.
- **Server (`apps/server`)**: A REST API. Delegates core business logic and data operations to libraries.
- **Libraries (`libs/*`)**: Isolated modules containing the backend logic, infrastructure integrations, and shared types.
- **MongoDB**: The primary NoSQL database.
- **Redis**: An in-memory data store for the dynamic ranking system.
- **MinIO**: An S3-compatible object storage server for saving physical files.

## 📚 API Documentation

The project has auto-generated Swagger documentation available at url: `http://localhost:{SERVER_PORT}/api/docs`.

## ℹ️ Environment

```
# Service Configuration & Ports
PORT=3000
VITE_PORT=3000
VITE_API_FILE_URL=http://localhost:9000/main/

# Database Connection URLs
MONGO_URI=mongodb://your_db_user:your_db_password@localhost:27017/your_db_name?authSource=admin
REDIS_URI=redis://localhost:6379

# MinIO Configuration 
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_CONSOLE_PORT=8000
MINIO_USER="your_minio_user"
MINIO_PASSWORD="your_secure_minio_password"

# JWT Configuration
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
```

## 🚦 Running the Project

1. Clone the repository
2. Install dependencies: `npm ci`
3. Configure environment variables:
   - Create a `.env` file in the root directory.
   - Add the necessary variables as defined in the **Environment** section.
4. Start Docker services: `docker-compose up -d`
5. Start the applications: `npx nx run-many --target=serve --all --parallel=2`
6. Open `http://localhost:4200` in your browser
> [!TIP]
> Highly recommend installing the Nx Console extension for VS Code.

## 🎞️ Preview

https://github.com/user-attachments/assets/2c5c8f40-264a-4a2b-900b-a8a96572bf83


