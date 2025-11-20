# Installation Guide

This guide provides detailed instructions for installing and configuring the XE System Audit Plugin in your Backstage instance.

## Prerequisites

Before installing the plugin, ensure you have:

- **Backstage Instance**: A working Backstage application
- **Node.js**: Version 16 or higher
- **Yarn**: Package manager for dependency management
- **PostgreSQL**: Database for storing audit data
- **Backstage Catalog**: Configured catalog with entities that have CMDB app code annotations (optional but recommended)

## Installation Steps

### Step 1: Install Frontend Plugin

Install the frontend plugin in your app package:

```bash
# Navigate to your Backstage root directory
cd /path/to/your/backstage-app

# Install the frontend plugin
yarn add @appdev/backstage-plugin-system-audit
```

### Step 2: Install Backend Plugin

Install the backend plugin in your backend package:

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @appdev/backstage-plugin-system-audit-backend
```

### Step 3: Register the Backend Plugin

Add the backend plugin to your backend's main file:

```typescript
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other plugins ...

// Add the system audit backend plugin
backend.add(import('@appdev/backstage-plugin-system-audit-backend'));

// ... rest of your backend configuration ...
```

### Step 4: Configure Frontend Plugin

Add the frontend plugin to your app with the main page and entity card:

```typescript
// packages/app/src/App.tsx
import { SystemAuditPage } from '@appdev/backstage-plugin-system-audit';

// In your app's routing configuration (under Compliance Hub)
<Route path="/compliance/system-audit" element={<SystemAuditPage />} />
```

### Step 5: Add Entity Card (Optional)

To display audit entries on entity pages, add the entity card component:

```typescript
// packages/app/src/components/catalog/EntityPage.tsx
import { EntitySystemAuditCard } from '@appdev/backstage-plugin-system-audit';

// In your entity page layout
<EntityLayout.Route path="/system-audit" title="System Audit">
  <EntitySystemAuditCard />
</EntityLayout.Route>
```

## Configuration

### Frontend Configuration

No special frontend configuration is required. The plugin uses Backstage's standard discovery API to locate the backend.

### Backend Configuration

The backend plugin uses Backstage's standard database service. Ensure your database configuration is set up in `app-config.yaml`:

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

### Environment Variables

For security, you can use environment variables for database configuration:

```yaml
backend:
  database:
    client: pg
    connection:
      host: ${DATABASE_HOST}
      port: ${DATABASE_PORT}
      database: ${DATABASE_NAME}
      user: ${DATABASE_USER}
      password: ${DATABASE_PASSWORD}
```

## Database Setup

### Step 1: Create Database

Create a PostgreSQL database for the XE System Audit Plugin:

```sql
CREATE DATABASE backstage_plugin_system_audit;
CREATE USER system_audit_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE backstage_plugin_system_audit TO system_audit_user;
```

### Step 2: Configure Database Connection

Add database configuration to your `app-config.yaml` (as shown above).

### Step 3: Run Migrations

The plugin includes database migrations that run automatically when the backend starts. The migrations create the `system_audit` table with the following schema:

- `id`: Primary key (auto-increment)
- `app_name`: Application name (nullable)
- `application_owner`: Application owner (nullable)
- `cmdb_app_id`: CMDB application ID (nullable)
- `ldap_common_name`: LDAP group name (required)
- `rover_link`: Link to Rover system (nullable)
- `responsible_party`: Responsible party (nullable)
- `directly_used_by`: JSON array of users (stored as text, nullable)
- `still_required`: Boolean (default: true)
- `audit_cleanup_completed`: Boolean (default: false)
- `usage_notes`: Usage notes (nullable)
- `review_date`: Review date (nullable)
- `created_at`: Creation timestamp
- `updated_at`: Update timestamp

Migrations run automatically on backend startup. To manually run migrations:

```bash
# From the backend plugin directory
cd plugins/system-audit-backend

# Run migrations
yarn knex migrate:latest
```

## Catalog Integration (Optional)

To enable automatic enrichment of audit entries with application information, ensure your catalog entities have the CMDB app code annotation:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-application
  annotations:
    servicenow.com/appcode: "APP123"  # This links to cmdb_app_id in audit entries
spec:
  type: service
  owner: team-a
```

The plugin will automatically:
- Search for entities with matching `servicenow.com/appcode` annotations
- Enrich entries with application name, title, and owner
- Provide links to the application entity page
- Group entries by application

## Verification

### Step 1: Start the Application

```bash
# From your Backstage root directory
yarn start
```

### Step 2: Access the Plugin

1. Open your browser and navigate to your Backstage instance
2. Go to `/compliance/system-audit` to access the main audit page (accessible through the Compliance Hub)
3. Verify the plugin loads without errors
4. Check that the table displays correctly (may be empty initially)

### Step 3: Test Basic Functionality

1. **Create Test Entry**:
   - Click "Add Entry" button
   - Fill in required fields (LDAP Common Name)
   - Optionally add CMDB App ID if you have catalog entities
   - Submit the form and verify the entry appears in the table

