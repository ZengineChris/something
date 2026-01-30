#!/usr/bin/env node

import { createChatStream, ChatEngine } from './index.js';
import { chatMessages } from '../test/fixtures/chat-messages.js';
import * as readline from 'node:readline';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Category colors
  greeting: '\x1b[32m',      // green
  question: '\x1b[36m',      // cyan
  command: '\x1b[33m',       // yellow
  farewell: '\x1b[35m',      // magenta
  gratitude: '\x1b[34m',     // blue
  apology: '\x1b[91m',       // light red
  agreement: '\x1b[92m',     // light green
  negation: '\x1b[31m',      // red
  general: '\x1b[37m',       // white
};

function getColorForCategory(category) {
  return colors[category] || colors.general;
}

function formatOutput(message, result, useColors = true) {
  const category = result.classification || 'general';
  const response = result.response || 'No response';

  if (useColors) {
    const color = getColorForCategory(category);
    return `${colors.dim}Message:${colors.reset} ${message}\n` +
           `${color}${colors.bold}[${category.toUpperCase()}]${colors.reset} ${response}\n`;
  }

  return JSON.stringify({ message, category, response });
}

function printHelp() {
  console.log(`
${colors.bold}chat-flow${colors.reset} - Chat Flow Engine CLI

${colors.bold}USAGE:${colors.reset}
  chat-flow [OPTIONS]
  echo "message" | chat-flow

${colors.bold}OPTIONS:${colors.reset}
  --demo         Run demo mode with 50 sample messages
  --interactive  Start interactive REPL mode (default when TTY)
  --help, -h     Show this help message

${colors.bold}MODES:${colors.reset}
  Demo Mode:        Process 50 sample messages with colorized output
  Interactive Mode: REPL-style interface for typing messages
  Pipe Mode:        Accept stdin input, output JSON (auto-detected)

${colors.bold}EXAMPLES:${colors.reset}
  chat-flow --demo                    # See engine process sample messages
  chat-flow --interactive             # Type messages interactively
  echo "Hello!" | chat-flow           # Process single message via pipe
  cat messages.txt | chat-flow        # Process multiple messages
`);
}

async function runDemo() {
  console.log(`${colors.bold}Chat Flow Engine - Demo Mode${colors.reset}`);
  console.log(`${'─'.repeat(50)}\n`);

  const engine = ChatEngine();
  const results = await engine.processMessages(chatMessages);

  for (let i = 0; i < chatMessages.length; i++) {
    console.log(formatOutput(chatMessages[i], results[i], true));
  }

  console.log(`${'─'.repeat(50)}`);
  console.log(`${colors.bold}Processed ${chatMessages.length} messages${colors.reset}`);
}

async function runInteractive() {
  console.log(`${colors.bold}Chat Flow Engine - Interactive Mode${colors.reset}`);
  console.log(`Type a message and press Enter. Use Ctrl+C to exit.\n`);
  console.log(`${'─'.repeat(50)}\n`);

  const engine = ChatEngine();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question(`${colors.bold}>${colors.reset} `, async (input) => {
      if (input.trim()) {
        const results = await engine.processMessages([input]);
        console.log(formatOutput(input, results[0], true));
      }
      prompt();
    });
  };

  rl.on('close', () => {
    console.log(`\n${colors.dim}Goodbye!${colors.reset}`);
    process.exit(0);
  });

  prompt();
}

async function runPipe() {
  const engine = ChatEngine();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  for await (const line of rl) {
    if (line.trim()) {
      const results = await engine.processMessages([line]);
      console.log(formatOutput(line, results[0], false));
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--demo')) {
    await runDemo();
    process.exit(0);
  }

  if (args.includes('--interactive')) {
    await runInteractive();
    return; // Don't exit - interactive mode handles its own lifecycle
  }

  // Auto-detect pipe mode vs interactive mode
  if (process.stdin.isTTY) {
    await runInteractive();
  } else {
    await runPipe();
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
