# Installation Guide

This guide provides detailed instructions for installing and configuring the Audit Compliance Plugin in your Backstage instance.

## Prerequisites

Before installing the plugin, ensure you have:

- **Backstage Instance**: A working Backstage application (version 1.40.1 or higher)
- **Node.js**: Version 16 or higher
- **Yarn**: Package manager for dependency management
- **PostgreSQL**: Database for storing audit data
- **External System Access**: Access to JIRA, GitLab, and Rover APIs

## Installation Steps

### Step 1: Install Frontend Plugin

The frontend plugin is typically already included in the example app. To verify or install:

```bash
# Navigate to your Backstage root directory
cd /path/to/your/backstage-app

# Check if the plugin is already installed
yarn list @appdev-platform/backstage-plugin-audit-compliance

# If not installed, add it to your app
yarn add @appdev-platform/backstage-plugin-audit-compliance
```

### Step 2: Install Backend Plugin

Install the backend plugin in your backend package:

```bash
# From your Backstage root directory
yarn --cwd packages/backend add @appdev-platform/backstage-plugin-audit-compliance-backend
```

### Step 3: Register the Backend Plugin

Add the backend plugin to your backend's main file:

```typescript
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other plugins ...

// Add the audit compliance backend plugin
backend.add(import('@appdev-platform/backstage-plugin-audit-compliance-backend'));

// ... rest of your backend configuration ...
```

### Step 4: Configure Frontend Plugin

Add the frontend plugin to your app:

```typescript
// packages/app/src/App.tsx
import { AuditCompliancePage } from '@appdev-platform/backstage-plugin-audit-compliance';

// In your app's routing configuration
<Route path="/audit-compliance" element={<AuditCompliancePage />} />
```

## Configuration

### Frontend Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
auditCompliance:
  jiraUrl: https://your-jira-instance.com
```

### Backend Configuration

Add the following configuration to your `app-config.yaml`:

```yaml
auditCompliance:
  # Rover Configuration
  roverUsername: your-rover-username
  roverPassword: your-rover-password
  roverBaseUrl: https://your-rover-instance.com/api
  
  # JIRA Configuration
  jiraUrl: https://your-jira-instance.com
  jiraToken: your-jira-api-token
  
  # GitLab Configuration
  gitlabToken: your-gitlab-api-token
  gitlabBaseUrl: https://your-gitlab-instance.com/api/v4
  
  # Email Configuration
  email:
    host: your-smtp-host.com
    port: 587
    secure: true
    from: audit-compliance@your-company.com
    caCert: /path/to/your/ca-cert.pem
```

### Environment Variables

For security, you can use environment variables for sensitive configuration:

```yaml
auditCompliance:
  roverUsername: ${ROVER_USERNAME}
  roverPassword: ${ROVER_PASSWORD}
  jiraToken: ${JIRA_TOKEN}
  gitlabToken: ${GITLAB_TOKEN}
  email:
    host: ${SMTP_HOST}
    port: ${SMTP_PORT}
    secure: ${SMTP_SECURE}
    from: ${SMTP_FROM}
    caCert: ${SMTP_CA_CERT}
```

## Database Setup

### Step 1: Create Database

Create a PostgreSQL database for the audit compliance plugin:

```sql
CREATE DATABASE audit_compliance;
CREATE USER audit_compliance_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE audit_compliance TO audit_compliance_user;
```

### Step 2: Configure Database Connection

Add database configuration to your `app-config.yaml`:

```yaml
backend:
  database:
    client: pg
    connection:
      host: localhost
      port: 5432
      database: audit_compliance
      user: audit_compliance_user
      password: your-secure-password
```

### Step 3: Run Migrations

The plugin includes database migrations. Run them to set up the required tables:

```bash
# From the backend plugin directory
cd plugins/audit-compliance-backend

