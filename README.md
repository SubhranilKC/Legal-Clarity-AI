# Legal Clarity AI

Legal Clarity AI is a powerful tool designed to demystify legal documents. By leveraging cutting-edge generative AI, it allows users to upload legal texts, extract and classify key clauses, ask complex questions in natural language, and receive clear, understandable answers. The application also provides features for summarizing documents, detecting potential risks, checking for regulatory compliance, and suggesting improvements to the text.

Built with a modern tech stack including Next.js, React, and Tailwind CSS for the frontend, and Google's Genkit for the AI capabilities, this project serves as a robust example of a production-grade AI-powered application.

## Prerequisites

Before you begin, ensure you have the following installed on your local machine:
- [Node.js](https://nodejs.org/en) (v18 or later is recommended)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js) or [Yarn](https://yarnpkg.com/)

## Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone <repository-url>
cd Legal-Clarity-AI
```

### 2. Install Dependencies

Install the necessary project dependencies using npm or yarn:

```bash
npm install
```
or
```bash
yarn install
```

### 3. Set Up Environment Variables

This project requires a Gemini API key to interact with the generative AI models.

1.  Create a new file named `.env.local` in the root of the project directory.
2.  Copy the contents of the `.env.example` file into your new `.env.local` file.
3.  Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
4.  Add your API key to the `.env.local` file:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Development Servers

This application requires two separate development servers to be running concurrently:
- The Next.js server for the frontend application.
- The Genkit server for the AI flows.

You will need to open two separate terminal windows or tabs to run these commands.

**In your first terminal, start the Next.js development server:**

```bash
npm run dev
```
This will start the frontend application, which is typically accessible at `http://localhost:3000`.

**In your second terminal, start the Genkit development server in watch mode:**

```bash
npm run genkit:watch
```
This will start the Genkit server and automatically restart it when you make changes to the AI flow files. This server manages all the interactions with the Gemini API.

Once both servers are running, you can open your browser and navigate to `http://localhost:3000` to use the application.

## Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint to check for code quality issues.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
- `npm run genkit:dev`: Starts the Genkit development server.
- `npm run genkit:watch`: Starts the Genkit development server in watch mode.
