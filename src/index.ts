import { config } from "dotenv";
config();

import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

async function main() {
  // Initialize OpenAI model
  const model = new ChatOpenAI({
    modelName: "gpt-4.1-nano-2025-04-14",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.1,
  });

  // Create MCP client for Python execution
  const mcpClient = new MultiServerMCPClient({
    throwOnLoadError: true,
    prefixToolNameWithServerName: false,
    additionalToolNamePrefix: "",
    mcpServers: {
      pythonRunner: {
        transport: "stdio",
        command: "deno",
        args: [
          "run",
          "-N",
          "-R=node_modules",
          "-W=node_modules",
          "--node-modules-dir=auto",
          "jsr:@pydantic/mcp-run-python",
          "stdio",
        ],
        restart: {
          enabled: true,
          maxAttempts: 3,
          delayMs: 1000,
        },
      },
    },
  });

  try {
    // Get tools from the MCP server
    console.log("Connecting to MCP server and loading tools...");
    const tools = await mcpClient.getTools();
    
    console.log(`Loaded ${tools.length} tools`);
    tools.forEach(tool => {
      console.log(`- ${tool.name}: ${tool.description}`);
    });

    // Create a system prompt that emphasizes tool usage
    const systemPromptContent = `You are a helpful AI data analysis assistant that MUST EXECUTE Python code to solve problems.

IMPORTANT: When a user asks you to analyze data or perform calculations, you MUST:
1. Think through what Python code would help answer their question
2. ALWAYS use the run_python_code tool to execute the code
3. NEVER just explain the code without executing it
4. After executing, interpret the results from the tool

Your thinking process should follow this exact pattern:
1. Thought: Think about the problem and what Python code would solve it
2. Action: Use the run_python_code tool with the appropriate Python code
3. Observation: Review the output from the executed code
4. Final Answer: Explain the results to the user

For ANY calculation or data task, no matter how simple, you MUST use the run_python_code tool.`;

    // Create the agent
    console.log("\nCreating ReAct agent...");
    const agent = createReactAgent({
      llm: model,
      tools,
    });

    // Example query
    const userQuery = `Generate a large Markov chain: 
					- Import numpy as np.
					- Set the random seed to 42.
					- Create a matrix P of size 1000 × 1000, with elements sampled i.i.d. from U(0, 1).
					- Normalize each row so that P becomes stochastic (each row sums to 1).
					
                    ➜ Print: “Stochastic matrix created” and the sum of the first 5 rows (should be 1)`;
    console.log(`\nProcessing user query: "${userQuery}"`);

    // Invoke the agent with system message
    const response = await agent.invoke({
      messages: [
        new SystemMessage(systemPromptContent),
        new HumanMessage(userQuery)
      ],
    });

    // Print the response
    console.log("\nAgent Response:");
    console.log(JSON.stringify(response.messages[response.messages.length-1], null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Clean up
    await mcpClient.close();
  }
}

main().catch(console.error);
