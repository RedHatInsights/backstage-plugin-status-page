# User Guide

This guide provides detailed instructions for using the Audit Compliance Plugin interface based on the actual screens and features available in the application.

## Table of Contents

1. [Main Dashboard](#main-dashboard)
2. [Application Onboarding](#application-onboarding)
3. [Audit Details Section](#audit-details-section)
4. [User Access Reviews](#user-access-reviews)
5. [Service Account Reviews](#service-account-reviews)
6. [Activity Stream](#activity-stream)
7. [Progress Tracking](#progress-tracking)
8. [JIRA Integration](#jira-integration)
9. [Email Notifications](#email-notifications)

## Main Dashboard

### Overview
The main dashboard displays all applications that have been added to the audit system. This is the primary entry point for managing audit workflows.

### Features Available

#### Application List Display
- **Grid Layout**: Applications are displayed in a responsive grid layout
- **Application Cards**: Each application is shown in a card format containing:
  - Application name (formatted from hyphen-case to title case)
  - Application owner information
  - CMDB ID displayed as a chip
  - "More Details" button for navigation

#### Add Application Button
- **Location**: Top-right corner of the "Applications for Audit" card
- **Function**: Opens the application onboarding modal
- **Icon**: Plus icon indicating addition functionality

#### Empty State
- **Trigger**: When no applications exist in the system
- **Display**: Shows a message indicating no applications found
- **Action**: Provides an "Add App for Audit" button to start the onboarding process

#### Navigation
- **More Details Button**: Navigates to the detailed audit view for each application
- **URL Pattern**: `/audit-compliance/{app_name}`

### How to Use

1. **View Applications**: The dashboard automatically loads and displays all applications
2. **Add New Application**: Click the "Add Application" button to start onboarding
3. **Access Details**: Click "More Details" on any application card to view audit information
4. **Refresh Data**: The application list refreshes automatically after adding new applications

## Application Onboarding

### Overview
The application onboarding form allows users to add new applications to the audit system. This is a modal dialog that appears when the "Add Application" button is clicked.

### Form Fields

#### Required Fields
- **Application Name**: Unique identifier for the application
  - Tooltip: "Enter a unique name for your application"
  - Validation: Must be unique across the system
- **CMDB ID**: Configuration Management Database identifier
  - Tooltip: "Enter the unique CMDB identifier for this application"
- **Environment**: Application environment specification
  - Tooltip: "Specify the environment (e.g., production, staging) for this application"
- **App Owner**: Primary owner of the application
- **App Owner Email**: Email address of the application owner
- **JIRA Project**: JIRA project key for integration

#### Optional Fields
- **App Delegate**: Secondary contact for the application

#### Account Entries Section
- **Dynamic Fields**: Users can add multiple account entries
- **Account Type**: Defaults to "rover-group-name"
- **Source**: Defaults to "rover"
- **Account Name**: User-defined account identifier
- **Add/Remove**: Buttons to add or remove account entries

### Form Features

#### Validation
- Required field validation with red asterisks
- Duplicate application name checking
- Form submission validation

#### User Interface Elements
- **Tooltips**: Information icons with helpful descriptions
- **Dynamic Fields**: Add/remove account entries as needed
- **Form Sections**: Organized into logical groups
- **Submit Button**: Processes the form and creates the application

#### Error Handling
- **Duplicate Application**: Shows specific error for existing application names
- **Validation Errors**: Displays field-specific error messages
- **Success Messages**: Confirms successful application creation

### How to Use

1. **Open Form**: Click "Add Application" from the main dashboard
2. **Fill Required Fields**: Complete all fields marked with red asterisks
3. **Configure Accounts**: Add account entries if needed using the add/remove buttons
4. **Submit**: Click submit to create the application
5. **Review**: Check for success/error messages
6. **Close**: Modal closes automatically on successful submission

## Audit Details Section

### Overview
The audit details section provides comprehensive information and controls for managing individual application audits. This screen is accessed via the "More Details" button from the main dashboard.

### Header Information

#### Navigation
- **Back Button**: Returns to the previous page
- **Breadcrumbs**: Shows current location in the application
- **Application Name**: Displays the current application being audited

#### Status Information
- **Audit Progress**: Visual indicator of current audit stage
- **Completion Status**: Shows whether the audit is completed
- **Final Sign-off Status**: Indicates if final sign-off has been performed

### Action Buttons

#### Final Sign-off Button
- **Visibility**: Only available to application owners or delegates
- **Function**: Completes the audit process
- **Validation**: Checks that all reviews are completed before allowing sign-off
- **Confirmation**: Requires user confirmation before processing

#### Generate Summary Button
- **Function**: Creates a comprehensive audit summary
- **Availability**: Available when audit is in appropriate stage
- **Output**: Generates detailed report of audit results

### Tab Navigation

The interface includes multiple tabs for different aspects of the audit:

1. **User Access Reviews**: Management of user access permissions
2. **Service Account Reviews**: Management of service account access
3. **Activity Stream**: Historical audit activities and changes

## User Access Reviews

### Overview
The User Access Reviews tab displays a comprehensive table of users requiring access review for the selected application.

### Table Features

#### Data Display
- **User Information**: User ID, name, and source system
- **Access Details**: Current access permissions and roles
- **Review Status**: Pending, approved, or rejected status
- **Review Information**: Reviewer, review date, and comments
- **JIRA Integration**: Ticket references and status

#### Table Controls

##### Selection
- **Checkbox Selection**: Select individual or multiple users
- **Bulk Selection**: Select all users in the current view
- **Selection Counter**: Shows number of selected items

##### Actions
- **Approve**: Approve access for selected users
- **Reject**: Reject access for selected users
- **Bulk Approve**: Approve multiple users simultaneously
- **Bulk Reject**: Reject multiple users simultaneously

#### Individual User Actions

##### Approve Action
- **Function**: Approves user access
- **Updates**: Sets status to approved, records reviewer and timestamp
- **Clears**: Removes any existing ticket references

##### Reject Action
- **Function**: Rejects user access
- **JIRA Integration**: Opens JIRA ticket creation modal
- **Email Integration**: Option to send notification emails
- **Comments**: Allows adding rejection comments

##### Comment Updates
- **Edit Comments**: Modify existing review comments
- **Save Comments**: Update comments for individual users
- **Loading States**: Shows progress during comment updates

### JIRA Integration

#### Ticket Creation
- **Modal Interface**: Dedicated JIRA ticket creation dialog
- **Fields**: Description and comments fields
- **Validation**: Ensures description is provided
- **Loading States**: Shows progress during ticket creation

#### Ticket Management
- **Ticket References**: Links to created JIRA tickets
- **Status Tracking**: Monitors ticket status
- **Integration**: Automatic ticket creation for rejections

### Email Integration

#### Email Modal
- **Recipient Selection**: Choose email recipients
- **Message Customization**: Customize email content
- **Sending**: Process email notifications
- **Success Feedback**: Confirms successful email delivery

### Export Features

#### Data Export
- **CSV Export**: Export user data to CSV format
- **PDF Export**: Export user data to PDF format
- **Filtered Export**: Export only selected or filtered data

#### Export Controls
- **Export Buttons**: Available in table toolbar
- **Format Selection**: Choose between CSV and PDF
- **Data Scope**: Export all data or selected items only

## Service Account Reviews

### Overview
The Service Account Reviews tab manages service account access permissions and reviews.

### Table Features

#### Data Display
- **Service Account Information**: Account name and identifier
- **Access Details**: Current permissions and access levels
- **Review Status**: Pending, approved, or rejected status
- **Review Information**: Reviewer, review date, and comments
- **JIRA Integration**: Ticket references and status

#### Table Controls

##### Selection
- **Checkbox Selection**: Select individual or multiple service accounts
- **Bulk Selection**: Select all service accounts in the current view
- **Selection Counter**: Shows number of selected items

##### Actions
- **Approve**: Approve access for selected service accounts
- **Reject**: Reject access for selected service accounts
- **Bulk Approve**: Approve multiple service accounts simultaneously
- **Bulk Reject**: Reject multiple service accounts simultaneously

#### Individual Service Account Actions

##### Approve Action
- **Function**: Approves service account access
- **Updates**: Sets status to approved, records reviewer and timestamp
- **Clears**: Removes any existing ticket references

##### Reject Action
- **Function**: Rejects service account access
- **JIRA Integration**: Opens JIRA ticket creation modal
- **Email Integration**: Option to send notification emails
- **Comments**: Allows adding rejection comments

##### Comment Updates
- **Edit Comments**: Modify existing review comments
- **Save Comments**: Update comments for individual service accounts
- **Loading States**: Shows progress during comment updates

### JIRA Integration

#### Ticket Creation
- **Modal Interface**: Same JIRA ticket creation dialog as user reviews
- **Fields**: Description and comments fields
- **Validation**: Ensures description is provided
- **Loading States**: Shows progress during ticket creation

#### Ticket Management
- **Ticket References**: Links to created JIRA tickets
- **Status Tracking**: Monitors ticket status
- **Integration**: Automatic ticket creation for rejections

### Email Integration

#### Email Modal
- **Recipient Selection**: Choose email recipients
- **Message Customization**: Customize email content
- **Sending**: Process email notifications
- **Success Feedback**: Confirms successful email delivery

### Export Features

#### Data Export
- **CSV Export**: Export service account data to CSV format
- **PDF Export**: Export service account data to PDF format
- **Filtered Export**: Export only selected or filtered data

#### Export Controls
- **Export Buttons**: Available in table toolbar
- **Format Selection**: Choose between CSV and PDF
- **Data Scope**: Export all data or selected items only

## Activity Stream

### Overview
The Activity Stream tab provides a chronological view of all audit activities and changes for the selected application.

### Features

#### Activity Display
- **Chronological Order**: Activities listed by timestamp
- **Action Details**: Description of each activity performed
- **User Information**: Shows who performed each action
- **Timestamps**: When each activity occurred

#### Activity Types
- **Review Actions**: Approvals and rejections
- **Status Changes**: Changes in audit status
- **Comment Updates**: Modifications to review comments
- **System Events**: Automated system activities

### Navigation
- **Tab Access**: Available through the main audit details interface
- **Real-time Updates**: Activity stream updates as actions are performed

## Progress Tracking

### Overview
The progress tracking system provides visual feedback on the current stage of the audit process.

### Progress Stepper

#### Visual Elements
- **Step Icons**: Visual indicators for each audit stage
- **Progress Indicators**: Shows current and completed steps
- **Step Labels**: Clear descriptions of each stage
- **Completion Status**: Visual confirmation of completed steps

#### Audit Stages
1. **Audit Started**: Initial audit process initiation
2. **Details Under Review**: Audit details being reviewed
3. **Final Sign-off Done**: Final sign-off completed
4. **Summary Generated**: Audit summary ready for review
5. **Completed**: Audit process finished successfully

#### Interactive Features
- **Tooltips**: Hover information for each step
- **Status Updates**: Real-time progress updates
- **Visual Feedback**: Clear indication of current stage

### Status Indicators

#### Completion Status
- **In Progress**: Audit is currently being worked on
- **Completed**: Audit has been finished
- **Pending**: Audit is waiting for action

#### Sign-off Status
- **Not Signed Off**: Final sign-off not yet performed
- **Signed Off**: Final sign-off completed
- **Ineligible**: User not authorized for sign-off

## JIRA Integration

### Overview
The JIRA integration provides seamless ticket creation and management for audit-related issues.

### JIRA Modal

#### Interface Elements
- **Modal Dialog**: Dedicated JIRA ticket creation interface
- **Title Field**: Pre-filled ticket title (read-only)
- **Description Field**: Editable description for the ticket
- **Comments Field**: Additional comments for the ticket
- **Submit Button**: Creates the JIRA ticket

#### Form Validation
- **Required Fields**: Description is mandatory
- **Error Handling**: Shows validation messages
- **Loading States**: Indicates progress during ticket creation

#### Integration Features
- **Automatic Creation**: Tickets created automatically for rejections
- **Status Tracking**: Monitors ticket status in the system
- **Reference Linking**: Links tickets to specific audit items

### Ticket Management

#### Ticket References
- **Display**: Shows ticket references in review tables
- **Linking**: Direct links to JIRA tickets
- **Status Updates**: Real-time status from JIRA

#### Automatic Integration
- **Rejection Tickets**: Automatically created when access is rejected
- **Status Synchronization**: Updates ticket status in audit system
- **Reference Storage**: Stores ticket information with audit records

## Email Notifications

### Overview
The email notification system allows users to send notifications related to audit activities.

### Email Modal

#### Interface Elements
- **Recipient Selection**: Choose email recipients
- **Message Fields**: Customize email content
- **Send Button**: Process email delivery
- **Loading States**: Shows progress during sending

#### Email Features
- **Customization**: Customize email content and recipients
- **Integration**: Seamless integration with audit workflow
- **Success Feedback**: Confirms successful email delivery
- **Error Handling**: Shows error messages if sending fails

### Notification Types

#### Rejection Notifications
- **Trigger**: Sent when access is rejected
- **Content**: Includes rejection details and next steps
- **Recipients**: Relevant stakeholders and affected users

#### Status Updates
- **Trigger**: Sent for important audit status changes
- **Content**: Includes current status and required actions
- **Recipients**: Application owners and delegates

### Email Configuration
- **SMTP Settings**: Configured in backend settings
- **Template Support**: Customizable email templates
- **Delivery Tracking**: Monitor email delivery success

## Data Management

### Overview
The system provides comprehensive data management capabilities for audit information.

### Export Functionality

#### Export Formats
- **CSV Export**: Export data in comma-separated values format
- **PDF Export**: Export data in portable document format
- **Data Selection**: Export all data or selected items only

#### Export Controls
- **Export Buttons**: Available in table toolbars
- **Format Selection**: Choose between available formats
- **Scope Control**: Export filtered or selected data

### Data Filtering

#### Table Filters
- **Status Filtering**: Filter by review status
- **User Filtering**: Filter by user information
- **Date Filtering**: Filter by review dates
- **Search Functionality**: Text-based search across data

#### Filter Controls
- **Filter Panels**: Dedicated filter interfaces
- **Quick Filters**: Pre-defined filter options
- **Clear Filters**: Reset all applied filters

### Data Refresh

#### Automatic Updates
- **Real-time Updates**: Data updates as actions are performed
- **Status Synchronization**: Keeps data current with external systems
- **Background Refresh**: Updates data without user intervention

#### Manual Refresh
- **Refresh Buttons**: Manual data refresh controls
- **Loading Indicators**: Shows progress during refresh
- **Error Handling**: Displays errors if refresh fails

## Error Handling

### Overview
The system provides comprehensive error handling and user feedback mechanisms.

### Error Types

#### Validation Errors
- **Form Validation**: Field-specific validation messages
- **Business Rules**: Application-specific validation
- **User Feedback**: Clear error messages and guidance

#### System Errors
- **Network Errors**: Connection and API errors
- **Server Errors**: Backend service errors
- **Integration Errors**: External system integration issues

### Error Display

#### Error Messages
- **Alert Notifications**: Temporary error notifications
- **Modal Dialogs**: Detailed error information
- **Inline Errors**: Field-specific error indicators

#### Error Recovery
- **Retry Options**: Automatic and manual retry mechanisms
- **Fallback Behavior**: Graceful degradation when services fail
- **User Guidance**: Clear instructions for resolving errors

### Success Feedback

#### Success Messages
- **Action Confirmation**: Confirms successful operations
- **Status Updates**: Shows current system status
- **Progress Indicators**: Visual feedback for long-running operations

#### User Notifications
- **Toast Messages**: Temporary success notifications
- **Status Changes**: Visual status updates
- **Completion Indicators**: Clear indication of completed tasks

## Navigation and User Interface

### Overview
The user interface provides intuitive navigation and consistent user experience across all screens.

### Navigation Structure

#### Main Navigation
- **Dashboard**: Primary application list view
- **Application Details**: Detailed audit management
- **Tab Navigation**: Switch between different audit aspects

#### Breadcrumb Navigation
- **Location Tracking**: Shows current position in application
- **Quick Navigation**: Direct links to parent pages
- **Context Information**: Provides application context

### User Interface Elements

#### Consistent Design
- **Material-UI Components**: Standardized component library
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: Screen reader and keyboard navigation support

#### Interactive Elements
- **Buttons**: Primary and secondary action buttons
- **Forms**: Consistent form design and validation
- **Tables**: Sortable and filterable data tables
- **Modals**: Overlay dialogs for focused interactions

### Loading States

#### Visual Feedback
- **Progress Indicators**: Shows loading progress
- **Skeleton Screens**: Placeholder content during loading
- **Loading Messages**: Clear indication of what is loading

#### State Management
- **Loading States**: Prevents user interaction during operations
- **Error States**: Shows error information when operations fail
- **Success States**: Confirms successful operations
