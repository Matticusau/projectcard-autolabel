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
import Interfaces from '@actions/github/lib/interfaces'

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

export interface ProjectCardWebhookPayload {
    [key: string]: any;
    repository?: Interfaces.PayloadRepository;
    issue?: {
        [key: string]: any;
        number: number;
        html_url?: string;
        body?: string;
    };
    pull_request?: {
        [key: string]: any;
        number: number;
        html_url?: string;
        body?: string;
    };
    sender?: {
        [key: string]: any;
        type: string;
    };
    action?: string;
    installation?: {
        id: number;
        [key: string]: any;
    };
    comment?: {
        id: number;
        [key: string]: any;
    };
    project_card?: {
        after_id: number;
        archived: boolean;
        column_id: number;
        column_url: string;
        content_url: string;
        created_at: string;
        creator: {
            avatar_url: string;
            events_url: string;
            followers_url: string;
            following_url: string;
            gists_url: string;
            gravatar_id: string;
            html_url: string;
            id: number;
            login: string;
            node_id: string;
            organizations_url: string;
            received_events_url: string;
            repos_url: string;
            site_admin: false,
            starred_url: string;
            subscriptions_url: string;
            type: string;
            url: string;
        },
        id: number;
        node_id: string;
        note: string;
        project_url: string;
        updated_at: string;
        url: string;
    }
}