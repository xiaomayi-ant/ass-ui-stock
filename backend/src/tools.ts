import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MilvusClient } from '@zilliz/milvus2-sdk-node';
import { AppError, ErrorStep } from './utils/errors.js';
import { Logger } from './utils/logger.js';

// Milvus client initialization
let milvusClient: MilvusClient;
try {
  milvusClient = new MilvusClient({
    address: "47.251.112.46:19530",
    ssl: false
  });
  Logger.info('Milvus client initialized successfully');
} catch (error) {
  Logger.error(new AppError(
    'Failed to initialize Milvus client',
    ErrorStep.MILVUS_CONNECTION,
    { error }
  ));
  throw error;
}

export const milvusSearchTool = tool(
  async (input) => {
    try {
      Logger.debug('Starting Milvus search', { vector: input.embedding.length });
      
      const searchResults = await milvusClient.search({
        collection_name: "test_collection4",
        vector: input.embedding,
        limit: 5,
        metric_type: "L2",
        output_fields: ["metadata"],
        params: { nprobe: 10 },
      });

      Logger.info('Milvus search completed', {
        resultCount: searchResults.results?.length
      });

      return JSON.stringify(searchResults);
    } catch (e: any) {
      const error = new AppError(
        'Error searching Milvus',
        ErrorStep.MILVUS_SEARCH,
        { originalError: e.message }
      );
      Logger.error(error);
      return `An error occurred while searching: ${error.message}`;
    }
  },
  {
    name: "milvus_search",
    description: "Search for relevant information in the vector database",
    schema: z.object({
      embedding: z.array(z.number()).describe("The vector embedding of the query"),
    }),
  }
);

// Simplified tools list
export const ALL_TOOLS_LIST = [
  milvusSearchTool
];

export const SIMPLE_TOOLS_LIST = [
  milvusSearchTool
];

// Types for response
export type SearchResponse = {
  status: {
    error_code: string;
    reason: string;
  };
  results: Array<{
    score: number;
    metadata: any;
  }>;
};
