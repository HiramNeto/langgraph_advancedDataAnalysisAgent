import { config } from "dotenv";
config();

import * as readline from "readline";
import { ChatOpenAI } from "@langchain/openai";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

// Add this interface near the top of your file
interface ExtendedMessage extends BaseMessage {
  type?: string;
  id?: string;
  kwargs?: {
    tool_calls?: Array<{ 
      name: string;
      args: { python_code: string };
    }>;
    content?: string;
  };
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log("Starting Python Data Analysis Agent...");

  // Initialize OpenAI model instead of Gemini
  const model = new ChatOpenAI({
    modelName: "gpt-4.1-nano-2025-04-14", // Using the same model as in index.ts
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.1,
  });

  // Create MCP client for Python execution
  console.log("Connecting to MCP Python Runner...");
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
    const tools = await mcpClient.getTools();
    console.log(`Connected! Loaded ${tools.length} tools`);

    // Create a system prompt that emphasizes tool usage - same as index.ts
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

    // Create the agent - removed prompt parameter
    const agent = createReactAgent({
      llm: model,
      tools,
    });

    console.log("\n== Python Data Analysis Agent Ready ==");
    console.log("Type your data analysis questions. Type 'exit' to quit.\n");

    // Interactive loop
    const askQuestion = () => {
      rl.question("Your question: ", async (query) => {
        if (query.toLowerCase() === "exit") {
          await mcpClient.close();
          rl.close();
          return;
        }

        try {
          console.log("\nProcessing your request...");
          
          // Pass SystemMessage with each query
          const response = await agent.invoke({
            messages: [
              new SystemMessage(systemPromptContent),
              new HumanMessage(query)
            ],
          });

          // Debug the structure to understand it better
          console.log("\n=== Agent Execution Steps ===");
          
          // Get a simpler representation of the response steps
          const messages = response.messages || [];
          
          // Log the number of messages to help debug
          console.log(`Total agent steps: ${messages.length-2}`);
          
          // Skip system and human messages
          for (let i = 2; i < messages.length; i++) {
            // Cast the entire message to any to bypass TypeScript checks
            const message = messages[i] as any;
            console.log(`\n--- Step ${i-1} ---`);
            
            const newMessage = JSON.parse(JSON.stringify(message));
            
            // Now we can access internal properties without TypeScript errors
            if (newMessage.type === "constructor") {
                            
              // The id property is an array, not a string
              if (newMessage.id && Array.isArray(newMessage.id) && newMessage.id[2] === "AIMessage") {
                // Check if it's a tool calling message
                if (newMessage.kwargs?.additional_kwargs?.tool_calls && newMessage.kwargs.additional_kwargs.tool_calls.length > 0) {
                  console.log("\n📝 AGENT PLANNING:");
                  console.log("The agent decided to execute Python code to solve this problem.");
                  
                  for (const toolCall of newMessage.kwargs.additional_kwargs.tool_calls) {
                    if (toolCall.function?.name && toolCall.function.name === "run_python_code" && JSON.parse(toolCall.function.arguments).python_code) {
                      console.log("\n💻 PYTHON CODE GENERATED:");
                      console.log("```python");
                      console.log(JSON.parse(toolCall.function.arguments).python_code);
                      console.log("```");
                    }
                  }
                } 
                // If it's a final response without tool calls
                else if (newMessage.kwargs?.content) {
                  console.log("\n✅ CONCLUSION:");
                  console.log(newMessage.kwargs.content);
                }
              } 
              else if (newMessage.id && Array.isArray(newMessage.id) && newMessage.id[2] === "ToolMessage") {
                console.log(`Message Class: ${newMessage.id[2]}`);
                // This is a tool execution result
                console.log("\n🔍 EXECUTION RESULT:");
                
                if (newMessage.kwargs?.content) {
                  // Try to extract the return value if it's in a specific format
                  const contentStr = newMessage.kwargs.content;
                  const returnMatch = contentStr.match(/<return_value>\n([\s\S]*?)\n<\/return_value>/);
                  
                  if (returnMatch && returnMatch[1]) {
                    console.log(returnMatch[1]);
                  } else {
                    console.log(contentStr);
                  }
                }
              }
            } 
            else {
              // For any other message type, just output what we have
              console.log(`Message type: ${newMessage.type || "unknown"}`);
              console.log("Content:", newMessage.content || newMessage.kwargs?.content || "No content");
            }
          }

          console.log("\n=== End of Agent Execution ===");
          askQuestion();
        } catch (error) {
          console.error("Error processing your request:", error);
          askQuestion();
        }
      });
    };

    askQuestion();
  } catch (error) {
    console.error("Initialization error:", error);
    await mcpClient.close();
    rl.close();
  }
}

main().catch(console.error); 