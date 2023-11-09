# muse-cron

Service for cron tasks

Only admin can use API of this service to manually run tasks

API endpoints available on backend api domain with path `/api/v1/cron/`

## Prerequisites

* **NodeJS 18**

## Deployment

Service deployed in **AWS ECS** via **ECR**

Auth configured in **Firebase Auth**

Domain configured in **Cloudflare**

## Deploy instructions

### Env variables
To update **env variables**, you should create new task definition revision with updated envs
in AWS ECS and **manually update service** with that task definition

### Dev

Dev deploy happening automatically on commit to **main**

### Prod

Before production deployment be sure that **commit** you wanted to deploy **has already been deployed on dev**

Production deployment happens automatically on git tag event on **main** branch with `prod-` prefix

```bash
git fetch
git checkout main
git pull
git tag prod-XXX
git push --tags
```