2. **Test Entity Card** (if configured):
   - Navigate to a component entity page
   - Find the System Audit card
   - Verify it displays entries for that component (if any exist)
   - Test adding an entry from the entity page

3. **Test CRUD Operations**:
   - Edit an existing entry
   - Delete an entry
   - Verify changes are reflected in the table

## Troubleshooting

### Common Issues

#### Plugin Not Loading

**Symptoms**: Plugin page shows error or doesn't load

**Solutions**:
- Check browser console for JavaScript errors
- Verify plugin is properly registered in App.tsx
- Check network requests for API errors
- Ensure backend plugin is running

#### Database Connection Issues

**Symptoms**: Database-related errors in logs

**Solutions**:
- Verify database credentials in app-config.yaml
- Check database server is running
- Ensure database exists and is accessible
- Verify migrations have run (check for `system_audit` table)
- Check backend logs for migration errors

#### API Errors

**Symptoms**: API requests failing or returning errors

**Solutions**:
- Verify backend plugin is registered correctly
- Check backend logs for detailed error messages
- Ensure database connection is working
- Verify API routes are accessible

#### Entity Card Not Showing

**Symptoms**: Entity card doesn't appear on entity pages

**Solutions**:
- Verify EntitySystemAuditCard is added to EntityPage.tsx
- Check that the route is configured correctly
- Ensure the entity has the correct annotations (if using CMDB integration)
- Check browser console for errors

#### Catalog Integration Not Working

**Symptoms**: Entries not enriched with application information

**Solutions**:
- Verify catalog entities have `servicenow.com/appcode` annotations
- Check that CMDB App ID in entries matches the annotation value
- Ensure catalog API is accessible
- Verify entity search is working

### Logs and Debugging

Enable debug logging by setting the log level:

```yaml
backend:
  logging:
    level: debug
```

Check logs for detailed error information:

```bash
# View backend logs
yarn workspace backend start

# View frontend logs in browser console
```

### Performance Considerations

1. **Database Optimization**:
   - Ensure proper indexing on frequently queried columns
   - Monitor query performance for large datasets
   - Consider database connection pooling

2. **Catalog API Calls**:
   - The plugin makes catalog API calls to enrich entries
   - For large numbers of entries, this may impact performance
   - Consider caching or batching catalog lookups

3. **Memory Usage**:
   - Monitor memory usage with large datasets
   - Implement pagination if needed for very large entry lists

## Security Considerations

### Access Control

1. **User Authentication**:
   - Ensure Backstage authentication is properly configured
   - Verify user roles and permissions
   - The plugin uses Backstage's standard authentication

2. **API Security**:
   - API endpoints use Backstage's standard authentication
   - No special security configuration required
   - All requests go through Backstage's auth system

3. **Data Protection**:
   - Sensitive data (LDAP names, responsible parties) is stored in the database
   - Ensure database access is properly secured
   - Consider encryption at rest for sensitive information

### Network Security

1. **Database Access**:
   - Restrict database access to backend services only
   - Use secure database connections
   - Implement proper firewall rules

2. **Internal Communication**:
   - Frontend and backend communicate through Backstage's standard APIs
   - No external network access required
   - All communication is internal to your Backstage instance

## Maintenance

### Regular Tasks

1. **Database Maintenance**:
   - Regular database backups
   - Monitor database performance
   - Clean up old entries as needed (if retention policy is implemented)

2. **Plugin Updates**:
   - Keep the plugin updated to the latest version
   - Review changelog for breaking changes
   - Test updates in staging environment first

3. **Catalog Integration**:
   - Monitor catalog integration health
   - Verify annotation format is consistent
   - Update entries if annotation values change

### Backup and Recovery

1. **Database Backups**:
   ```bash
   # Create database backup
   pg_dump backstage_plugin_system_audit > system_audit_backup.sql
   
   # Restore database
   psql backstage_plugin_system_audit < system_audit_backup.sql
   ```

2. **Configuration Backups**:
   - Backup your `app-config.yaml` file
   - Document any custom configurations
   - Store database credentials securely

## Support

For additional support:

1. **Documentation**: Review the [FAQ](faq.md) and [Introduction](index.md)
2. **Logs**: Check application logs for detailed error information
3. **Community**: Reach out to the Backstage community
4. **Administrator**: Contact your system administrator for configuration issues

## Next Steps

After successful installation:

1. **Create Initial Entries**: Add your first audit entries
2. **Configure Catalog Integration**: Ensure catalog entities have proper annotations
3. **Set Up Entity Cards**: Add entity cards to relevant entity pages
4. **User Training**: Train users on plugin usage
5. **Establish Workflows**: Define processes for regular reviews
6. **Go-Live**: Deploy to production environment

For detailed usage instructions, see the [Usage Guide](usage_guide.md) and [FAQ](faq.md) documents.

