# Python-Powered Data Analysis Agent

A powerful LLM-driven agent that performs data analysis tasks by generating, executing, and interpreting Python code.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

![LangChain](https://img.shields.io/badge/🦜🔗_LangChain-AI-blue?style=for-the-badge)

![OpenAI](https://img.shields.io/badge/OpenAI-API-green?style=for-the-badge)

## Overview

This project demonstrates how to create an AI agent that combines the reasoning capabilities of Large Language Models (LLMs) with the computational power of Python to perform data analysis tasks. The agent can:

 1. Generate Python code to solve data problems
 2. Execute the code in a sandboxed environment
 3. Interpret the results
 4. Present clear explanations to the user

Unlike standard LLMs, which struggle with numerical accuracy and data processing, this agent can handle complex calculations, statistical analysis, and data visualizations with precision.

## Features

 - Interactive CLI - Ask data analysis questions in natural language
 - Python Code Generation - Automatically writes appropriate Python code
 - Secure Execution - Runs code in a sandboxed environment
 - Result Interpretation - Explains findings in human-friendly language
 - Step-by-Step Reasoning - Shows the agent's thinking process

## How It Works

The agent uses:

 - OpenAI's GPT models for reasoning and code generation
 - LangChain's ReAct agent framework for the reasoning-action loop
 - PydanticAI's MCP Run Python for safe Python code execution
 - LangChain MCP Adapters to connect the agent to the Python runtime

When a user asks a question:

 1. The LLM thinks through how to solve the problem
 2. It generates Python code using necessary libraries
 3. The code is executed in a secure Pyodide environment
 4. Results are returned to the LLM
 - [ ] The LLM interprets the results and provides a clear answer

## Prerequisites

An OpenAI API key

## Installation

 - Clone this repository:
 

    git clone https://github.com/HiramNeto/langgraph_advancedDataAnalysisAgent.git
cd langgraph_advancedDataAnalysisAgent

 - Install dependencies:
 

    npm install

 - Create a .env file in the project root with your OpenAI API key:
 

    OPENAI_API_KEY=your-api-key-here

 - Build the TypeScript files:
 

    npm run build

## Usage

Running the Demo Example

To run the demo with a preset data analysis question:

    npm run start

This executes src/index.ts, which demonstrates the agent generating and executing Python code to solve a predefined data analysis task.

Interactive CLI Mode

For interactive use where you can ask your own questions:

    npm run cli

This starts the CLI interface where you can type data analysis questions and see the agent's execution process and answers.

## Limitations

 - The sandboxed Python environment has limited access to packages
 - File operations are restricted for security reasons
 - Computationally intensive tasks might time out

## Future Improvements

 - Support for uploading and analyzing CSV/Excel files
 - Persistent sessions to maintain context between questions
 - More advanced visualization capabilities
 - Additional specialized data science tools

## Acknowledgements

 - LangChain.js - For the agent framework
 - PydanticAI - For the MCP Python Runner
 - LangChain MCP Adapters - For MCP connectivity

---

Built with ❤️ using TypeScript and LangChain