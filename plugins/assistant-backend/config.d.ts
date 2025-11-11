export interface Config {
  assistant: {
    assistantOptions?: {
      /* Name of the assistant */
      name?: string;
      /* Custom instructions for the assistant */
      instructions?: string;
    };
    /** LLM Options for an OpenAI Compatible Model */
    llmOptions: {
      /** Base URL of the model */
      url: string;
      /**
       * API Key (optional)
       * @visibility secret
       */
      apiKey?: string;
      /**
       * Id of the LLM Model to use
       */
      modelId: string;
    };
  };
}
