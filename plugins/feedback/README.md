# Feedback Plugin

Welcome to the feedback plugin!

This plugin helps to collect feedback from users for service catalog entities and create Jira ticket associated with it.

<details>
<summary><strong>Screenshots</strong></summary>

| Global Page                           | Entity Page                           |
| ------------------------------------- | ------------------------------------- |
| ![globalPage](./docs/global-page.png) | ![entityPage](./docs/entity-page.png) |

| Feedback Details Modal                      | Create Feedback Modal                  |
| ------------------------------------------- | -------------------------------------- |
| ![feedbacDetails](./docs/details-modal.png) | ![entityPage](./docs/create-modal.png) |

</details>

## Features

- List all the feedbacks and bugs for the services globally.
- List all the feedbacks and bugs for each entity.
- Create Bugs, Feedbacks directly on JIRA and mail.
- Unique feedback links for each feedback

## Requirements

- Make sure that [feedback-backend](../feedback-backend) plugin is configured prior to this.
- Only tested with postgresql db.

## Plugin Setup

1. Install the plugin in your environment

```bash
yarn workspaces app add @appdev-platform/backstage-plugin-feedback
```

1. Add `GlobalFeedbackPage` component to the `src/App.tsx`.

```ts
import { GlobalFeedbackPage } from '@appdev-platform/backstage-plugin-feedback';
// ...

const routes = (
  <FlatRoutes>
    // ... // Insert this line to add feedback route
    <Route path="/feedback" element={<GlobalFeedbackPage />} />
  </FlatRoutes>
);
```

2. Then add a route to sidebar to easily access `/feedback`, in `src/components/Root/Root.tsx`.

```ts
import TextsmsOutlined  from '@material-ui/icons/TextsmsOutlined';
//...
export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      // ...
      <SidebarGroup label="Menu" icon={<MenuIcon />}>
        // ...
        // Insert these lines in SidebarGroup
        <SidebarScrollWrapper>
          <SidebarItem icon={TextsmsOutlined} to="feedback" text="Feedback" />
        </SidebarScrollWrapper>
        // ...
      // ...
  </SidebarPage>
)
```

3. Add `EntityFeedbackPage` component to the **Component page, Api page** in `src/components/catalog/EntityPage.tsx`.

```ts
<EntityLayout.Route path="/feedback" title="Feedback">
  <EntityFeedbackPage />
</EntityLayout.Route>
```

### Annotations

To configure mail:

- Add these annotations to your `catalog-info.yaml` file.

```yaml
metadata:
  annotations:
    # Set to MAIL, if you want to recevie mail
    # on every feedback.
    feedback/type: 'MAIL'

    # Type in your mail here, it will be kept in cc,
    # while sending mail on feedback generation.
    feedback/email-to: 'example@example.com'
```

To configure Jira:

- Add these annotations to your `catalog-info.yaml` file.

```yaml
metadata:
  annotations:
    # Set to JIRA to create ticket when
    # creating feedbacks.
    feedback/type: 'JIRA'

    # Enter your jira project key,
    jira/project-key: '<your-jira-project-key>'

    # Enter the url of you jira server.
    feedback/host: '<your-jira-host-url>'

    # (optional) Type in your mail here,
    #  it will be kept in cc,
    #  while sending mail on feedback generation.
    feedback/email-to: 'example@example.com';
```
