# Tiny Ops API

A REST API for managing Arma gaming events and community interactions, built with Hono, Prisma, and TypeScript.

## Developer Setup

1. Clone the repo

    ```sh
    $ git clone https://github.com/tinyopsdotgg/tinyops-api
    ```

2. Create database container

    ```sh
    $ docker compose up -d
    ```

3. Create `.env` at root of project using the `.env.example` as a reference:

    - Use this command: `$ openssl rand -base64 32` to create a SESSION_SECRET env var, if you are using **Bash/ZSH**
    - Use this command: `$ [Convert]::ToBase64String((1..32|%{Get-Random -Maximum 256}))` to create a SESSION_SECRET env var, if you are using **PowerShell**

4. Run `$ npm install` at root of project to install the dependencies

    - This will kick off the postinstall script, which will run `$ npx prisma generate deploy` to generate the Prisma client (Only for Production env)

5. Run database migrations

    ```sh
    $ npx prisma migrate dev
    ```

6. Finally, run `$ npm run dev` to start the server

The API will be available at `http://localhost:3000`
