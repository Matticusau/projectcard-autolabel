# Project Cards notes

## GitHub API references

### Pulls data structure

Pull requests in draft will have this payload
```json
{
    "number": 123,
    ...
    "draft": false,
    ...
}
```

For a PR **waiting on Code Review** it will have this webhook payload

```json
{
    "number": 123,
    "state": "open",
    "locked": false,
    "title": "<<REDACTED>>",
    "requested_reviewers": [{...},{...}],
    "merged": false,
    "mergeable": true,
    "rebaseable": true,
    "mergeable_state": "blocked",
    "merged_by": null,
}
```

A PR which has been **approved by reviewers** will have this webhook payload

```json
{
    "number": 123,
    "state": "open",
    "locked": false,
    "title": "<<REDACTED>>",
    "requested_reviewers": [{...},{...}],
    "merged": false,
    "mergeable": true,
    "rebaseable": true,
    "mergeable_state": "clean",
    "merged_by": null,
}
```

A PR which has been **merged after approval** by reviewers will have this webhook payload

```json
{
    "number": 123,
    "state": "closed",
    "locked": false,
    "title": "<<REDACTED>>",
    "requested_reviewers": [{...},{...}],
    "merged": true,
    "mergeable": null,
    "rebaseable": null,
    "mergeable_state": "unknown",
    "merged_by": {...}
}
```

A PR which is **blocked by merge conflict** will have this webhook payload.
NOTE: This won't allow the actions to run if happens at first load

```json
{
    "number": 123,
    "state": "open",
    "locked": false,
    "title": "<<REDACTED>>",
    "merge_commit_sha": null,
    "requested_reviewers": [{...},{...}],
    "draft": false,
    "merged": false,
    "mergeable": false,
    "rebaseable": false,
    "mergeable_state": "dirty",
    "merged_by": null,
}
```

