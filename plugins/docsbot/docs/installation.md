# DocsBot Installation and Usage Guide

This guide provides steps to install and integrate DocsBot into your Backstage frontend environment.

---

## Installation Guide

### Frontend Installation

#### Obtain the Plugin

Add the DocsBot frontend plugin to your Backstage app by running the following command:

```sh
yarn workspace app add @appdev/backstage-plugin-docsbot
```

Set Up the Plugin

1. **Add DocsBot Components:**

Update the **App.tsx** file to include DocsBot’s page and navigation:

```tsx
import ChatBubbleOutlineIcon from '@material-ui/icons/ChatBubbleOutline';
import { DocsBotPage } from '@your-org/backstage-plugin-docsbot';

const app = createApp({
  icons: {
    docsbot: ChatBubbleOutlineIcon,
  },
});

const routes = (
  <FlatRoutes>
    <Route path="/docsbot" element={<DocsBotPage />} />
  </FlatRoutes>
);
```

2. **Enable DocsBot on Entity Pages:**
   Add the DocsBot sidebar component to your entity page:

```tsx
import { DocsBotSidebar } from '@your-org/backstage-plugin-docsbot';

const entityPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isKind('service')}>
      <ServiceEntityPage>
        <DocsBotSidebar />
      </ServiceEntityPage>
    </EntitySwitch.Case>
  </EntitySwitch>
);
```

3. **Optional Customizations:**

- Update the DocsBot icon in the navigation bar or sidebar.
- Add specific configurations if your DocsBot setup supports external API or custom endpoints.
