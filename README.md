
# Server Configuration for Lantana's Project

This document outlines the server configuration for Lantana (GaYeong)'s project.

## Overview

- **Name**: server
- **Version**: 1.0.0
- **Main Entry**: index.js
- **Author**: Lantana (GaYeong)
- **License**: ISC

## Scripts

- `start`: Runs the server using Node.js (`node index.js`).
- `server`: Runs the server with nodemon for live reloading (`nodemon server.js`).

## Dependencies

- **AWS SDK**: Integration with AWS services like S3 for file storage.
- **bcryptjs**: For hashing passwords.
- **body-parser, cookie-parser, cors, dotenv**: Essential middlewares for handling requests, cookies, cross-origin requests, and environment variables.
- **express**: Core framework for the server.
- **jsonwebtoken**: For implementing JWT-based authentication.
- **mongoose**: ODM for MongoDB.
- **multer, multer-s3**: For handling file uploads, including integration with AWS S3.
- **nodemailer**: For sending emails.
- **date-fns**: Modern JavaScript date utility library.

## Getting Started

To get started with this server, clone the repository and install dependencies:

```bash
git clone [https://github.com/gayeongpark/comer_server.git]
cd comer_server
npm install
```

Run the server in development mode:

```bash
npm run start
```

## Additional Information

This server setup is part of a larger project that aims to provide robust backend functionality. It incorporates various technologies and libraries to ensure a seamless and secure user experience.
