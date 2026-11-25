# Changesets

Each change that users will notice gets a changeset: run `npx changeset`, pick the bump (patch for
fixes, minor for features; the package is below 1.0, so breaking changes are minor too) and write
one or two sentences for the changelog. The release workflow turns the changesets into a
"chore: release" pull request; merging it publishes to npm.
