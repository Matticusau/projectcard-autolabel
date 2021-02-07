//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Custom types as a bridge between our Action and official Utils/Packages
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-24   MLavery     Added PullRequestFilePayload
// 2020-09-14   MLavery     Added previous_filename [issue #35]
//

import github from '@actions/github';
import core from '@actions/core';

export type CoreModule = typeof core
export type GitHubModule = typeof github
export type Context = typeof github.context
// export type Client = github.GitHub

// export interface Config {
//     checks: {
//         welcomemessage: boolean,
//         prreviews: boolean
//     },
//     labels: {
//         readytomerge: string,
//         reviewrequired: string
//     },
//     mergemethod?: 'merge' | 'squash' | 'rebase'
// }

export interface PullRequestPayload {
    number: number
    head: {
        sha: string
    }
}

interface StatusBranch {
    name: string
    commit: { sha: string }
}

export interface StatusPayload {
    sha: string
    state: 'pending' | 'success' | 'failure' | 'error'
    branches: StatusBranch[]
}

export interface PullRequestReviewPayload {
    pull_request: {
        number: number
        head: {
            sha: string
        }
    }
}

export interface PushPayload {
    ref: string
    after: string
}

export declare type PullRequestFilePayload = {
    sha: string;
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    blob_url: string;
    raw_url: string;
    contents_url: string;
    patch: string;
    // previous_filename: string;
};