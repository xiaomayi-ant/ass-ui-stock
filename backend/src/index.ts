import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  Annotation,
  END,
  START,
  StateGraph,
  MessagesAnnotation,
} from "@langchain/langgraph";
import {
  BaseMessage,
  AIMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import {
  milvusSearchTool,
  ALL_TOOLS_LIST,
} from "./tools.js";
import { AppError, ErrorStep } from './utils/errors.js';
import { Logger } from './utils/logger.js';

const GraphAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
});

let llm: ChatOpenAI;
let embeddings: OpenAIEmbeddings;

try {
  llm = new ChatOpenAI({
    model: "gpt-4",
    temperature: 0,
  });
  embeddings = new OpenAIEmbeddings();
  Logger.info('LLM and embeddings initialized successfully');
} catch (error) {
  Logger.error(new AppError(
    'Failed to initialize LLM or embeddings',
    ErrorStep.LLM_CALL,
    { error }
  ));
  throw error;
}

const toolNode = new ToolNode(ALL_TOOLS_LIST);

const callModel = async (state: typeof GraphAnnotation.State) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  try {
    const messageContent = typeof lastMessage.content === 'string' 
      ? lastMessage.content 
      : Array.isArray(lastMessage.content) 
        ? lastMessage.content
            .filter(c => 'text' in c)
            .map(c => (c as { text: string }).text)
            .join(' ')
        : '';
    Logger.debug('Starting embedding generation', { message: messageContent });
    const embedding = await embeddings.embedQuery(messageContent);
    Logger.info('Embedding generated successfully');

    Logger.debug('Starting Milvus search');
    const searchResults = await milvusSearchTool.invoke({ embedding });
    Logger.info('Milvus search completed');

    let parsedResults;
    try {
      parsedResults = JSON.parse(searchResults);
      const relevantInfo = parsedResults.results.map((r: any) => r.metadata).join("\n");
      Logger.debug('Search results parsed', { resultCount: parsedResults.results.length });
      
      const systemMessage = {
        role: "system",
        content:
          "You are a helpful assistant that answers questions based on the information retrieved from the database. " +
          "The following information was found in the database:\n" + relevantInfo + "\n" +
          "Always provide accurate information based on the search results and maintain a natural conversation flow.",
      };

      Logger.debug('Starting LLM invocation');
      const llmWithTools = llm.bindTools(ALL_TOOLS_LIST);
      const result = await llmWithTools.invoke([systemMessage, ...messages]);
      Logger.info('LLM invocation completed');

      return {
        messages: [{
          type: "ai",
          content: result.content,
          tool_calls: [{
            id: "milvus_search_" + Date.now(),
            type: "function",
            function: {
              name: "milvus_search",
              arguments: JSON.stringify({
                query: lastMessage.content,
                results: parsedResults.results
              })
            }
          }]
        }]
      };
    } catch (e) {
      throw new AppError(
        'Failed to parse search results or generate response',
        ErrorStep.MESSAGE_PARSING,
        { searchResults, error: e }
      );
    }
  } catch (e) {
    Logger.error(e instanceof AppError ? e : new AppError(
      e.message,
      ErrorStep.TOOL_EXECUTION,
      { error: e }
    ));

    return {
      messages: [{
        type: "ai",
        content: "I apologize, but I encountered an error while processing your request. " +
                "This has been logged for investigation. Could you please try again or rephrase your question?",
        tool_calls: [{
          id: "error_" + Date.now(),
          type: "function",
          function: {
            name: "error",
            arguments: JSON.stringify({ 
              error: e instanceof AppError ? e.toJSON() : e.message 
            })
          }
        }]
      }]
    };
  }
};

const shouldContinue = (state: typeof GraphAnnotation.State) => {
  try {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    
    const messageCastAI = lastMessage as AIMessage;
    if (messageCastAI._getType() !== "ai" || !messageCastAI.tool_calls?.length) {
      return END;
    }
    
    return "tools";
  } catch (e) {
    Logger.error(new AppError(
      'Error in workflow control',
      ErrorStep.MESSAGE_PARSING,
      { error: e }
    ));
    return END;
  }
};

const workflow = new StateGraph(GraphAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge(START, "agent")
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue, [
    "tools",
    END,
  ]);

export const graph = workflow.compile();
