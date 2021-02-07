//
// Author:  Matt Lavery
// Date:    2020-06-19
// Purpose: Helpers for working with pull requests
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-22   Mlavery     Added check for Requested Changes in review #16
// 2020-06-24   MLavery     Improved logic by moving core and github to properties
// 2020-07-27   MLavery     Extended isMergeReadyByLabel() to check for qualifying label before merging [issue #28]
//
import { CoreModule, GitHubModule,Context, PullRequestPayload } from '../types';
import { IssueLabels } from './index';
import { PullsGetResponseData } from '@octokit/types/dist-types'

interface DeleteBranchConfig {
    deny?: string[];
    allow?: string[];
}

export class PRHelper {
    
    // properties
    private core: CoreModule;
    private github: GitHubModule;
    mergemethod?: 'merge' | 'squash' | 'rebase'

    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
        this.mergemethod = "merge";
    }

    setMergeMethod(method: string): void {
        if (method === 'squash') {
            this.mergemethod = 'squash';
        } else if (method === 'rebase') {
            this.mergemethod = 'rebase';
        } else {
            this.mergemethod = 'merge';
        }
    }

    getPrNumber(): number | undefined {
        var prNumber : number | undefined = undefined;
        // event will determine how we get this from the payload
        switch (this.github.context.eventName) {
            case 'issue_comment':
                const issue = this.github.context.payload.issue;
                if (issue) {
                    prNumber = issue.number;
                }
                break;
            default:
                const pullRequest = this.github.context.payload.pull_request;
                if (pullRequest) {
                    prNumber = pullRequest.number;
                } 
        }
        return prNumber;
    }

    getCommentNumber(): number | undefined {
        var commentNumber : number | undefined = undefined;
        // event will determine how we get this from the payload
        switch (this.github.context.eventName) {
            case 'issue_comment':
                const comment = this.github.context.payload.comment;
                if (comment) {
                    commentNumber = comment.id;
                }
                break;
            default:
                commentNumber = undefined;
        }
        return commentNumber;
    }

    isMergeReadyByState(pullRequest: PullsGetResponseData) : boolean {
        try {
            this.core.debug('>> isMergeReadyByState()');
            this.core.info('PR State: ' + pullRequest.state);
            this.core.info('PR merged: ' + pullRequest.merged);
            this.core.info('PR mergeable: ' + pullRequest.mergeable);
            this.core.info('PR mergeable_state: ' + pullRequest.mergeable_state);

            if (pullRequest.state !== 'closed') {
                if (pullRequest.merged === false && pullRequest.mergeable === true) {
                    // is ready to merge
                    if (pullRequest.mergeable_state === 'clean' || pullRequest.mergeable_state === 'unstable') {
                        return true;
                    }

                    // if blocked check for pending reviewers (this doesn't factor in that the review is approved or not)
                    if (pullRequest.mergeable_state === 'blocked' && (pullRequest.requested_reviewers.length === 0 && pullRequest.requested_teams.length === 0)) {
                        this.core.info(`PR #${pullRequest.number} is blocked but has no outstanding reviews`);
                        return true;
                    }

                    // allow blocked state - if branch protection is enabled the blocked state will be returned by the GitHub Actions user
                    if (pullRequest.mergeable_state === 'blocked') {
                        return true;
                    }
                }
            }
            return false;

        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    async isMergeReadyByLabel(pullRequest: PullsGetResponseData) : Promise<boolean> {
        try {
            this.core.debug('>> isMergeReadyByLabel()');

            const myToken = this.core.getInput('repo-token');
            const octokit = this.github.getOctokit(myToken);

            // check the labels
            const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
                ...this.github.context.repo,
                issue_number: pullRequest.number,
            });
            var issueLabels = new IssueLabels(issueLabelsData);
            const qualifiesForAutoMerge = (issueLabels.hasLabelFromList([this.core.getInput('prlabel-automerge')]));
            const readyToMergeLabel = (issueLabels.hasLabelFromList([this.core.getInput('prlabel-ready')]));
            const NotReadyToMergeLabel = (issueLabels.hasLabelFromList([this.core.getInput('prlabel-reviewrequired'), this.core.getInput('prlabel-onhold')]));
            
            this.core.info('qualifiesForAutoMerge: ' + qualifiesForAutoMerge);
            this.core.info('readyToMergeLabel:' + readyToMergeLabel);
            this.core.info('NotReadyToMergeLabel:' + NotReadyToMergeLabel);
            if (qualifiesForAutoMerge && readyToMergeLabel && !NotReadyToMergeLabel) {
                return true;
            }

            return false;

        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    async isMergeReadyByReview(pullRequest: PullsGetResponseData) : Promise<boolean> {
        try {
            this.core.debug('>> isMergeReadyByReview()');

            const myToken = this.core.getInput('repo-token');
            const octokit = this.github.getOctokit(myToken);
            const requiredReviewCount : Number = Number.parseInt(this.core.getInput('prmerge-requirereviewcount'));
            
            // check the labels
            const { data: reviewsData } = await octokit.pulls.listReviews({
                ...this.github.context.repo,
                pull_number: pullRequest.number,
            });

            let reviews = {
                total: reviewsData.length,
                approved: 0,
                request_changes: 0
            };
            let result : boolean = false;

            // No outstanding reviews (this doesn't check for approval vs comment so only valid if requiredReviewCount disabled)
            if (pullRequest.requested_reviewers.length === 0 && pullRequest.requested_teams.length === 0 && requiredReviewCount < 0) {
                result = true;
            }
            
            // get the number of reviews
            for(var iReview = 0; iReview < reviewsData.length; iReview++){
                if (reviewsData[iReview].state === 'APPROVED') {
                    reviews.approved++;
                } else if (reviewsData[iReview].state === 'REQUEST_CHANGES') {
                    reviews.request_changes++;
                } 
            }
            // check for reviews, and make sure no non-approved reviews
            // if (reviews.total > 0 && (reviews.total === reviews.approved) && ((requiredReviewCount >= 0 && reviews.approved >= requiredReviewCount) || requiredReviewCount < 0)) {
            if (reviews.total > 0 && (reviews.total === reviews.approved) && (requiredReviewCount >= 0 && reviews.approved >= requiredReviewCount)) {
                this.core.info(`PR #${pullRequest.number} is mergable based on reviews`);
                result = true;
            }

            // check for minimum number of required reviews (no requested changes)
            if (requiredReviewCount >= 0 && reviews.approved >= requiredReviewCount && reviews.request_changes === 0) {
                this.core.info(`PR #${pullRequest.number} is mergable based on minimum required reviews`);
                result = true;
            }
            
            return result;

        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    async isMergeReadyByChecks(pullRequest: PullsGetResponseData) : Promise<boolean> {
        try {
            this.core.debug('>> isMergeReadyByChecks()');
            
            const requireallchecks : boolean = (this.core.getInput('prmerge-requireallchecks') === 'true');

            // not configured
            if (requireallchecks !== true) {
                this.core.info('require checks is not enabled');
                return true;
            }
            
            // need all checks
            if (requireallchecks && await this.allChecksSucceeded(pullRequest)) {
                this.core.info('required checks have all succeeded');
                return true;
            }

            // failed test
            return false;

        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    async allChecksSucceeded(pullRequest: PullsGetResponseData) : Promise<boolean> {
        try {
            this.core.debug('>> allChecksPassed()');

            const myToken = this.core.getInput('repo-token');
            const octokit = this.github.getOctokit(myToken);

            // check the labels
            const { data: checksData } = await octokit.checks.listForRef({
                ...this.github.context.repo,
                ref: pullRequest.merge_commit_sha
            });

            let checks = {
                total: checksData.total_count,
                completed: 0,
                success: 0
            };

            if (checksData && checksData.check_runs.length > 0) {
                checksData.check_runs.forEach(element => {
                    if (element.status === "completed") {
                        checks.completed++;
                    }
    
                    if (element.conclusion === "success") {
                        checks.success++;
                    }
                });
            }

            return (checks.completed >= (checks.total - 1)) && (checks.success >= (checks.total - 1));

        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    private matchConfigFromActionInputYaml(json: string) : DeleteBranchConfig {
        try{
          // convert json to string array
          this.core.debug('json: ' + json);
          //let pattern : string[] = JSON.parse(json);
          let pattern : DeleteBranchConfig = JSON.parse(json);
          this.core.debug('json pattern: ' + JSON.stringify(pattern));
  
          return pattern;
        } catch (error) {
          this.core.setFailed(error.message);
          throw error;
        }
    }

    async isBranchDeleteReady(pullRequest: PullsGetResponseData) : Promise<boolean> {
        try {
            this.core.debug('>> isBranchDeleteReady()');

            if (this.core.getInput('prmerge-deletebranch') === 'true') {
                if (pullRequest.head.repo.id === pullRequest.base.repo.id) {
                    // not the default branch
                    if (pullRequest.base.repo.default_branch !== pullRequest.head.ref) {
                        const deleteBranchConfig : DeleteBranchConfig = this.matchConfigFromActionInputYaml(this.core.getInput('prmerge-deletebranch-config'));
                        // check denies
                        if (deleteBranchConfig && deleteBranchConfig.deny && deleteBranchConfig.deny.length > 0) {
                            for(let iBranch = 0; iBranch < deleteBranchConfig.deny.length; iBranch++) {
                                // this.core.info(deleteBranchConfig.deny[iBranch]);
                                if (pullRequest.head.ref === deleteBranchConfig.deny[iBranch]) {
                                    // we found a match so fail
                                    return false;
                                }
                            }
                        }
                        // check allows
                        if (deleteBranchConfig && deleteBranchConfig.allow && deleteBranchConfig.allow.length > 0) {
                            for(let iBranch = 0; iBranch < deleteBranchConfig.allow.length; iBranch++) {
                                this.core.info(deleteBranchConfig.allow[iBranch]);
                                if (pullRequest.head.ref !== deleteBranchConfig.allow[iBranch]) {
                                    // we found a non-match so fail
                                    return false;
                                }
                            }
                        }

                        // check passed
                        return true;
                    } else {
                        this.core.info('Base and Head are same branch, delete branch skipped.')
                    }
                } else {
                    this.core.info('Base and Head not on same repo, delete branch skipped.')
                }
            }
            
            // failed test
            return false;

        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    // async getChangedFiles(pullRequest: PullsGetResponseData): Promise<string[]> {
    //     this.core.debug('>> getChangedFiles()');

    //     const myToken = this.core.getInput('repo-token');
    //     const octokit = this.github.getOctokit(myToken);

    //     const listFilesResponse = await octokit.pulls.listFiles({
    //       owner: this.github.context.repo.owner,
    //       repo: this.github.context.repo.repo,
    //       pull_number: pullRequest.number
    //     });
      
    //     const changedFiles = listFilesResponse.data.map(f => f.filename);
      
    //     this.core.info('found changed files:');
    //     for (const file of changedFiles) {
    //       this.core.info('  ' + file);
    //     }
      
    //     return changedFiles;
    // }
}
