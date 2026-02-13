# GPT-5.1-Codex-Max Notes

- Installed AWS CLI (pip user install) and verified `aws --version` (1.44.38/botocore 1.42.48).
- Configured default AWS profile with provided access key/secret, region `us-east-1`, output `json` (credentials stored in `~/.aws/credentials`, not in repo).
- Attempted `aws sts get-caller-identity` → failed with `InvalidClientTokenId` (token/keys rejected by AWS). Needs valid/active credentials to proceed.
