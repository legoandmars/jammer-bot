# Jammer Bot

A discord bot for collaborative Spotify playlist creation (and more?)

# Setup

1. Run `npm i` to install all the dependencies
2. Create a copies of both `.env.example` and `prisma/.env.example` named `.env` and enter your own configurations
3. Run `npm run db:migrate` to initialise the database
4. Run `npm run db:generate` to generate the database interaction code

# Commands

- `npm run start:dev` starts the bot in development mode with hot-reloading and type-checking enabled
- `npm run start:prod` starts the bot in production mode without hot-reloading and type-checking for better performance
- `npm run db:migrate` applies SQL migrations to the database
- `npm run db:generate` generates database interaction code using the Prisma schema
- `npm run lint:fix` checks all files for linting and formatting errors and fixes them if possible
- `npm run lint:check` checks all files for linting and formatting errors and prints them
