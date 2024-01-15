# Getting Started

## Few screenshots of feebback plugin

| Global Page                                  | Entity Page                                  |
| -------------------------------------------- | -------------------------------------------- |
| ![globalPage](./images/global-page.png) | ![entityPage](./images/entity-page.png) |

| Feedback Details Modal                             | Create Feedback Modal                         |
| -------------------------------------------------- | --------------------------------------------- |
| ![feedbacDetails](./images/details-modal.png) | ![entityPage](./images/create-modal.png) |

| Opc Feedback Component                             |                                                |                                                      |                                                |
| -------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| ![initialDialog](./images/initial-dialog.png) | ![issueDialog](./images/issue-dialog.png) | ![feedbackDialog](./images/feedback-dialog.png) | ![finalDialog](./images/final-dialog.png) |


## Requirements

- Make sure that [feedback-backend](https://gitlab.cee.redhat.com/app-dev-platform/backstage-plugins/-/tree/main/plugins/feedback-backend) plugin is configured prior to this.

## Plugin Setup

1. Install the plugin in your environment

   ```bash
   yarn workspace app add @appdev-platform/backstage-plugin-feedback
   ```

2. Add configuration to app-config.yml

   ```yaml
   feedback:
     # A ref to base entity under which global feedbacks gets stored
     # in format: kind:namespace/name
     baseEntityRef: 'component:default/example-website'

     # Limit the number of characters for summary field
     # should be between 1-255
     summaryLimit: 240
   ```

3. Add `GlobalFeedbackPage`, `OpcFeedbackComponent` component to the `src/App.tsx`.

   ```jsx
   import {
     GlobalFeedbackPage,
     OpcFeedbackComponent,
     feedbackPlugin,
   } from '@appdev-platform/backstage-plugin-feedback';
   // ...
   const app = createApp({
     apis,
     bindRoutes({ bind }) {
       // ...
       // Bind techdocs root route to feedback plugin externalRoute.viewDocs to add "View Docs" link in opc-feedback component
       bind(feedbackPlugin.externalRoutes, {
         viewDocs: techdocsPlugin.routes.root,
       });
     },
     featureFlags: [
       // ...
     ],
   });
   const routes = (
     <FlatRoutes>
       // Insert this line to add feedback route
       <Route path="/feedback" element={<GlobalFeedbackPage />} />
     </FlatRoutes>
   );

   export default app.createRoot(
     <>
       // ...
       <AppRouter>
         // ...
         <OpcFeedbackComponent />
       </AppRouter>
     </>,
   );
   ```

4. Then add a route to sidebar to easily access `/feedback`, in `src/components/Root/Root.tsx`.

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

5. Add `EntityFeedbackPage` component to the **Component page, Api page** in `src/components/catalog/EntityPage.tsx`.

   ```ts
   <EntityLayout.Route path="/feedback" title="Feedback">
     <EntityFeedbackPage />
   </EntityLayout.Route>
   ```

### Annotations

To configure only mail:

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

To configure Jira + mail:

- Add these annotations to your `catalog-info.yaml` file.

```yaml
metadata:
  annotations:
    # Set to JIRA to create ticket when
    # creating feedbacks.
    feedback/type: 'JIRA'

    # Enter your jira project key,
    jira/project-key: '<your-jira-project-key>'

    # (optional) Enter the url of you jira server.
    # If not set then it will use first host from app-config
    feedback/host: '<your-jira-host-url>'

    # (optional) Type in your mail here,
    #  it will be kept in cc,
    #  while sending mail on feedback generation.
    feedback/email-to: 'example@example.com';
```
