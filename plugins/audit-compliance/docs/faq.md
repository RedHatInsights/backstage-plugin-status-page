# Frequently Asked Questions (FAQ)

This document provides answers to common questions about the Audit Compliance Plugin.

## General Questions

### What is the Audit Compliance Plugin?

The Audit Compliance Plugin is a Backstage plugin designed to help organizations manage, track, and automate application audits and compliance workflows. It provides a structured approach to maintaining security standards and regulatory compliance through systematic access reviews and audit processes.

### What are the main components of the plugin?

The plugin consists of two main components:

- **Frontend Plugin** (`audit-compliance`): Provides the user interface, application management, and audit workflow
- **Backend Plugin** (`audit-compliance-backend`): Handles API endpoints, database operations, and external system integrations

### What external systems does the plugin integrate with?

The plugin integrates with:
- **JIRA**: For ticket creation and tracking
- **GitLab**: For repository and service account information
- **Rover**: For user and group management
- **Email**: For automated notifications

### Who can use this plugin?

The plugin supports different user roles:
- **Application Owners**: Can perform final sign-off and manage their applications
- **Application Delegates**: Can act on behalf of application owners
- **Auditors**: Can review user and service account access
- **Administrators**: Can manage the overall audit process and configurations

## Installation & Setup

### How do I install the plugin?

#### Frontend Plugin
```bash
# From your Backstage root directory
yarn add @compass/backstage-plugin-audit-compliance
```

#### Backend Plugin
```bash
# From your Backstage root directory
yarn --cwd packages/backend add @compass/backstage-plugin-audit-compliance-backend
```

### What configuration is required?

#### Frontend Configuration
```yaml
auditCompliance:
  jiraUrl: https://your-jira-instance.com
```

#### Backend Configuration
```yaml
auditCompliance:
  roverUsername: your-username
  roverPassword: your-password
  roverBaseUrl: https://your-rover-instance.com/api
  jiraUrl: https://your-jira-instance.com
  jiraToken: your-jira-api-token
  gitlabToken: your-gitlab-api-token
  gitlabBaseUrl: https://your-gitlab-instance.com/api/v4
  email:
    host: your-smtp-host.com
    port: 587
    secure: true
    from: audit-compliance@your-company.com
    caCert: /path/to/your/ca-cert.pem
```

### Can I run the plugin in isolation for development?

Yes! For local development:

**Frontend:**
```bash
cd plugins/audit-compliance
yarn start
```

**Backend:**
```bash
cd plugins/audit-compliance-backend
yarn start
```

### What database does the plugin use?

The plugin uses PostgreSQL for data storage. You need to:
1. Create a PostgreSQL database
2. Configure the database connection in your `app-config.yaml`
3. Run the included migrations to set up the required tables

## Usage Questions

### How do I add a new application for audit?

1. Navigate to `/audit-compliance` in your Backstage app
2. Click the "Add Application" button
3. Fill in the required fields:
   - Application Name (must be unique)
   - CMDB ID
   - Environment
   - App Owner
   - App Owner Email
   - JIRA Project
4. Configure account entries if needed
5. Click "Submit"

### What are the audit workflow steps?

The audit process follows these 5 steps:
1. **Audit Started**: Initial audit process initiated
2. **Details Under Review**: Audit details being reviewed
3. **Final Sign-off Done**: Final sign-off completed
4. **Summary Generated**: Audit summary ready for review
5. **Completed**: Audit process finished successfully

### How do I perform user access reviews?

1. Navigate to the application details page
2. Go to the "User Access Reviews" tab
3. Review each user's access permissions
4. Click "Approve" or "Reject" for each user
5. Add comments explaining your decision
6. Use bulk actions for multiple users if needed

### How do I perform service account reviews?

1. Navigate to the application details page
2. Go to the "Service Account Reviews" tab
3. Review each service account's permissions
4. Click "Approve" or "Reject" for each account
5. Add or update comments as needed
6. Use bulk actions for multiple accounts if needed

### Who can perform final sign-off?

Only application owners or delegates can perform final sign-off. The system automatically checks your permissions based on your user identity and the application's owner configuration.

### How do I track audit progress?

The plugin provides a visual progress stepper that shows:
- Current audit stage
- Completed steps (with checkmarks)
- Upcoming steps
- Overall progress percentage

### Can I use bulk operations?

Yes! The plugin supports bulk actions for:
- Approving multiple user access reviews
- Rejecting multiple user access reviews
- Approving multiple service account reviews
- Rejecting multiple service account reviews

## Integration Questions

### How does JIRA integration work?

- JIRA tickets are automatically created for audit-related issues
- Project keys are configured during application onboarding
- The integration uses the configured JIRA URL and API token
- Tickets include relevant audit information and status updates

### How does GitLab integration work?

- Provides access to repository information
- Service account information can be pulled from GitLab
- Access reviews can reference GitLab permissions
- Uses the configured GitLab URL and API token

### How does Rover integration work?

- Provides user and group information
- Account entries can reference Rover groups
- User access information is synchronized with Rover
- Uses the configured Rover credentials and base URL