A PR which contains **renamed Files** will contain the following payload
This was investigated in [Issue #35](https://github.com/Matticusau/pr-helper/issues/35). Unfortunately OctoKit doesn't support the previous_filename in the payload at this time.

```json
[
    {
        "sha": "<<REDACTED>>",
        "filename": "docs/index3-rename.md",
        "status": "renamed",
        "additions": 0,
        "deletions": 0,
        "changes": 0,
        "blob_url": "https://github.com/Matticusau/pr-helper-demo/blob/3e05e6895b10c655b76a88cd8e38901fb8d834a8/docs/index3-rename.md",
        "raw_url": "https://github.com/Matticusau/pr-helper-demo/raw/3e05e6895b10c655b76a88cd8e38901fb8d834a8/docs/index3-rename.md",
        "contents_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/contents/docs/index3-rename.md?ref=3e05e6895b10c655b76a88cd8e38901fb8d834a8",
        "previous_filename": "docs/index3.md"
    }
]
```


Sample Payload

```json
{
    "payload": {
        "action": "moved",
        "changes": {
            "column_id": {
                "from": 12821424
            }
        },
        "project_card": {
            "after_id": null,
            "archived": false,
            "column_id": 12821425,
            "column_url": "https://api.github.com/projects/columns/12821425",
            "content_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/issues/23",
            "created_at": "2021-02-07T11:50:32Z",
            "creator": {
                "avatar_url": "https://avatars.githubusercontent.com/u/11083642?v=4",
                "events_url": "https://api.github.com/users/Matticusau/events{/privacy}",
                "followers_url": "https://api.github.com/users/Matticusau/followers",
                "following_url": "https://api.github.com/users/Matticusau/following{/other_user}",
                "gists_url": "https://api.github.com/users/Matticusau/gists{/gist_id}",
                "gravatar_id": "",
                "html_url": "https://github.com/Matticusau",
                "id": 11083642,
                "login": "Matticusau",
                "node_id": "MDQ6VXNlcjExMDgzNjQy",
                "organizations_url": "https://api.github.com/users/Matticusau/orgs",
                "received_events_url": "https://api.github.com/users/Matticusau/received_events",
                "repos_url": "https://api.github.com/users/Matticusau/repos",
                "site_admin": false,
                "starred_url": "https://api.github.com/users/Matticusau/starred{/owner}{/repo}",
                "subscriptions_url": "https://api.github.com/users/Matticusau/subscriptions",
                "type": "User",
                "url": "https://api.github.com/users/Matticusau"
            },
            "id": 54410237,
            "node_id": "MDExOlByb2plY3RDYXJkNTQ0MTAyMzc=",
            "note": null,
            "project_url": "https://api.github.com/projects/11613902",
            "updated_at": "2021-02-07T12:13:09Z",
            "url": "https://api.github.com/projects/columns/cards/54410237"
        },
        "repository": {
            "archive_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/{archive_format}{/ref}",
            "archived": false,
            "assignees_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/assignees{/user}",
            "blobs_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/git/blobs{/sha}",
            "branches_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/branches{/branch}",
            "clone_url": "https://github.com/Matticusau/pr-helper-demo.git",
            "collaborators_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/collaborators{/collaborator}",
            "comments_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/comments{/number}",
            "commits_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/commits{/sha}",
            "compare_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/compare/{base}...{head}",
            "contents_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/contents/{+path}",
            "contributors_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/contributors",
            "created_at": "2020-06-18T21:32:34Z",
            "default_branch": "main",
            "deployments_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/deployments",
            "description": "Repository for demo and testing of https://github.com/Matticusau/pr-helper. Experimentation of features welcomed.",
            "disabled": false,
            "downloads_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/downloads",
            "events_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/events",
            "fork": false,
            "forks": 0,
            "forks_count": 0,
            "forks_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/forks",
            "full_name": "Matticusau/pr-helper-demo",
            "git_commits_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/git/commits{/sha}",
            "git_refs_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/git/refs{/sha}",
            "git_tags_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/git/tags{/sha}",
            "git_url": "git://github.com/Matticusau/pr-helper-demo.git",
            "has_downloads": true,
            "has_issues": true,
            "has_pages": false,
            "has_projects": true,
            "has_wiki": true,
            "homepage": "",
            "hooks_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/hooks",
            "html_url": "https://github.com/Matticusau/pr-helper-demo",
            "id": 273344153,
            "issue_comment_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/issues/comments{/number}",
            "issue_events_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/issues/events{/number}",
            "issues_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/issues{/number}",
            "keys_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/keys{/key_id}",
            "labels_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/labels{/name}",
            "language": null,
            "languages_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/languages",
            "license": {
                "key": "mit",
                "name": "MIT License",
                "node_id": "MDc6TGljZW5zZTEz",
                "spdx_id": "MIT",
                "url": "https://api.github.com/licenses/mit"
            },
            "merges_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/merges",
            "milestones_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/milestones{/number}",
            "mirror_url": null,
            "name": "pr-helper-demo",
            "node_id": "MDEwOlJlcG9zaXRvcnkyNzMzNDQxNTM=",
            "notifications_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/notifications{?since,all,participating}",
            "open_issues": 2,
            "open_issues_count": 2,
            "owner": {
                "avatar_url": "https://avatars.githubusercontent.com/u/11083642?v=4",
                "events_url": "https://api.github.com/users/Matticusau/events{/privacy}",
                "followers_url": "https://api.github.com/users/Matticusau/followers",
                "following_url": "https://api.github.com/users/Matticusau/following{/other_user}",
                "gists_url": "https://api.github.com/users/Matticusau/gists{/gist_id}",
                "gravatar_id": "",
                "html_url": "https://github.com/Matticusau",
                "id": 11083642,
                "login": "Matticusau",
                "node_id": "MDQ6VXNlcjExMDgzNjQy",
                "organizations_url": "https://api.github.com/users/Matticusau/orgs",
                "received_events_url": "https://api.github.com/users/Matticusau/received_events",
                "repos_url": "https://api.github.com/users/Matticusau/repos",
                "site_admin": false,
                "starred_url": "https://api.github.com/users/Matticusau/starred{/owner}{/repo}",
                "subscriptions_url": "https://api.github.com/users/Matticusau/subscriptions",
                "type": "User",
                "url": "https://api.github.com/users/Matticusau"
            },
            "private": true,
            "pulls_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/pulls{/number}",
            "pushed_at": "2021-02-07T12:04:23Z",
            "releases_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/releases{/id}",
            "size": 51,
            "ssh_url": "git@github.com:Matticusau/pr-helper-demo.git",
            "stargazers_count": 0,
            "stargazers_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/stargazers",
            "statuses_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/statuses/{sha}",
            "subscribers_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/subscribers",
            "subscription_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/subscription",
            "svn_url": "https://github.com/Matticusau/pr-helper-demo",
            "tags_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/tags",
            "teams_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/teams",
            "trees_url": "https://api.github.com/repos/Matticusau/pr-helper-demo/git/trees{/sha}",
            "updated_at": "2021-02-07T12:04:25Z",
            "url": "https://api.github.com/repos/Matticusau/pr-helper-demo",
            "watchers": 0,
            "watchers_count": 0
        },
        "sender": {
            "avatar_url": "https://avatars.githubusercontent.com/u/11083642?v=4",
            "events_url": "https://api.github.com/users/Matticusau/events{/privacy}",
            "followers_url": "https://api.github.com/users/Matticusau/followers",
            "following_url": "https://api.github.com/users/Matticusau/following{/other_user}",
            "gists_url": "https://api.github.com/users/Matticusau/gists{/gist_id}",
            "gravatar_id": "",
            "html_url": "https://github.com/Matticusau",
            "id": 11083642,
            "login": "Matticusau",
            "node_id": "MDQ6VXNlcjExMDgzNjQy",
            "organizations_url": "https://api.github.com/users/Matticusau/orgs",
            "received_events_url": "https://api.github.com/users/Matticusau/received_events",
            "repos_url": "https://api.github.com/users/Matticusau/repos",
            "site_admin": false,
            "starred_url": "https://api.github.com/users/Matticusau/starred{/owner}{/repo}",
            "subscriptions_url": "https://api.github.com/users/Matticusau/subscriptions",
            "type": "User",
            "url": "https://api.github.com/users/Matticusau"
        }
    },
    "eventName": "project_card",
    "sha": "0afe8d9b5854f2bf5e80ae60a8981c6785cb58e8",
    "ref": "refs/heads/main",
    "workflow": "ProjectCard Auto Labels",
    "action": "Matticusauprojectcard-autolabel",
    "actor": "Matticusau"
}
```