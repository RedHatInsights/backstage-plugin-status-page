# XE System Audit Plugin Documentation

Welcome to the XE System Audit Plugin documentation. This plugin provides a solution for tracking and managing system groups and accounts exposed to external services for compliance and audit purposes within Backstage.

## Overview

The XE System Audit Plugin is a Backstage plugin designed to help organization track, manage, and audit system groups (LDAP groups) and accounts that are exposed to external services. The main goal of this plugin is to create a complete inventory of your Rover Groups and use it to track the progress of user access audits. By documenting which groups you own and where they're used, we'll establish a solid baseline for managing user permissions.

The plugin provides a structured approach to maintaining security standards and regulatory compliance by tracking which groups are still required, their usage, and audit completion status. Once groups are documented, the final step is to audit each group's members to ensure only those who still need access retain it.

## Purpose and Goals

### Primary Objectives

1. **Track External Exposures**: Monitor which system groups and accounts are exposed to external services
2. **Maintain Audit Trail**: Keep comprehensive records of group usage and audit status
3. **Ensure Compliance**: Track whether groups are still required and if audit cleanup is completed
4. **Link to Applications**: Connect audit entries to Backstage catalog entities via CMDB App ID
5. **Support Reviews**: Enable regular review cycles for system groups and accounts
6. **Document Usage**: Track who uses each group and for what purpose

### Key Benefits

- **Visibility**: Clear view of all externally exposed system groups and accounts
- **Compliance**: Track audit completion status and review dates
- **Integration**: Seamless integration with Backstage catalog entities
- **Management**: Easy creation, editing, and deletion of audit entries
- **Organization**: Group entries by application for better organization
- **Accountability**: Track responsible parties and usage information

## Key Features

### Main Audit Page
- **Comprehensive Table View**: Display all audit entries in a searchable, sortable table
- **Grouped View**: Option to group entries by CMDB App ID for better organization
- **Application Integration**: Automatic enrichment with application details from Backstage catalog
- **CRUD Operations**: Create, read, update, and delete audit entries
- **Status Tracking**: Visual indicators for "Still Required" and "Audit Completed" status

### Entity Card Component
- **Component-Specific View**: Display audit entries directly on Backstage entity pages
- **Filtered Display**: Shows only entries relevant to the current component
- **Quick Actions**: Add, edit, and delete entries without leaving the entity page
- **Accordion Interface**: Expandable entries for detailed information

### Data Management
- **LDAP Group Tracking**: Track LDAP common names (group names)
- **CMDB Integration**: Link entries to applications via CMDB App ID
- **Responsible Party**: Track who is responsible for each group
- **Usage Tracking**: Document who directly uses each group
- **Review Dates**: Track when reviews were last completed
- **Notes**: Store usage notes and additional information

## Quick Start

1. **Install the Plugin**: Follow the [installation guide](installation.md)
2. **Configure Database**: Set up the database connection
3. **Access the Plugin**: Navigate to `/compliance/system-audit` (through the Compliance Hub) or view entries on entity pages

![System Audit in Compliance Hub](images/system-audit-comliance-hub.png)

4. **Create Entries**: Add your first audit entry for a system group
5. **Link to Applications**: Ensure CMDB App IDs match your catalog entities
6. **Regular Reviews**: Use the plugin to track regular audit reviews

For detailed usage instructions, see the [Usage Guide](usage_guide.md).

## Architecture

The XE System Audit Plugin is built as a **dedicated, standalone plugin** with two separate components that work together:

### Dedicated Frontend Plugin (`@appdev/backstage-plugin-system-audit`)

A complete, dedicated user interface built specifically for system audit management:

- **Main Audit Page** (`/compliance/system-audit`): Standalone page with comprehensive table view, accessible through the Compliance Hub
  - Grouped view: Entries organized by CMDB App ID in expandable accordions
  - Flat view: All entries displayed in a single searchable, sortable table
  - Application integration: Automatic enrichment with application details from Backstage catalog
  - CRUD operations: Full create, read, update, and delete functionality
  - Status indicators: Visual chips for "Still Required" and "Audit Completed" status
  