### How do email notifications work?

- Automated notifications are sent for important audit events
- Notifications include audit status updates and required actions
- Email configuration is handled in the backend settings
- Templates can be customized for your organization

## Troubleshooting

### What if I get "Application already exists" error?

Use a different application name. The system enforces unique application names to prevent conflicts. Check your existing applications to see what names are already in use.

### Why can't I perform final sign-off?

Check that:
- You are the application owner or delegate
- All user and service account reviews are completed
- The audit is in the correct stage for final sign-off
- Your user identity matches the application's owner configuration

### What if user data is missing?

Verify that:
- Rover integration is properly configured
- User data is being synchronized correctly
- The user exists in the Rover system
- API credentials have proper permissions

### Why aren't email notifications working?

Check that:
- SMTP configuration is correct in backend settings
- Email server is accessible from your Backstage instance
- "From" email address is properly configured
- Firewall allows SMTP traffic

### What if JIRA integration isn't working?

Verify that:
- JIRA URL is correct and accessible
- API token is valid and has proper permissions
- JIRA project key exists and is accessible
- Network connectivity to JIRA is working

### What if GitLab integration isn't working?

Check that:
- GitLab URL is correct
- API token has the required scopes (api)
- User has access to the repositories being queried
- Network connectivity to GitLab is working

### How do I update the plugin?

1. Update the package version in your `package.json`
2. Run `yarn install`
3. Review the changelog for new features and breaking changes
4. Update configuration if required
5. Test the updated plugin in a staging environment

### What happens if an audit fails or is incomplete?

- Incomplete audits remain in their current stage
- Users can continue from where they left off
- The system maintains all progress and data
- Administrators can intervene if needed
- No data is lost during the process

## Advanced Questions

### Can I customize the audit workflow?

The current version has a predefined workflow, but you can:
- Configure email templates
- Customize notification settings
- Modify integration endpoints
- Adjust review criteria
- Extend the plugin through the API

### How is data stored and secured?

- Data is stored in a PostgreSQL database
- Sensitive information (tokens, passwords) is encrypted
- Access is controlled through Backstage's authentication system
- Audit trails are maintained for all actions
- Data retention policies can be configured

### Can I export audit reports?

Currently, the plugin generates summaries within the interface. For external reporting, you can:
- Use the generated audit summaries
- Access the activity stream for detailed logs
- Integrate with external reporting tools through the API
- Export data through database queries

### How do I handle bulk operations?

The plugin supports bulk actions for:
- Approving multiple user access reviews
- Rejecting multiple user access reviews
- Approving multiple service account reviews
- Rejecting multiple service account reviews

To use bulk operations:
1. Select multiple items using checkboxes
2. Choose the desired action (approve/reject)
3. Add comments if needed
4. Confirm the bulk action

### How do I manage user permissions?

User permissions are managed through:
- Backstage's built-in authentication system
- Application owner/delegate assignments
- Role-based access controls
- Integration with external identity systems

### Can I integrate with other systems?

The plugin is designed to be extensible. You can:
- Add new integrations through the backend API
- Customize email templates and notifications
- Extend the audit workflow
- Add new review types or criteria
- Integrate with custom reporting systems

### What are the performance considerations?

- Monitor database performance for large datasets
- Be aware of external API rate limits
- Use bulk operations for efficiency
- Implement appropriate caching strategies
- Monitor memory usage during bulk operations

### How do I backup and restore audit data?

#### Database Backups
```bash
# Create database backup
pg_dump audit_compliance > audit_compliance_backup.sql

# Restore database
psql audit_compliance < audit_compliance_backup.sql
```

#### Configuration Backups
- Backup your `app-config.yaml` file
- Document any custom configurations
- Store credentials securely

### What monitoring should I set up?

Consider monitoring:
- Database performance and connectivity
- External API health and response times
- Email delivery success rates
- Audit completion rates
- User activity and engagement
- Error rates and system health

### How do I handle plugin updates?

1. Review the changelog for breaking changes
2. Test updates in a staging environment
3. Backup your database and configuration
4. Update the plugin packages
5. Run any required migrations
6. Verify functionality in production

## Best Practices

### For Application Owners

- Schedule regular access reviews
- Respond promptly to audit requests
- Provide clear justification for decisions
- Properly delegate responsibilities when needed
- Keep application information up to date

### For Auditors

- Conduct comprehensive access reviews
- Provide clear comments and justification
- Use bulk operations for large user sets
- Apply consistent criteria across reviews
- Document any special circumstances

### For Administrators

- Maintain proper integration configurations
- Monitor audit completion and compliance rates
- Ensure users understand the audit process
- Continuously improve the audit workflow
- Set up proper monitoring and alerting

### For Developers

- Follow security best practices
- Document custom integrations
- Test thoroughly before deployment
- Monitor performance and error rates
- Keep dependencies updated

## Support

### Where can I get help?

1. **Documentation**: Review the [Installation Guide](installation.md) and [Introduction](introduction.md)
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

For additional information, see the [Installation Guide](installation.md) and [Introduction](introduction.md) documents. 