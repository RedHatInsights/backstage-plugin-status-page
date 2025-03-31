# Deploying backstage plugins to openshift

## Usage

1. Create an openshift secrets.

```sh
# Create a secret to store backstage secret environment variables
oc apply -f encrypted-secrets.yaml
```

1. Then process and create the other resources

```sh
# Add the required chart repos
oc process -f template.yaml | oc apply -f -
```

## Important node for secrets

Openshift Secrets have been encypted using the [`paas-secret-encryption-cli`](https://gitlab.cee.redhat.com/paas/paas-encryption-cli).

If you need to modify the secrets, make sure to re-encrypt the file using the following command.

```sh
paas-secret-encryption-cli --env=preprod --tenant=one-platform < ./plain-secrets.yaml > ./encrypted-secrets.yaml
```
