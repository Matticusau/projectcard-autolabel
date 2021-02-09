[![License](https://img.shields.io/github/license/Matticusau/projectcard-autolabel.svg?style=flat-square)](LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/Matticusau/projectcard-autolabel.svg?style=flat-square)](https://github.com/heinrichreimer/action-github-changelog-generator/commits)
[![Latest tag](https://img.shields.io/github/tag/Matticusau/projectcard-autolabel.svg?style=flat-square)](https://github.com/heinrichreimer/action-github-changelog-generator/releases)
[![Issues](https://img.shields.io/github/issues/Matticusau/projectcard-autolabel.svg?style=flat-square)](https://github.com/heinrichreimer/action-github-changelog-generator/issues)
[![Pull requests](https://img.shields.io/github/issues-pr/Matticusau/projectcard-autolabel.svg?style=flat-square)](https://github.com/heinrichreimer/action-github-changelog-generator/pulls)

# projectcard-autolabel

[GitHub Action](https://github.com/features/actions) to automatically assign labels as the project card moves between columns of a project board. Very versatile with plenty of configuration settings to adapt to many different implementations.

Currently supports the following functionality:

- Automatically assign or remove labels based on Project Column a Card (issue) is moved to
- Filter project ids to include / exclude
- Filter project columns to action on

![animation](./docs/images/20210209120322.gif)

## Events

The Action can respond to the following [workflow events](https://help.github.com/en/actions/reference/events-that-trigger-workflows):

- [project_card](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#project_card)
  - moved event

## Inputs

Set the following inputs in the workflow file

### `repo-token`

**Required** The token to use for github authentication. Recommend using `${{ secrets.GITHUB_TOKEN }}`. If additional access is required use a PAT/Secret and set it as a secret. More info see [here](https://help.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token).

> If you have enabled Branch Protection rules then a PAT/Secret will need to be configured.

### `autolabel-config`

Provide the project column configuration for the auto labeling based on column name pattern matches. JSON object as string, example format [{"column":"In progress", "add_labels":["in-progress"], "remove_labels":["triage"]}].

### `projectfilter-config`

Provide the project patterns which will include/exclude projects. JSON object as string, example format {"include":["projectid"], "exclude":[]}.

## Outputs

None

## Example usage

Create the following file within your repo as `.github/workflows/projectcard-autolabel.yml` to configure an action.

```yml
name: ProjectCard Auto Labels

on:
  project_card:
    types: [moved]

jobs:
  projectcardautolabel_job:
    runs-on: ubuntu-latest
    steps:
    - name: Run ProjectCard AutoLabel
      id: runprojectcardautolabel
      uses: Matticusau/projectcard-autolabel@v1.0.0
      with:
        repo-token: ${{ secrets.GITHUB_TOKEN }}
        autolabel-config: '[{"column":"In progress", "add_labels":["in-progress"], "remove_labels":["triage"]}]'
```

> Note: The `uses` syntax includes tag/branch specification. For the latest release see [tags](https://github.com/Matticusau/projectcard-autolabel/tags).

To restrict the branches that this workflow executes on use this syntax

```yml
name: ProjectCard Auto Labels

on:
  project_card:
    types: [moved]
    branches:
      - master
jobs:
  ...
```

## Example inputs

The action can be customized using the additional inputs on the workflow yaml file. This will always be read from the default branch of the repository, rather than custom yaml config files which can be overridden as they are read in the branch where the workflow is triggered from.

```yml
with:
  repo-token: ${{ secrets.GITHUB_TOKEN }}
  autolabel-config: '[{"column":"In progress", "add_labels":["in-progress"], "remove_labels":["triage"]}]'
```

## Troubleshooting

If you are having issues running the action enable the debug logs as some additional logging has been built into the Action.

1. To enable runner diagnostic logging, set the following secret in the repository that contains the workflow: `ACTIONS_RUNNER_DEBUG` to `true`.
1. To download runner diagnostic logs, download the log archive of the workflow run. The runner diagnostic logs are contained in the `runner-diagnostic-logs` folder. For more information on downloading logs, see [Downloading logs](https://help.github.com/en/actions/configuring-and-managing-workflows/managing-a-workflow-run#downloading-logs).

[Enable debug logging](https://help.github.com/en/actions/configuring-and-managing-workflows/managing-a-workflow-run#enabling-debug-logging)

## Known issues

None known at this time
