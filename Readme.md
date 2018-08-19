# Redirect Naked Domains

This is a simple express app that redirects naked domains to the www version. If the request comes over SSL, then we use the power of SNI to quickly ask LetsEncrypt for a certificate, get and get that issued.

This works assuming that the naked domain has already been pointed to your IP address.

## Deployment

The easiest way to deploy this is to use the docker image (docker build .), and update config.yml for your environment.

Please ensure /app/acme and /tmp/acme-challenges are persisted between docker runs.

## Configuration

See the [Sample Config](/config.yml).

* This app uses s3 to store certificates and challenges. Please ensure you have the correct IAM roles configured, or you have the AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the environment.
* Email must be set to a valid email address.
* The most important configuration is `allowAllDomains`. Setting this will request certificates for any domain that is requested. However, you will be vulnerable to requests for bogus SNI certs, which will make you hit LetsEncrypt rate limits. Setting this to false means that you will need to keep deploying to add new domains.
* Settings within the domain are all optional


## Todo

Here are a list of things I'd like to do eventually

- [ ] Move the domain configuration into some sort of datastore
