# Frequently Asked Questions (FAQ)

This document provides answers to common questions about the XE System Audit Plugin.

## General Questions

### What is the XE System Audit Plugin?

The XE System Audit Plugin is a Backstage plugin designed to track and manage system groups (LDAP groups) and accounts that are exposed to external services. It helps organizations maintain compliance and security by tracking which groups are still required, their usage, and audit completion status.

### What are the main components of the plugin?

The plugin consists of two main components:

- **Frontend Plugin** (`system-audit`): Provides user interface for viewing and managing audit entries
  - Main audit page with table and grouped views
  - Entity card component for component-specific views
- **Backend Plugin** (`system-audit-backend`): Handles API endpoints and database operations
  - REST API for CRUD operations
  - Database schema and migrations

### What does the plugin track?

The plugin tracks:
- LDAP groups exposed to external services
- Which applications use each group (via CMDB App ID)
- Responsible parties for each group
- Who directly uses each group
- Whether groups are still required
- Audit cleanup completion status
- Review dates and usage notes

### Who can use this plugin?

All authenticated Backstage users can:
- View audit entries
- Create new entries
- Edit existing entries
- Delete entries
- View entries on entity pages

Application owners can also view entries specific to their applications with enriched information from the catalog.

## Installation & Setup

### How do I install the plugin?

#### Frontend Plugin
```bash
# From your Backstage root directory
yarn add @appdev/backstage-plugin-system-audit
```

#### Backend Plugin
```bash
# From your Backstage root directory
yarn --cwd packages/backend add @appdev/backstage-plugin-system-audit-backend
```

#### Register Backend Plugin
```typescript
// packages/backend/src/index.ts
backend.add(import('@appdev/backstage-plugin-system-audit-backend'));
```

#### Configure Frontend Plugin
```typescript
// packages/app/src/App.tsx
import { SystemAuditPage } from '@appdev/backstage-plugin-system-audit';

<Route path="/compliance/system-audit" element={<SystemAuditPage />} />
```

### What configuration is required?

The plugin uses Backstage's standard database service. Configure your database connection in `app-config.yaml`:

```yaml
backend:
  database:
    client: pg
    connection:
      host: localhost
      port: 5432
      database: backstage_plugin_system_audit
      user: your-database-user
      password: your-database-password
```

### What database does the plugin use?

The plugin uses PostgreSQL for data storage. You need to:
1. Create a PostgreSQL database
2. Configure the database connection in your `app-config.yaml`
3. Run the included migrations (they run automatically on backend startup)

### Do I need to run migrations manually?

Migrations run automatically when the backend starts. However, you can run them manually:

```bash
cd plugins/system-audit-backend
yarn knex migrate:latest
```

### How do I add the entity card to entity pages?

Add the entity card component to your entity page layout:

```typescript
// packages/app/src/components/catalog/EntityPage.tsx
import { EntitySystemAuditCard } from '@appdev/backstage-plugin-system-audit';

<EntityLayout.Route path="/system-audit" title="System Audit">
  <EntitySystemAuditCard />
</EntityLayout.Route>
```

## Usage Questions

### How do I create a new audit entry?

1. Navigate to `/compliance/system-audit` or use the entity card on an entity page
2. Click the "Add Entry" button
3. Fill in the required field (LDAP Common Name)
4. Optionally fill in other fields (CMDB App ID, responsible party, etc.)
5. Click "Save"

### What is the CMDB App ID used for?

The CMDB App ID links audit entries to Backstage catalog entities. When provided:
- The plugin searches for entities with matching `servicenow.com/appcode` annotations
- Entries are automatically enriched with application name, title, and owner
- Entries can be grouped by application
- Links to application entity pages are provided

### How do I link an entry to an application?

1. Ensure your catalog entity has a `servicenow.com/appcode` annotation
2. When creating or editing an entry, enter the same value in the CMDB App ID field
3. The plugin will automatically find and link to the entity

### What's the difference between grouped and flat view?

- **Grouped View**: Entries are organized by CMDB App ID in expandable accordions. Good for viewing entries by application.
- **Flat View**: All entries displayed in a single table with all columns visible. Good for searching across all entries.

Toggle between views using the "Group by App Code" switch.

### How do I edit an entry?

1. Find the entry in the table
2. Click the edit icon (pencil) in the Actions column
3. Modify any fields in the dialog
4. Click "Save" to update

### How do I delete an entry?

1. Find the entry in the table
2. Click the delete icon (trash) in the Actions column
3. Confirm deletion in the dialog
4. The entry is permanently removed

### What does "Still Required" mean?

"Still Required" indicates whether the LDAP group is still needed. Use this flag to:
- Track groups that can be removed
- Identify obsolete groups
- Plan cleanup activities

### What does "Audit Cleanup Completed" mean?

"Audit Cleanup Completed" indicates whether cleanup actions have been completed for the group. Use this flag to:
- Track cleanup progress
- Ensure cleanup actions are completed
- Document completion status

### How do I update the review date?

1. Edit the entry
2. Select a date in the Review Date field
3. Save the entry

The review date should be updated after completing a review cycle.

### Can I search for entries?

Yes! The table includes a built-in search function that searches across all columns. Use it to find entries by:
- LDAP Common Name
- CMDB App ID
- Application Name
- Responsible Party
- Notes

### How do I view entries for a specific application?

