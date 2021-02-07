# Contributions

We welcome contributions in the form of issues and pull requests.  We view the contributions and process as the same for internal and external contributors.

## Issues

Log issues for both bugs and enhancement requests.  Logging issues are important for the open community.

## Enhancements and Feature Requests

Before significant effort is put into code changes, ensure you have raised a feature request/bug via an Issue. This helps to ensure that there is not an overlap in work and that others may collaborate where interested.

## Code Contributions and Development References

### Compiling the javascript

To avoid needing to package the node_modules with the action, we have used **ncc** to compile the typescript into a single js file. A build step has been added to the package.json to facilitate this.

```json
 "scripts": {
    "build": "ncc build -o lib src/index.ts",
```

So to build the javascript package file just run

```bash
npm run-script build
```

Reference [https://help.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github](https://help.github.com/en/actions/creating-actions/creating-a-javascript-action#commit-tag-and-push-your-action-to-github)

### Releases

When time comes for a release assign a tag

```bash
git tag -a v0.1 -m "Release v0.1"
git push --follow-tags
```

The RELEASES.md should also be updated to describe the change log.

### Change Log

To generate the change log use the github-changelog-generator(https://github.com/github-changelog-generator/github-changelog-generator)

Install the gem like:

```bash
$ gem install github_changelog_generator
```

Running with CLI:

```bash
github_changelog_generator -u github_username -p github_project
```

## Related resources

These resources were referenced in the creation of this package.

- tba