# Run migrations
yarn knex migrate:latest
```

## External System Configuration

### JIRA Configuration

1. **Generate API Token**:
   - Log into your JIRA instance
   - Go to Profile Settings → Security → API tokens
   - Create a new API token
   - Copy the token for configuration

2. **Verify Permissions**:
   - Ensure the token has permissions to:
     - Create issues
     - Update issues
     - View project information

### GitLab Configuration

1. **Generate Access Token**:
   - Log into your GitLab instance
   - Go to User Settings → Access Tokens
   - Create a new token with `api` scope
   - Copy the token for configuration

2. **Verify Permissions**:
   - Ensure the token has access to:
     - Repository information
     - User and group data
     - Service account information

### Rover Configuration

1. **Obtain Credentials**:
   - Contact your Rover administrator
   - Request API access credentials
   - Verify the base URL for your Rover instance

2. **Test Connection**:
   - Verify the credentials work with the Rover API
   - Test user and group data retrieval

### Email Configuration

1. **SMTP Settings**:
   - Obtain SMTP server details from your email provider
   - Configure authentication if required
   - Test email delivery

2. **SSL/TLS Configuration**:
   - Configure SSL/TLS settings based on your SMTP provider
   - Add CA certificate if required for secure connections

## Verification

### Step 1: Start the Application

```bash
# From your Backstage root directory
yarn start
```

### Step 2: Access the Plugin

1. Open your browser and navigate to your Backstage instance
2. Go to `/audit-compliance`
3. Verify the plugin loads without errors

### Step 3: Test Basic Functionality

1. **Add Test Application**:
   - Click "Add Application"
   - Fill in test data
   - Submit the form
   - Verify the application appears in the list

2. **Test Integrations**:
   - Check that JIRA integration works
   - Verify GitLab data retrieval
   - Test Rover user information

## Troubleshooting

### Common Issues

#### Plugin Not Loading

**Symptoms**: Plugin page shows error or doesn't load

**Solutions**:
- Check browser console for JavaScript errors
- Verify plugin is properly registered in App.tsx
- Check network requests for API errors

#### Database Connection Issues

**Symptoms**: Database-related errors in logs

**Solutions**:
- Verify database credentials
- Check database server is running
- Ensure database exists and is accessible
- Run migrations if tables are missing

#### Integration Failures

**Symptoms**: External system integrations not working

**Solutions**:
- Verify API tokens and credentials
- Check network connectivity to external systems
- Verify API endpoints are correct
- Check permissions for API tokens

#### Email Notifications Not Working

**Symptoms**: No email notifications received

**Solutions**:
- Verify SMTP configuration
- Check email server connectivity
- Test email delivery manually
- Verify "from" email address is valid

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
   - Monitor query performance
   - Consider database connection pooling

2. **API Rate Limiting**:
   - Be aware of external API rate limits
   - Implement appropriate caching strategies
   - Monitor API usage and performance

3. **Memory Usage**:
   - Monitor memory usage during bulk operations
   - Implement pagination for large datasets
   - Optimize data loading and caching

## Security Considerations

### Access Control

1. **User Authentication**:
   - Ensure Backstage authentication is properly configured
   - Verify user roles and permissions
   - Implement appropriate access controls

2. **API Security**:
   - Use HTTPS for all external API communications
   - Secure storage of API tokens and credentials
   - Implement proper error handling to avoid information disclosure

3. **Data Protection**:
   - Encrypt sensitive data at rest
   - Implement proper data retention policies
   - Ensure compliance with data protection regulations

### Network Security

1. **Firewall Configuration**:
   - Allow access to required external APIs
   - Restrict access to database ports
   - Implement proper network segmentation

2. **SSL/TLS Configuration**:
   - Use SSL/TLS for all external communications
   - Verify certificate validity
   - Configure proper cipher suites

## Maintenance

### Regular Tasks

1. **Database Maintenance**:
   - Regular database backups
   - Monitor database performance
   - Clean up old audit data as needed

2. **Integration Monitoring**:
   - Monitor external API health
   - Verify integration credentials are still valid
   - Update API tokens as needed

3. **Plugin Updates**:
   - Keep the plugin updated to the latest version
   - Review changelog for breaking changes
   - Test updates in staging environment first

### Backup and Recovery

1. **Database Backups**:
   ```bash
   # Create database backup
   pg_dump audit_compliance > audit_compliance_backup.sql
   
   # Restore database
   psql audit_compliance < audit_compliance_backup.sql
   ```

2. **Configuration Backups**:
   - Backup your `app-config.yaml` file
   - Document any custom configurations
   - Store credentials securely

## Support

For additional support:

1. **Documentation**: Review the [FAQ](faq.md) and [Introduction](introduction.md)
2. **Logs**: Check application logs for detailed error information
3. **Community**: Reach out to the Backstage community
4. **Administrator**: Contact your system administrator for configuration issues

## Next Steps

After successful installation:

1. **User Training**: Train users on the audit workflow
2. **Process Documentation**: Document your organization's audit processes
3. **Integration Testing**: Test all integrations thoroughly
4. **Go-Live**: Deploy to production environment
5. **Monitoring**: Set up monitoring and alerting for the plugin

For detailed usage instructions, see the [Introduction](introduction.md) and [FAQ](faq.md) documents.
