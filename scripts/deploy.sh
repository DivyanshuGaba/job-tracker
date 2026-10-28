#!/bin/bash
# Deploys the API image, runs migrations, and publishes the frontend to AWS.
# Usage: scripts/deploy.sh [all|backend|frontend]  (run from the repo root, signed in with aws login)
set -euo pipefail

WHAT="${1:-all}"
export AWS_DEFAULT_REGION=eu-north-1
export AWS_PAGER=""
CLUSTER=jobtracker
SERVICE=jobtracker-api
REPO=jobtracker-backend
BUCKET=jobtracker-dg-frontend-2026

for tool in aws docker node python3 git; do
  command -v "$tool" > /dev/null || { echo "Missing tool: ${tool}"; exit 1; }
done
case "$WHAT" in all|backend|frontend) ;; *) echo "Use: all, backend or frontend"; exit 1 ;; esac

ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
REGISTRY="${ACCOUNT}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
TAG=$(git rev-parse --short=7 HEAD)
echo "Deploying ${WHAT} at commit ${TAG}"

if [ -n "$(git status --porcelain backend frontend)" ]; then
  echo "Uncommitted changes in backend or frontend. Commit them first so the image tag matches the code."
  exit 1
fi

deploy_backend() {
  local image="${REGISTRY}/${REPO}:${TAG}"
  aws ecr get-login-password | docker login --username AWS --password-stdin "$REGISTRY"
  if aws ecr describe-images --repository-name "$REPO" --image-ids imageTag="$TAG" > /dev/null 2>&1; then
    echo "Image ${TAG} already exists, skipping the push"
  else
    docker buildx build --platform linux/arm64 --provenance=false -t "$image" --push backend
  fi

  local tmp
  tmp=$(mktemp -d)
  aws ecs describe-task-definition --task-definition "$SERVICE" --query taskDefinition --output json > "${tmp}/td.json"
  python3 - "$image" "${tmp}/td.json" "${tmp}/new-td.json" <<'PY'
import json, sys
image, src, dst = sys.argv[1:4]
td = json.load(open(src))
for key in ("taskDefinitionArn", "revision", "status", "requiresAttributes", "compatibilities", "registeredAt", "registeredBy"):
    td.pop(key, None)
td["containerDefinitions"][0]["image"] = image
json.dump(td, open(dst, "w"))
PY
  local taskdef
  taskdef=$(aws ecs register-task-definition --cli-input-json "file://${tmp}/new-td.json" --query taskDefinition.taskDefinitionArn --output text)
  echo "Registered ${taskdef}"

  echo "Running migrations"
  local net task code
  net=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --query 'services[0].networkConfiguration' --output json)
  task=$(aws ecs run-task --cluster "$CLUSTER" --task-definition "$taskdef" --launch-type FARGATE --network-configuration "$net" --overrides '{"containerOverrides":[{"name":"api","command":["alembic","upgrade","head"]}]}' --query 'tasks[0].taskArn' --output text)
  aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$task"
  code=$(aws ecs describe-tasks --cluster "$CLUSTER" --tasks "$task" --query 'tasks[0].containers[0].exitCode' --output text)
  if [ "$code" != "0" ]; then
    echo "Migration failed with exit code ${code}. Check the /ecs/${SERVICE} log group."
    exit 1
  fi

  echo "Updating the service"
  aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE" --task-definition "$taskdef" > /dev/null
  aws ecs wait services-stable --cluster "$CLUSTER" --services "$SERVICE"
  local live
  live=$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE" --query "services[0].deployments[?status=='PRIMARY'].taskDefinition | [0]" --output text)
  if [ "$live" != "$taskdef" ]; then
    echo "The deployment was rolled back to ${live}"
    exit 1
  fi
  echo "Backend deployed"
}

deploy_frontend() {
  (cd frontend && npm ci && npm run build:aws)
  aws s3 sync frontend/dist "s3://${BUCKET}" --delete --exclude "assets/*" --cache-control "no-cache"
  aws s3 sync frontend/dist/assets "s3://${BUCKET}/assets" --delete --cache-control "public,max-age=31536000,immutable"
  local dist
  dist=$(aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='jobtracker frontend and API'].Id | [0]" --output text)
  aws cloudfront create-invalidation --distribution-id "$dist" --paths "/index.html" "/favicon.svg" "/icons.svg" > /dev/null
  echo "Frontend published"
}

[ "$WHAT" = "frontend" ] || deploy_backend
[ "$WHAT" = "backend" ] || deploy_frontend
echo "Done"
