#!/usr/bin/env node
/**
 * Rolls the Railway service back to the last successful deployment that is not
 * the one we just shipped.
 *
 * The Railway CLI has no rollback subcommand (`redeploy` re-runs the *latest*
 * deployment, which is the broken one), so this uses the public GraphQL API's
 * `deploymentRollback` mutation directly.
 *
 * Required env:
 *   RAILWAY_API_TOKEN       account or project token
 *   RAILWAY_PROJECT_ID
 *   RAILWAY_SERVICE_ID
 *   RAILWAY_ENVIRONMENT_ID
 */

const API_URL = "https://backboard.railway.com/graphql/v2";

const token = process.env.RAILWAY_API_TOKEN;
const projectId = process.env.RAILWAY_PROJECT_ID;
const serviceId = process.env.RAILWAY_SERVICE_ID;
const environmentId = process.env.RAILWAY_ENVIRONMENT_ID;

const missing = Object.entries({
  RAILWAY_API_TOKEN: token,
  RAILWAY_PROJECT_ID: projectId,
  RAILWAY_SERVICE_ID: serviceId,
  RAILWAY_ENVIRONMENT_ID: environmentId
})
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`Cannot roll back — missing env: ${missing.join(", ")}`);
  process.exit(2);
}

async function graphql(query, variables) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ query, variables })
  });

  const body = await response.json();

  if (!response.ok || body.errors) {
    throw new Error(
      `Railway API error (${response.status}): ${JSON.stringify(body.errors ?? body)}`
    );
  }

  return body.data;
}

const LIST_DEPLOYMENTS = `
  query deployments($input: DeploymentListInput!, $first: Int) {
    deployments(input: $input, first: $first) {
      edges {
        node {
          id
          status
          createdAt
          canRollback
        }
      }
    }
  }
`;

const ROLLBACK = `
  mutation deploymentRollback($id: String!) {
    deploymentRollback(id: $id) {
      id
      status
    }
  }
`;

async function main() {
  const data = await graphql(LIST_DEPLOYMENTS, {
    input: { projectId, serviceId, environmentId },
    first: 20
  });

  const deployments = (data.deployments?.edges ?? []).map((edge) => edge.node);

  if (deployments.length === 0) {
    console.error("No deployments found — nothing to roll back to.");
    process.exit(1);
  }

  // Newest first. Skip index 0: that is the deployment that just failed its
  // smoke test. Roll back to the most recent one Railway says is rollback-able.
  const target = deployments
    .slice(1)
    .find((deployment) => deployment.status === "SUCCESS" && deployment.canRollback);

  if (!target) {
    console.error(
      "No previous SUCCESS deployment with canRollback:true. " +
        "Manual intervention required — the current deployment is still live."
    );
    process.exit(1);
  }

  console.log(`Rolling back to deployment ${target.id} (${target.createdAt})`);

  const result = await graphql(ROLLBACK, { id: target.id });

  console.log(
    `Rollback triggered: ${result.deploymentRollback?.id} status=${result.deploymentRollback?.status}`
  );
}

main().catch((error) => {
  console.error(`Rollback failed: ${error.message}`);
  process.exit(1);
});
