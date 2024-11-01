# cpsc-431-biggie-cats

## Team Members

Nadeem Maida
Pauleena Phan
Jong Kim

## Project Description

The main idea for this project is to create an appointment manager.

## How to Restore Database

On the index.html page, there is a button called 'Re-initialize database'. Click on that button and it will re-initialize the database and create seed accounts and seed data to use.

Use the following credentials to log in, to test with seeded data:

username: alice

password: Test1234!

You may also sign up for a new account if you wish.

## Global Requirements

Our project meets the standard global requirements and constraints that are mentioned on the Final Requirements Specification documentation.

This includes the XAMPP 8.2 Environment, Persistent Data, HTML/CSS Interface, and WCAG 2.0 AA Compliance.

## Functional Requirements

### index.html

In our index file we are have a general welcome page that greets users, explains the objective of the project, and how it works. Underneath that we have two buttons:

Log In:
    Redirects you to the Log In page.

Sign Up:
    Redirects you to the Sign Up page.a

At the bottom of the page there is a button called 'Re-initialize database'.

Re-initialize database:
    Re-initializes database and creates seed accounts and seed data to use.

Once re-initialized you can log into one of the seed accounts with either:

username: alice

password: Test1234!

### login.html

Our Log In page contains two input boxes: one for username and one for password. If it is not a valid username, an alert will prompt up saying that user not found. If it is not a valid password, an alert will prompt up saying that is an invalid password. If either field is empty a small message bubble will appear saying to fill out said empty field. If a valid username and password are provided then you will be logged in and redirected to the account's dashboard.

If you don't have an account and would like to make one, you can click on the 'Sign up' hyper link and you will be redirected to the Sign Up page.

### signup.html

Our Sign Up page contains three input boxes: one for username, one for email, and one for password. If it is not a valid email, a message bubble will pop up that will describe the error within the email input box. If all three text boxes are filled properly then you will be signed up and redirected to the account's dashboard page.

If you already have an account, you can click on the 'Login' hyper link and you will be redirected to the Log In page.

### dashboard.html

On the dashboard page, it consists of a navigation bar, a sidebar, and a calendar view that you are able to interact with the appointments.

Navigation bar:
    Displays the title of the application, BIGGIE MANAGER, and also a log out button that logs you out of the application.

Sidebar:
    Includes two sections: past and upcoming appointments. Both sections list 5 most recent past/upcoming appointments respectively.

Calendar view:
    Displays the current month and year as a title. underneath that displays a calendar grid view of the current month with weekday headers and also displays all the days of the month. Also within the calendar grid view a single cell is highlighted to display the current day it is.

To see the actual appointments, you can click on any cell date and it will prompt a modal container.

Modal container:
    Displays appointment details and operations for appointments. Operations include:
        delete - can delete the appointment.
        edit - can edit the appointment.
        Add appointment - can create an appointment and add it to the date.
        Close -  can close the modal prompt and return to regular calendar view.

## API Endpoints

### Appointments Routes

GET Appointments
    Path: GET /appointments
    Parameters:
        user_id (required): The ID of the user.
        id: Optionally filter by appointment ID, if specified ignores filters below.
        day, month, year: Filters appointments by the specified date, if specified ignores filters below.
        past: If set, returns past appointments.
        upcoming: If set, returns upcoming appointments.
    Description: Retrieves appointments for a specified user, optionally filtered by date or by past/upcoming status.
    Responses:
        200 OK: Returns an array of appointments.
        400 Bad Request: User ID is required or invalid query parameters.

POST Appointments
    Path: POST /appointments
    Parameters:
        user_id, title, start_time, end_time, date (all required): Parameters to create a new appointment.
    Description: Creates a new appointment ensuring there are no overlapping appointments and that the end time is after the start time.
    Responses:
        201 Created: Returns success message on successful appointment creation.
        400 Bad Request: Missing parameters or other errors in request.
        409 Conflict: Appointment time conflicts with an existing appointment.

PUT Appointments
    Path: PUT /appointments
    Parameters:
        id, user_id (required): Appointment and user identification.
        title, description, start_time, end_time: Parameters to update an existing appointment.
    Description: Updates an existing appointment for the specified user.
    Responses:
        200 OK: Returns a success message upon successful update.
        404 Not Found: Appointment not found.
        400 Bad Request: Missing or incomplete parameters.

DELETE Appointments
    Path: DELETE /appointments
    Parameters:
        id, user_id (required): Appointment and user identification.
    Description: Deletes an appointment for the specified user.
    Responses:
        200 OK: Returns a success message upon successful deletion.
        404 Not Found: Appointment not found.
        400 Bad Request: Missing or incomplete parameters.

### User Management Routes

GET Users
    Path: GET /users
    Parameters:
        id: Optionally filter by user ID.
    Description: Retrieves user profiles, optionally filtered by user ID.
    Responses:
        200 OK: Returns user or list of users.

POST Users
    Path: POST /users
    Parameters:
        username, password, email (all required): Parameters for creating a new user.
    Description: Creates a new user ensuring the password criteria are met.
    Responses:
        201 Created: Returns success message on successful user creation.
        400 Bad Request: Missing parameters or other validation errors.

PUT Users
    Path: PUT /users
    Parameters:
        id (required): User identification.
        username, password, email: Parameters to update an existing user.
    Description: Updates an existing user profile.
    Responses:
        200 OK: Returns a success message upon successful update.
        400 Bad Request: Missing parameters or other errors.

DELETE Users
    Path: DELETE /users
    Parameters:
        id (required): User identification.
    Description: Deletes a user profile.
    Responses:
        200 OK: Returns a success message upon successful deletion.
        400 Bad Request: Missing user ID.

### User Authentication Routes

POST Login
    Path: POST /login
    Parameters:
        username (required): The username of the user attempting to log in.
        password (required): The password for the user.
    Description: Authenticates a user by verifying the provided username and password against the database.
    Responses:
        200 OK: Returns a success message along with user details (excluding the password).
        400 Bad Request: Username and password are required.
        401 Unauthorized: Invalid username or password.
        404 Not Found: User not found.

### Database Management Routes

POST Database Initialization
    Path: POST /db/init
    Description: This route re-initializes the database by dropping all existing tables and recreating them with some seeded data. This is particularly useful for resetting the database to a default state during development or testing.
    Responses:
        200 OK: Returns a success message indicating that the database was successfully reinitialized.
        500 Internal Server Error: If there are issues executing the SQL commands, this error is returned.