- **Entity Card Component**: Component-specific view for Backstage entity pages
  - Filtered display showing only entries relevant to the current component
  - Quick actions: Add, edit, and delete entries without leaving the entity page
  - Accordion interface: Expandable entries for detailed information
  
- **Form Dialogs**: Dedicated forms for creating and editing audit entries
  - Field validation and user-friendly input controls
  - Integration with Backstage catalog for user and group lookups
  - Auto-generation of Rover links based on LDAP group names

### Dedicated Backend Plugin (`@appdev/backstage-plugin-system-audit-backend`)

A complete, dedicated backend service that handles all server-side operations:

- **REST API**: Full RESTful API for all CRUD operations
  - `GET /` - Retrieve all audit entries
  - `GET /:id` - Get a specific entry by ID
  - `POST /create-entry` - Create a new audit entry
  - `PUT /:id` - Update an existing entry
  - `DELETE /:id` - Delete an entry
  - `GET /health` - Health check endpoint
  
- **Database Operations**: Complete database layer
  - PostgreSQL database with dedicated schema
  - Automatic migrations on startup
  - Full CRUD operations with proper error handling
  
- **Catalog Integration**: Server-side integration with Backstage catalog
  - Entity lookup and enrichment
  - Application metadata retrieval

## Core Concepts

### Audit Entry

An audit entry represents a system group or account that is exposed to external services. Each entry contains:

- **LDAP Common Name**: The name of the LDAP group being tracked
- **CMDB App ID**: Links the entry to an application in the Backstage catalog
- **Responsible Party**: The person or team responsible for the group
- **Directly Used By**: List of entities that directly use this group
- **Still Required**: Boolean flag indicating if the group is still needed
- **Audit Cleanup Completed**: Boolean flag indicating if audit cleanup is done
- **Usage Notes**: Additional notes about the group's usage
- **Review Date**: Date when the last review was completed

### Application Linking

Entries are linked to Backstage catalog entities through the CMDB App ID. The plugin automatically:

- Searches for catalog entities with matching CMDB app code annotations
- Enriches entries with application name, title, and owner information
- Provides links to the application entity page
- Groups entries by application for better organization

### View Modes

The plugin supports two view modes:

1. **Grouped View**: Entries are organized by CMDB App ID in expandable accordions
2. **Flat View**: All entries displayed in a single table with all columns visible

## Data Model

### Core Fields

#### Required Fields
- **LDAP Common Name**: The LDAP group name (required)

#### Optional Fields
- **CMDB App ID**: Links to Backstage catalog entity
- **Application Name**: Name of the application (auto-populated from catalog)
- **Application Owner**: Owner of the application (auto-populated from catalog)
- **Rover Link**: Link to Rover system for additional information
- **Responsible Party**: Person or team responsible for the group
- **Directly Used By**: Array of entities that use this group
- **Still Required**: Boolean (default: true)
- **Audit Cleanup Completed**: Boolean (default: false)
- **Usage Notes**: Free-text notes about usage
- **Review Date**: Date of last review

### Database Schema

The plugin uses a PostgreSQL database with the following main table:

- **system_audit**: Stores all audit entries with timestamps for creation and updates

## Security and Compliance

### Data Security

- **Access Control**: Uses Backstage's built-in authentication system
- **Data Validation**: Input validation on all fields
- **Audit Trail**: Timestamps track when entries are created and updated

### Compliance Features

- **Review Tracking**: Track review dates and completion status
- **Status Monitoring**: Visual indicators for audit completion
- **Documentation**: Usage notes and responsible party tracking
- **Integration**: Links to external systems (Rover) for additional context

## User Roles and Permissions

### All Users
- View audit entries
- Create new entries
- Edit existing entries
- Delete entries
- View entries on entity pages

