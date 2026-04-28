# How to Create a Jenkins Pipeline from SCM

## Prerequisites

### 1. Jenkins Setup
- Jenkins controller running (in this repo, via `docker-compose.jenkins-infra.yml`)
- Jenkins accessible via Cloudflare tunnel or direct URL

### 2. Add SSH Credential in Jenkins
1. Go to **Manage Jenkins** → **Manage Credentials**
2. Click **Add Credentials** (or select global store)
3. **Kind**: SSH Username with private key
4. **Username**: `git`
5. **Private Key**: paste your GitHub SSH private key (the one you use locally)
6. **ID**: give it a meaningful name like `github-ssh`
7. Click **Create**

### 3. Jenkinsfile in Repository
Create your Jenkinsfile in the repo. Examples:
- `pipelines/Jenkinsfile` - main pipeline
- `simple-pipeline-scm/Jenkinsfile` - test pipeline
- `pipeline-scm-push/Jenkinsfile` - build and push pipeline

## Create a New Pipeline Job

### Step 1: Create New Job
1. Jenkins home → **New Item**
2. Enter a job name (e.g., `auth-pipeline`)
3. Choose **Pipeline** job type
4. Click **OK**

### Step 2: Configure Pipeline Source
1. Scroll to **Pipeline** section
2. **Definition**: select **Pipeline script from SCM**
3. **SCM**: choose **Git**

### Step 3: Git Configuration
1. **Repository URL**: 
   ```
   git@github.com:almat101/jenkins-migration-secure-ecommerce.git
   ```
2. **Credentials**: select the SSH credential you created (`github-ssh`)
3. **Branch Specifier**: `*/main` (or your branch name)
4. **Script Path**: path to your Jenkinsfile:
   ```
   pipelines/Jenkinsfile
   ```

### Step 4: Build Triggers (Optional)
To automatically run on GitHub push:
1. Check **GitHub hook trigger for GITScm polling**
2. (Requires webhook configured on GitHub, or use manual polling instead)

### Step 5: Save & Test
1. Click **Save**
2. Click **Build Now** to test
3. Check **Console Output** for errors

## Pipeline Runs From Workspace Root

When Jenkins runs a pipeline:
1. Clones the entire repo to `${JENKINS_HOME}/workspace/job-name/`
2. Executes pipeline from that root directory
3. Your Makefile and scripts must be relative to that root

Example workspace structure:
```
workspace/
├── pipelines/
│   └── Jenkinsfile          ← Script path points here
├── backend/
├── frontend/
├── Makefile                 ← Pipeline can access this
├── docker-compose.yml
└── ... (all repo contents)
```

## Multiple Pipelines in One Repo

Create different jobs for different pipelines, all from the same repo:

| Job Name | Script Path | Purpose |
|----------|-------------|---------|
| auth-pipeline | `pipelines/Jenkinsfile` | Auth service tests |
| java-pipeline | `backend/Jenkinsfile.java` | Java project build |
| push-pipeline | `pipeline-scm-push/Jenkinsfile` | Build & push to GHCR |

Each job points to the same repo but different Jenkinsfile paths.