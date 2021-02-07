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