### Application Owners
- View entries for their applications
- Manage entries linked to their applications
- Access enriched application information

## Workflow Examples

### Rover Groups Audit Process

The main goal of this process is to create a complete inventory of your Rover Groups and use it to track the progress of user access audits. By documenting which groups you own and where they're used, we'll establish a solid baseline for managing user permissions.

The typical workflow involves:

1. **Documentation Phase**: Identify all Rover Groups you own from the [Rover Groups Page](https://rover.redhat.com/groups/) and create audit entries in the plugin for each group
2. **Audit Phase**: Review group membership and remove users who have changed roles, changed teams, or no longer need access
3. **Completion Phase**: Update audit completion status and review dates in the plugin entries

**Important Note**: Rover automatically removes users who have left the company, so your focus should be on finding users who have changed roles or teams, or no longer need access to the resources provided by the group.

For detailed step-by-step instructions on the Rover Groups audit process, see the [Usage Guide](usage_guide.md#rover-groups-audit-process).

### Adding a New Audit Entry

1. Navigate to the System Audit page or entity page
2. Click "Add Entry" button
3. Fill in the required fields (LDAP Common Name)
4. Optionally link to an application via CMDB App ID
5. Set responsible party and usage information
6. Mark status flags (Still Required, Audit Completed)
7. Save the entry

### Reviewing Audit Entries

1. View entries grouped by application or in flat view
2. Review each entry's status and information
3. Update "Still Required" flag if group is no longer needed
4. Mark "Audit Cleanup Completed" when cleanup is done
5. Update review date after completing review
6. Add notes about findings or actions taken

### Managing Entries on Entity Pages

1. Navigate to a Backstage entity page
2. View the System Audit card (if entries exist)
3. Add new entries specific to that component
4. Edit or delete existing entries
5. View enriched information from the catalog

## Best Practices

### For Compliance Teams

- **Regular Reviews**: Schedule regular review cycles for all entries
- **Status Updates**: Keep "Still Required" and "Audit Completed" flags current
- **Documentation**: Add clear usage notes for each entry
- **Organization**: Use CMDB App ID to link entries to applications
- **Cleanup**: Mark entries as cleanup completed when appropriate

### For Application Owners

- **Maintain Entries**: Keep entries for your applications up to date
- **Review Regularly**: Conduct regular reviews of exposed groups
- **Document Usage**: Clearly document who uses each group and why
- **Update Status**: Update review dates and completion status

### For Administrators

- **Database Maintenance**: Regular database backups and maintenance
- **Monitoring**: Monitor entry creation and update patterns
- **Training**: Ensure users understand the plugin's purpose and usage
- **Integration**: Verify catalog integration is working correctly

## Future Enhancements

The plugin is designed for extensibility and future enhancements:

- **Additional Integrations**: Support for more external systems
- **Advanced Filtering**: More sophisticated filtering and search capabilities
- **Reporting**: Export capabilities for compliance reporting
- **Automation**: Automated review reminders and notifications
- **Bulk Operations**: Bulk update capabilities for multiple entries
- **Workflow Integration**: Integration with audit workflow systems

## Getting Help

- Check the [FAQ](faq.md) for common questions and solutions
- Review the [installation guide](installation.md) for setup issues
- Use the [usage guide](usage_guide.md) for detailed interface instructions
- Contact your system administrator for configuration assistance

## Version Information

Current Version: 1.1.0
Last Updated: January 2025

For detailed version history and changes, see the [CHANGELOG.md](../CHANGELOG.md) file.

## Conclusion

The XE System Audit Plugin provides a focused solution for tracking and managing system groups and accounts exposed to external services. By integrating with the Backstage catalog and providing both standalone and entity-specific views, it helps organizations maintain visibility and compliance for externally exposed system resources.

For detailed implementation instructions, see the [Installation Guide](installation.md). For comprehensive usage instructions, refer to the [Usage Guide](usage_guide.md). For common questions and troubleshooting, see the [FAQ](faq.md).

