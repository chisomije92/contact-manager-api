# Hub Contacts API

This is an Express JS API that enables users to create, update and delete contacts. It also features JWT authentication.

## Prerequisites

Before you can run this Express API locally, ensure you have the following prerequisites installed on your system:

- PostgreSQL or pgAdmin: You need to have PostgreSQL installed on your system. Alternatively, you can use pgAdmin as a graphical interface for managing the database. You can download PostgreSQL [here](https://www.postgresql.org/download/) and pgAdmin at [here](https://www.pgadmin.org/download/)

- Node.js: You need to have Node.js installed. You can download Node.js from nodejs.org.

- npm (Node Package Manager): Make sure you have npm installed. It usually comes bundled with Node.js, so if you have Node.js, you should have npm.

- Environment Variables (Env file): Create a .env file in the project directory with the following variables:

```sh
PG_HOST=your_db_host
PG_USER=your_db_username
PG_PASSWORD=your_db_password
PG_DB=your_db_name
PG_PORT=your_db_port
ACCESS_SECRET=your_jwt_access_secret
REFRESH_TOKEN=your_jwt_token_secret
```

Replace your_db_host, your_db_password, your_db_name, your_db_name,your_db_port,your_jwt_access_secret with your desired values. These variables are used for configuring the database connection and handling JSON Web Tokens (JWT) for authentication.

## Getting Started

1. Clone this repository to your local machine using git clone or download it as a ZIP file and extract it.

2. Navigate to the project directory in your terminal using cd project-directory.

3. Run npm install to install the project dependencies.

4. Create the PostgreSQL database:

5. Use pgAdmin or the command line to create a new database.
   Update the .env file with the database connection details.

6. Start the Express API server:

```sh
npm run dev
```

## API Endpoints

You can find the API endpoints in the src/routes directory. Customize these routes to suit your application's needs.

## Authentication

This API includes authentication using JSON Web Tokens (JWT). Make sure to set up user authentication and authorization as required for your application. You can find the authentication middleware in the middleware directory.

## Error Handling

The API includes basic error handling and validation. You can enhance and customize the error handling to meet your specific requirements.

## Conclusion

You now have a local instance of the Express API running with a PostgreSQL database. Feel free to modify and expand the functionality to suit your project's needs.

For any questions or issues, please refer to the project's GitHub repository or contact the project contributor(s). Happy coding!
