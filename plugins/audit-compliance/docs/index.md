# Audit Access Manager Plugin Documentation

Welcome to the Audit Access Manager Plugin documentation. This plugin provides a comprehensive solution for managing application audits and compliance workflows within Backstage.

## Overview

The Audit Access Manager Plugin is a comprehensive Backstage plugin designed to streamline and automate the process of application audits and compliance management. It provides organizations with a structured, repeatable approach to maintaining security standards and regulatory compliance through two complementary interfaces: the **Compliance Manager** for bulk operations and the **Audit Access Manager** for detailed individual application management.

### Video Overview

For a comprehensive overview of the Audit Access Manager Plugin, watch our introductory video:

[**Audit Access Manager Overview**](https://videos.learning.redhat.com/media/Audit%20Access%20Manager%20Overview/1_47mwunlt)

This video provides a high-level introduction to the plugin's capabilities, interfaces, and key features.

## Purpose and Goals

### Primary Objectives

1. **Standardize Audit Processes**: Provide a consistent framework for application audits across the organization
2. **Automate Compliance Workflows**: Reduce manual effort through automated notifications and integrations
3. **Enable Bulk Operations**: Streamline compliance management with bulk audit initiation and monitoring
4. **Ensure Accountability**: Track all audit activities with proper authorization and sign-off processes
5. **Maintain Security Standards**: Regular review of user access and service account permissions
6. **Generate Compliance Reports**: Create comprehensive audit trails for regulatory requirements

### Key Benefits

- **Reduced Manual Effort**: Automated workflows and bulk operations
- **Improved Visibility**: Real-time progress tracking and status updates
- **Enhanced Security**: Systematic review of access permissions
- **Regulatory Compliance**: Comprehensive audit trails and documentation
- **Integration Efficiency**: Seamless connection with existing tools and systems
- **Scalable Management**: Handle multiple audits simultaneously with compliance dashboard

## Key Features

### Compliance Manager Interface
- **Compliance Dashboard**: High-level overview with summary statistics
- **Bulk Audit Operations**: Initiate multiple audits with quarterly/yearly scheduling
- **Two-Step Audit Dialog**: Streamlined workflow for bulk audit configuration
- **Ongoing Audits Monitoring**: Comprehensive view of all applications and audit status
- **Global Activity Stream**: Real-time visibility into all audit activities

### Audit Access Manager Interface
- **Application Onboarding**: Streamlined process for adding applications to the audit workflow
- **Application Management**: Edit, delete, and manage application details
- **Progress Tracking**: Visual progress stepper showing audit stages and completion status
- **User Access Reviews**: Comprehensive review system for user permissions and access
- **Service Account Management**: Dedicated workflow for service account access reviews
- **Bulk Operations**: Efficient processing of multiple reviews simultaneously
- **Integration Support**: Seamless integration with JIRA, GitLab, and Rover
- **Email Notifications**: Automated notifications for audit events and status updates
- **Activity Tracking**: Complete audit trail and history for compliance reporting

## Quick Start

1. **Install the Plugin**: Follow the [installation guide](installation.md)
2. **Configure Integrations**: Set up JIRA, GitLab, and Rover connections
3. **Add Applications**: Onboard your first application for audit
4. **Use Compliance Manager**: Monitor compliance status and initiate bulk audits
5. **Manage Individual Audits**: Use Audit Access Manager for detailed audit workflows
6. **Complete Reviews**: Perform user and service account reviews
7. **Final Sign-off**: Complete audits with proper authorization

## Architecture

The plugin consists of two main components:

- **Frontend Plugin** (`audit-compliance`): User interface and workflow management. Includes two main interfaces:
  - **Compliance Manager**: Bulk operations, compliance dashboard, and monitoring
  - **Audit Access Manager**: Application management, progress tracking, review interfaces, and activity monitoring
- **Backend Plugin** (`audit-compliance-backend`): API endpoints, database operations, and external integrations. Handles server-side operations, database management, integrations, and business logic.

## Core Concepts

### Dual Interface Design

The plugin provides two complementary interfaces for different use cases:

#### Compliance Manager (`/compliance-manager-new`)
- **Target Users**: Compliance teams, administrators, and oversight personnel
- **Primary Functions**: 
  - Monitor compliance status across all applications
  - Initiate bulk audits with scheduling
  - Track ongoing audit progress
  - View global activity stream
- **Key Features**: Summary cards, bulk actions, two-step audit dialog, ongoing audits table

#### Audit Access Manager (`/audit-compliance`)
- **Target Users**: Application owners, delegates, and auditors
- **Primary Functions**:
  - Manage individual application audits
  - Perform detailed access reviews
  - Track audit progress and completion
  - Handle application onboarding and management
- **Key Features**: Application cards, detailed audit workflows, review tables, progress tracking

### Audit Workflow

The plugin implements a structured 5-step audit process:

1. **Audit Started**: Initial audit process initiation
2. **Details Under Review**: Comprehensive review of application details
3. **Final Sign-off Done**: Authorization and approval completion
4. **Summary Generated**: Audit report compilation
5. **Completed**: Final audit completion and documentation

### Application Onboarding

Applications are onboarded through a structured process that captures:

- **Basic Information**: Name, CMDB ID, environment
- **Ownership**: Owner and delegate assignments
- **Integration Details**: JIRA project, account configurations
- **Access Requirements**: User and service account specifications
- **JIRA Metadata**: Dynamic custom fields from JIRA integration

### Access Review Process

The plugin supports two types of access reviews:

#### User Access Reviews
- Review individual user permissions
- Approve or reject access based on business needs
- Add comments and justification for decisions
- Bulk operations for efficiency
- JIRA ticket creation for rejections

#### Service Account Reviews
- Review service account permissions and access
- Validate service account necessity and scope
- Update comments and track changes
- Ensure proper access controls
- Integration with external systems

### Final Sign-off

The final sign-off process ensures:

- **Authorization**: Only application owners/delegates can sign off
- **Completeness**: All reviews must be completed before sign-off
- **Documentation**: Comprehensive audit trail is maintained
- **Compliance**: Regulatory requirements are met

## Supported Integrations

- **JIRA**: Ticket creation and tracking. Automatic ticket creation, status updates, project linking, custom field integration. Configured via JIRA URL and API token.
- **GitLab**: Repository and service account information. Service account discovery, permission validation. Configured via GitLab URL and API token.
- **Rover**: User and group management. User discovery, group membership, access validation. Configured via Rover credentials and base URL.
- **Email**: Automated notifications and status updates. Audit notifications, status updates, completion alerts. Configured via SMTP settings and templates.

## Data Model

### Core Entities

#### Applications
- Unique application identifiers
- Owner and delegate information
- Environment and configuration details
- Integration settings
- JIRA metadata fields

#### Audits
- Audit instances and progress tracking
- Status and completion information
- Timestamps and activity history
- Bulk audit configurations

#### Access Reviews
- User and service account reviews
- Approval/rejection status
- Comments and justification
- Reviewer information
- JIRA ticket references

#### Activity Stream
- Complete audit trail
- Action timestamps
- User and system activities
- Change history
- Global activity monitoring

## Security and Compliance

### Data Security

- **Encryption**: Sensitive data is encrypted at rest and in transit
- **Access Control**: Role-based access through Backstage authentication
- **Audit Trails**: Complete logging of all actions and changes
- **Data Retention**: Configurable retention policies for audit data
- **Permission Validation**: User identity matching for sensitive operations

### Compliance Features

- **Regulatory Alignment**: Designed to meet common compliance requirements
- **Documentation**: Comprehensive audit trails and reports
- **Authorization**: Proper approval workflows and sign-off processes
- **Monitoring**: Real-time status tracking and alerting
- **Bulk Operations**: Efficient compliance management at scale

## User Roles and Permissions

### Application Owner
- Can perform final sign-off
- Manage application configuration
- View all audit activities
- Receive notifications
- Delete applications (owner-only feature)

### Application Delegate
- Can act on behalf of application owners
- Perform final sign-off when authorized
- Manage application settings
- Access audit information

### Auditor
- Review user and service account access
- Approve or reject access requests
- Add comments and justification
- Use bulk operations for efficiency

### Compliance Manager/Administrator
- Monitor compliance status across all applications
- Initiate bulk audits with scheduling
- Access compliance dashboard and statistics
- View global activity stream
- Manage overall audit process and configurations

## Workflow Examples

### Bulk Audit Management (Compliance Manager)

1. **Dashboard Overview**: View compliance summary cards showing total applications, completed audits, and in-progress audits
2. **Bulk Initiation**: Use bulk actions bar to initiate multiple audits
3. **Two-Step Configuration**: Select applications and configure audit frequency (quarterly/yearly)
4. **Monitoring**: Track ongoing audits in the comprehensive table view
5. **Activity Tracking**: Monitor global activity stream for all audit activities

### Individual Application Audit (Audit Access Manager)

1. **Onboarding**: Application owner adds application to the system
2. **Initial Review**: System generates user and service account lists
3. **Access Reviews**: Auditors review and approve/reject access
4. **Final Sign-off**: Application owner completes the audit
5. **Summary**: System generates comprehensive audit report

### Periodic Access Review

1. **Scheduled Review**: System initiates periodic review process
2. **Data Synchronization**: Latest access information is pulled from integrations
3. **Review Assignment**: Reviews are assigned to appropriate auditors
4. **Completion**: Reviews are completed and signed off
5. **Documentation**: Audit results are documented and archived

## Best Practices

### For Compliance Managers

- **Regular Monitoring**: Use compliance dashboard to track overall compliance status
- **Bulk Operations**: Leverage bulk audit initiation for efficiency
- **Scheduling**: Plan quarterly and yearly audit cycles
- **Activity Monitoring**: Monitor global activity stream for compliance insights

### For Application Owners

- **Regular Reviews**: Schedule regular access reviews
- **Timely Responses**: Respond promptly to audit requests
- **Clear Documentation**: Provide clear justification for decisions
- **Delegation**: Properly delegate responsibilities when needed
- **Application Management**: Keep application details up to date

### For Auditors

- **Thorough Reviews**: Conduct comprehensive access reviews
- **Documentation**: Provide clear comments and justification
- **Efficiency**: Use bulk operations for large user sets
- **Consistency**: Apply consistent criteria across reviews

### For Administrators

- **Configuration**: Maintain proper integration configurations
- **Monitoring**: Monitor audit completion and compliance rates
- **Training**: Ensure users understand both interfaces
- **Improvement**: Continuously improve the audit workflow

## Future Enhancements

The plugin is designed for extensibility and future enhancements:

- **Additional Integrations**: Support for more external systems
- **Advanced Reporting**: Enhanced reporting and analytics capabilities
- **Workflow Customization**: Configurable audit workflows
- **Machine Learning**: Automated access review recommendations
- **Mobile Support**: Mobile-friendly interfaces for field audits
- **Enhanced Bulk Operations**: More sophisticated bulk management features

## Getting Help

- Check the [FAQ](faq.md) for common questions and solutions
- Review the [installation guide](installation.md) for setup issues
- Use the [usage guide](usage_guide.md) for detailed interface instructions
- Contact your system administrator for configuration assistance

## Version Information

Current Version: 1.10.0
Last Updated: January 2025

For detailed version history and changes, see the [CHANGELOG.md](../CHANGELOG.md) file.

## Conclusion

The Audit Access Manager Plugin provides a robust, scalable solution for managing application audits and compliance requirements. By offering both bulk compliance management and detailed individual audit workflows, it helps organizations maintain security standards while reducing administrative overhead. The dual-interface design ensures that both compliance teams and application owners have the tools they need to effectively manage audit processes.

For detailed implementation instructions, see the [Installation Guide](installation.md). For comprehensive usage instructions, refer to the [Usage Guide](usage_guide.md). For common questions and troubleshooting, see the [FAQ](faq.md). 