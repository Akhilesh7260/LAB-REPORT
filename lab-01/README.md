# Lab 1: Node.js and Express server

**Name:** DEVA AKHILESH  
**Registration number:** 252U1R9030  
**Section:** CSE-2A-304  

**Live link:** https://lab-report-ye31.onrender.com

## Objective
Create a Node.js project and build a small web server using Express. The server provides three routes and returns a 404 response for unknown paths.

## Requirements
- Node.js and npm installed
- A web browser

## How to install and run

1. Open a terminal in this project folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open the endpoints below in your browser.

## Endpoints

| Method | Path | Description | Expected status |
|---|---|---|---|
| GET | `/` | Displays a welcome message | 200 |
| GET | `/about` | Returns name, registration number, and section as JSON | 200 |
| GET | `/time` | Returns the current date and time | 200 |
| GET | Any unknown path | Displays a not-found message | 404 |

## Screenshots

Save screenshots of your working routes in the `screenshots/` folder, then add them here:

- `screenshots/home.png`
- `screenshots/about.png`
- `screenshots/time.png`
- `screenshots/not-found.png`

Example Markdown:

```md
![Home route](screenshots/home.png)
```

## package.json fields

- `name`: Project name.
- `version`: Current project version.
- `description`: Short explanation of the project.
- `main`: Main JavaScript file.
- `scripts`: Commands that can be run with npm.
- `keywords`: Search terms related to the project.
- `author`: Project author's name.
- `license`: Software license.
- `dependencies`: Packages required by the project, including Express.

## Viva preparation

**1. Difference between package.json and node_modules:**  
`package.json` stores project information and dependency details. `node_modules` contains the installed package files.

**2. What does app.listen do?**  
It starts the Express server and makes it listen for requests on the selected port.

**3. What do request and response represent?**  
`req` contains information about the incoming request. `res` is used to send a response back to the client.

## Notes
- `node_modules` is created by running `npm install`; do not commit it.
- Do not commit or share `.env` files or real secrets.
- Replace the sample name and section in `server.js` with your own details.
- Add your own screenshots after testing each endpoint.
- Write and understand the code so you can explain it during the viva.
