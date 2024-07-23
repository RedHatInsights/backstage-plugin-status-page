# DocsBot

This plugin exposes a panel component and page component with DocsBot in backstage.

## Overview

DocsBot is an intelligent chatbot designed to assist with documentation in Backstage. It integrates seamlessly into Backstage, providing users with an easy way to access and interact with documentation. DocsBot can fetch data from various sources, including Markdown (MD) files, PDF files, source code repositories, and Slack forum conversations. It helps with quick troubleshooting and provides FAQ guides to enhance user productivity and support.

### Key Features

- **Contextual Assistance**: Provides relevant documentation based on user queries.
- **Easy Access**: Available from the sidebar, a dedicated button, or as a page component.
- **Multiple Data Sources**: Retrieves information from MD files, PDF files, source code, and Slack conversations.
- **Interactive Interface**: Users can ask questions and receive answers in real-time.
- **Quick Troubleshooting**: Offers solutions to common issues.
- **FAQ Guides**: Provides frequently asked questions and guides.
- **Integration with Backstage**: Leverages Backstage's UI components for a cohesive user experience.

## Usage

To use DocsBot in your Backstage application, you need to import and integrate it into your project. Below is an example of how to do this.

### Installation

First, ensure you have the necessary dependencies installed:

```bash
npm install @appdev-platform/backstage-plugin-docsbot
```

### Import and Use DocsBot

Here’s an example of how you can integrate DocsBot into your Backstage sidebar:

### Components

- **DocsBotButton**: A button to open the DocsBot panel.

![Docsbot Side Panel Component](./docs/DocsBotPanel.png)

And this is how you can you it.

![Docsbot Side Panel with question and answer](./docs/With%20input.png)

- **DocsBotPanel**: The main panel component where the chat interaction happens.

![Docsbot Full Page Component](./docs/DocsBotSidePanel.png)

### Example Usage

To include the DocsBot in your project, use the `DocsBotButton` and `DocsBotPanel` components. Here's a simplified example:

```jsx
import React, { useState } from 'react';
import {
  DocsBotButton,
  DocsBotPanel,
} from '@appdev-platform/backstage-plugin-docsbot';

const MyComponent = () => {
  const [isDocsBotPanelOpen, setIsDocsBotPanelOpen] = useState(false);

  const handleDrawerOpen = open => {
    setIsDocsBotPanelOpen(open);
  };

  return (
    <div>
      <DocsBotButton handleDrawerOpen={handleDrawerOpen} />
      <DocsBotPanel
        isOpen={isDocsBotPanelOpen}
        toggleDrawer={() => setIsDocsBotPanelOpen(!isDocsBotPanelOpen)}
      />
    </div>
  );
};

export default MyComponent;
```

By following the steps above, you can easily integrate DocsBot into your Backstage application, providing users with a powerful tool to access and interact with documentation from multiple sources.