You can:
1. Use the grouped view and expand the accordion for that application
2. Search for the application name or CMDB App ID
3. Navigate to the application's entity page and use the entity card

## Integration Questions

### How does catalog integration work?

The plugin automatically:
- Searches for catalog entities with `servicenow.com/appcode` annotations matching the CMDB App ID
- Enriches entries with application name, title, and owner
- Provides links to application entity pages
- Groups entries by application

### What annotation should catalog entities have?

Catalog entities should have the `servicenow.com/appcode` annotation:

```yaml
metadata:
  annotations:
    servicenow.com/appcode: "APP123"
```

The value should match the CMDB App ID in audit entries.

### Why isn't my entry showing application information?

Check that:
- The CMDB App ID in the entry matches the `servicenow.com/appcode` annotation
- The catalog entity exists and is accessible
- The catalog API is working correctly

### Can I use the plugin without catalog integration?

Yes! The plugin works without catalog integration. You can:
- Create entries without CMDB App ID
- Manually enter application information
- Use the plugin for tracking without linking to entities

However, catalog integration provides automatic enrichment and better organization.

## Troubleshooting

### The plugin page doesn't load

Check that:
- Plugin is properly registered in App.tsx
- Backend plugin is running
- Database connection is working
- Check browser console for JavaScript errors

### I can't create entries

Verify that:
- Backend API is accessible
- Database connection is working
- Required fields are filled in (LDAP Common Name)
- Check backend logs for errors

### Entries aren't showing application information

Check that:
- CMDB App ID matches catalog annotation
- Catalog entity exists
- Catalog API is accessible
- Annotation format is correct

### Entity card doesn't appear

Verify that:
- Entity card is added to entity page layout
- Entity has CMDB app code annotation
- Route is configured correctly
- Check browser console for errors

### Database errors

Check that:
- Database credentials are correct
- Database server is running
- Database exists and is accessible
- Migrations have run successfully
- Check backend logs for detailed errors

### Can't edit or delete entries

Verify that:
- You're authenticated in Backstage
- Backend API is accessible
- Entry exists and is accessible
- Check browser console and backend logs for errors

## Data Management

### What data is stored?

The plugin stores:
- LDAP group names
- CMDB App IDs
- Application information (name, owner)
- Responsible parties
- Usage information
- Status flags (Still Required, Audit Cleanup Completed)
- Review dates
- Usage notes
- Timestamps (created_at, updated_at)

### How is data secured?

- Data is stored in PostgreSQL database
- Access is controlled through Backstage's authentication system
- All API requests go through Backstage's standard auth
- Database access should be restricted to backend services

### Can I export audit data?

Currently, the plugin doesn't include built-in export functionality. You can:
- Query the database directly
- Use the API to retrieve data programmatically
- Copy data from the table view

### How do I backup audit data?

Backup the PostgreSQL database:

```bash
pg_dump backstage_plugin_system_audit > system_audit_backup.sql
```

### Can I import data?

The plugin doesn't include import functionality. You can:
- Use the API to create entries programmatically
- Insert data directly into the database (not recommended)
- Use the UI to manually enter data

## Best Practices

### Entry Management

- **Complete Information**: Fill in all relevant fields
- **Link to Applications**: Always provide CMDB App ID when possible
- **Regular Updates**: Keep entries current
- **Clear Notes**: Write clear, actionable usage notes
- **Status Accuracy**: Keep status flags accurate

### Review Process

- **Schedule Reviews**: Establish regular review cycles
- **Document Findings**: Always add notes when updating
- **Track Completion**: Use status flags to track progress
- **Follow Up**: Ensure cleanup actions are completed

### Organization

- **Use Grouped View**: Group by application for better organization
- **Consistent Naming**: Use consistent LDAP group naming
- **CMDB Alignment**: Ensure CMDB App IDs match catalog annotations
- **Regular Cleanup**: Remove or update obsolete entries

## Advanced Questions

### Can I customize the plugin?

The plugin is designed to be extensible. You can:
- Extend the data model through database migrations
- Add custom fields through form modifications
- Integrate with additional systems through the backend API
- Customize the UI through component modifications

### How do I handle large numbers of entries?

For large datasets:
- Use pagination (built into the table)
- Use search to filter entries
- Use grouped view to organize by application
- Consider database indexing for performance

### Can I integrate with other systems?

The plugin is designed to be extensible. You can:
- Add integrations through the backend API
- Extend the data model
- Add custom fields
- Integrate with reporting systems

### How do I update the plugin?

1. Update the package version in your `package.json`
2. Run `yarn install`
3. Review the changelog for new features and breaking changes
4. Run any required migrations
5. Test the updated plugin

## Support

### Where can I get help?

1. **Documentation**: Review the [Installation Guide](installation.md) and [Usage Guide](usage_guide.md)
2. **Logs**: Check application logs for detailed error information
3. **Community**: Reach out to the Backstage community
4. **Administrator**: Contact your system administrator for configuration issues

### How do I report bugs or request features?

- Check existing issues in the plugin repository
- Create detailed bug reports with steps to reproduce
- Include relevant logs and configuration information
- Provide context about your environment and setup

### What information should I include when asking for help?

When seeking support, include:
- Plugin version
- Backstage version
- Error messages and logs
- Configuration details (without sensitive information)
- Steps to reproduce the issue
- Environment information

---

For additional information, see the [Installation Guide](installation.md) and [Usage Guide](usage_guide.md) documents.
