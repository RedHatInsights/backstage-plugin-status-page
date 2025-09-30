export interface Config {
  assistant: {
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
