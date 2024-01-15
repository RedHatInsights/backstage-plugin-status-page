# API Reference

#### To view the swagger doc for api go to [api:devex/feedback-plugin-api](/catalog/devex/api/feedback-plugin-api/definition).
---

### GET / - Get all feedbacks

Returns all feedback from database

- **Parameters**:

  | **Name**  | **Type** | **Description**                        |
  | --------- | -------- | -------------------------------------- |
  | query     | string   | Search Text                            |
  | projectId | string   | Fetch feedbacks for specific component |
  | limit \*  | number   | Number of feedbacks to fetch           |
  | offset \* | number   | Value of last feedback of current page |

- **Responses**:

  1. `status_code: 200`

     | **Code** | **Description**            |
     | -------- | -------------------------- |
     | 200      | Get array of all feedbacks |

     Response Object

     ```json
     {
       "data": [
         {
           "feedbackId": "string",
           "summary": "string",
           "projectId": "string",
           "description": "string",
           "url": "string",
           "userAgent": "string",
           "tag": "Good",
           "ticketUrl": "string",
           "createdBy": "string",
           "createdAt": "2024-01-12T11:06:51.465Z",
           "updatedBy": "string",
           "updatedAt": "2024-01-12T11:06:51.465Z",
           "feedbackType": "FEEDBACK"
         }
       ],
       "count": 0,
       "currentPage": 0,
       "pageSize": 0
     }
     ```

---

### POST / - Create new feedback

Creates feedback and creates ticket on Jira, Github, etc

- **Parameters**: `none`
- **Request Body**:
  ```json
  {
    "summary": "string",
    "projectId": "string",
    "description": "string",
    "url": "string",
    "userAgent": "string",
    "tag": "Good",
    "createdBy": "string",
    "updatedBy": "string",
    "feedbackType": "FEEDBACK"
  }
  ```
- **Responses**:

  1. `status_code: 201`

     | **Code** | **Description**               |
     | -------- | ----------------------------- |
     | 201      | Feedback created successfully |

     Response Object

     ```json
     {
       "message": "string",
       "data": {
         "feedbackId": "string",
         "projectId": "string"
       }
     }
     ```

  2. `status_code: 500`

     | **Code** | **Description** |
     | -------- | --------------- |
     | 500      | Error occured   |

     Response Object

     ```json
     {
       "error": "string"
     }
     ```

---

### GET /{feedbackId} - Get individual feedback

- **Parameters**: `none`
- **Responses**:

  1. `status_code: 200`

     | **Code** | **Description**      |
     | -------- | -------------------- |
     | 200      | Get feedbacks object |

     Response Object

     ```json
     {
       "feedbackId": "string",
       "summary": "string",
       "projectId": "string",
       "description": "string",
       "url": "string",
       "userAgent": "string",
       "tag": "Good",
       "ticketUrl": "string",
       "createdBy": "string",
       "createdAt": "2024-01-12T11:06:51.465Z",
       "updatedBy": "string",
       "updatedAt": "2024-01-12T11:06:51.465Z",
       "feedbackType": "FEEDBACK"
     }
     ```

  2. `status_code: 404`

     | **Code** | **Description**       |
     | -------- | --------------------- |
     | 404      | FeedbackId is invalid |

     Response Object:

     ```json
     {
       "error": "string"
     }
     ```

---

### GET /{feedbackId}/ticket - Get details of a Jira ticket

- **Paraameters**:

  | **Name**     | **Type** | **Description**             |
  | ------------ | -------- | --------------------------- |
  | ticketId \*  | string   | Ticket id of the feedback   |
  | projectId \* | string   | Entity ref of the component |

- **Responses**:

  1. `status_code: 200`

     | **Code** | **Description**                     |
     | -------- | ----------------------------------- |
     | 200      | Ticket details fetched successfully |

     Response object:

     ```json
     {
       "status": "string",
       "assignee": "string",
       "avatarUrls": {},
       "message": "string"
     }
     ```

  2. `status_code: 404`

     | **Code** | **Description**                |
     | -------- | ------------------------------ |
     | 404      | Failed to fetch ticket details |

     Response object:

     ```json
     {
       "error": "string"
     }
     ```
