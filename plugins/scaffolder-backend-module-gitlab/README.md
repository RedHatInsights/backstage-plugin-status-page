# scaffolder-backend-module-gitlab-custom

This is a Backstage backend module that provides custom GitLab scaffolder actions for forking repositories and creating merge requests.

## Features

- **`gitlab:repo:fork`** - Forks a GitLab repository to the user's namespace
  - Automatically checks if fork already exists before creating
  - Reuses existing forks to save time
  - Handles GitLab's asynchronous fork creation
  - Returns fork information for subsequent actions

- **`gitlab:create-mr-upstream`** - Creates a merge request from a fork to upstream
  - Creates MR from forked repository to original repository
  - Supports custom titles, descriptions, and branch names
  - Optional assignee and remove source branch settings
  - Note: Named differently from `publish:gitlab:merge-request` to avoid confusion

## Installation

1. Install the module in your backend:

```bash
yarn --cwd packages/backend add @compass/backstage-plugin-scaffolder-backend-module-gitlab-custom
```

2. Add to your backend in `packages/backend/src/index.ts`:

```typescript
backend.add(import('@compass/backstage-plugin-scaffolder-backend-module-gitlab-custom'));
```

3. Configure your GitLab integration in `app-config.yaml`:

```yaml
integrations:
  gitlab:
    - host: gitlab.example.com
      token: ${GITLAB_TOKEN}
      apiBaseUrl: https://gitlab.example.com/api/v4
```

## Usage in Templates

### Fork a Repository

```yaml
steps:
  - id: fork-repo
    name: Fork Repository
    action: gitlab:repo:fork
    input:
      repoUrl: gitlab.example.com/group/repo
      name: my-custom-fork-name  # Optional

outputs:
  forkUrl: ${{ steps['fork-repo'].output.forkUrl }}
  projectId: ${{ steps['fork-repo'].output.projectId }}
  owner: ${{ steps['fork-repo'].output.owner }}
  repo: ${{ steps['fork-repo'].output.repo }}
```

### Create a Merge Request

```yaml
steps:
  - id: create-mr
    name: Create Merge Request
    action: gitlab:create-mr-upstream
    input:
      repoUrl: gitlab.example.com/group/repo
      sourceBranch: my-feature-branch
      targetBranch: main
      forkProjectId: ${{ steps['fork-repo'].output.projectId }}
      title: Add new feature
      description: |
        ## Description
        This MR adds a new feature
      removeSourceBranch: true  # Optional
      assignee: username  # Optional

outputs:
  mergeRequestUrl: ${{ steps['create-mr'].output.mergeRequestUrl }}
```

### Complete Workflow Example

```yaml
apiVersion: scaffolder.backstage.io/v1beta3
kind: Template
metadata:
  name: graphql-client-setup
  title: GraphQL Client Setup
spec:
  parameters:
    - title: Client Information
      required:
        - clientName
      properties:
        clientName:
          type: string
          title: Client Name

  steps:
    # 1. Fork the repository
    - id: fork-repo
      name: Fork Repository
      action: gitlab:repo:fork
      input:
        repoUrl: gitlab.example.com/ciam-s/client-enablements

    # 2. Push changes to fork
    - id: publish
      name: Publish to Fork
      action: gitlab:repo:push
      input:
        repoUrl: gitlab.example.com?repo=${{ steps['fork-repo'].output.repo }}&owner=${{ steps['fork-repo'].output.owner }}
        branchName: add-client-${{ parameters.clientName }}
        commitMessage: Add client configuration

    # 3. Create merge request
    - id: create-mr
      name: Create Merge Request
      action: gitlab:create-mr-upstream
      input:
        repoUrl: gitlab.example.com/ciam-s/client-enablements
        sourceBranch: add-client-${{ parameters.clientName }}
        targetBranch: main
        forkProjectId: ${{ steps['fork-repo'].output.projectId }}
        title: Add client configuration for ${{ parameters.clientName }}
```

## Features

### Smart Fork Detection

The `gitlab:repo:fork` action intelligently handles existing forks:

- **First run**: Creates a new fork (~30-60 seconds)
- **Subsequent runs**: Reuses existing fork (instant!)
- Verifies fork is from correct source repository
- Provides clear logging of fork status

### Optimized for Multiple Submissions

Perfect for templates that need multiple submissions to the same repository:

```
Run 1: Creates fork + creates branch + creates MR
Run 2: Reuses fork + creates new branch + creates new MR (30s faster!)
Run 3: Reuses fork + creates new branch + creates new MR (30s faster!)
```

## Action Outputs

### gitlab:repo:fork

| Output | Type | Description |
|--------|------|-------------|
| `forkUrl` | string | URL of the forked repository |
| `projectId` | string | GitLab project ID of the fork |
| `projectPath` | string | Full path (namespace/repo) |
| `owner` | string | Owner/namespace of the fork |
| `repo` | string | Repository name |
| `defaultBranch` | string | Default branch name |

### gitlab:create-mr-upstream

| Output | Type | Description |
|--------|------|-------------|
| `mergeRequestUrl` | string | URL of the created merge request |

## Requirements

- GitLab token with `api`, `read_repository`, `write_repository` scopes
- GitLab integration configured in app-config.yaml
- Backstage scaffolder backend

## License

Apache-2.0

