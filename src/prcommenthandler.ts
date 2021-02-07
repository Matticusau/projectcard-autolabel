//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request Comment handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-20   MLavery     Config moved back to workflow file #3
// 2020-09-14   MLavery     Added check for Not Found error and soft exit [issue #37]
//

import { CoreModule, GitHubModule, Context } from './types'; // , Client
import { IssueLabels, PRHelper, MessageHelper } from './classes';

// export default async function prHandler(core: CoreModule, context: Context, client: Client) { //, octokit: Client
export default async function prCommentHandler(core: CoreModule, github: GitHubModule) {

    try {

        const messageHelper = new MessageHelper;

        // make sure we should proceed
        // if (config.configuration.prcomments.check === true) {
        if (core.getInput('enable-prcomment-automation') === 'true'){
        
            // core.debug('context: ' + JSON.stringify(github.context));
            const prhelper = new PRHelper(core, github);
            const issuenumber = prhelper.getPrNumber();
            if (!issuenumber) {
                core.error('Could not get issue number from context, exiting');
                return;
            }
            core.info(`Processing Issue/PR ${issuenumber}!`);

            const commentnumber = prhelper.getCommentNumber();
            if (!commentnumber) {
                core.error('Could not get comment number from context, exiting');
                return;
            }
            core.info(`Processing Comment ${commentnumber}!`);
        
            // This should be a token with access to your repository scoped in as a secret.
            // The YML workflow will need to set myToken with the GitHub Secret Token
            // myToken: ${{ secrets.GITHUB_TOKEN }}
            // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
            const myToken = core.getInput('repo-token');

            const octokit = github.getOctokit(myToken);
            // core.debug('octokit: ' + JSON.stringify(octokit));

            // check if this is a new comment
            if (github.context.payload.action === 'created') {

                // get the PR
                const { data: pullRequest } = await octokit.pulls.get({
                    ...github.context.repo,
                    pull_number: issuenumber,
                });
                
                if (!pullRequest) {
                    core.error('Could not get pull request, exiting');
                    return;
                }

                // make sure the PR is open
                if (pullRequest.state !== 'closed') {

                    // get the pr comment
                    const { data: prComment } = await octokit.issues.getComment({
                        ...github.context.repo,
                        comment_id: commentnumber,
                    });
                    // core.debug('got the pr comment');

                    const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
                        ...github.context.repo,
                        issue_number: issuenumber,
                    });

                    if (!prComment) {
                        core.error('Could not get pull request comment, exiting');
                        return;
                    }
                    if (!issueLabelsData) {
                        core.error('Could not get pull request labels, exiting');
                        return;
                    }

                    // make sure this is the same person that authored the PR
                    if (pullRequest.user.id === prComment.user.id) {

                        var issueLabels = new IssueLabels(issueLabelsData);

                        // core.debug('body: ' + prComment.body);
                        if (prComment.body.includes('#pr-ready')) {
                            // make sure the PR is mergable
                            if (pullRequest.mergeable !== true || pullRequest.mergeable_state === 'dirty') {
                                // add the comment to inform
                                await octokit.issues.createComment({
                                    owner: github.context.repo.owner,
                                    repo: github.context.repo.repo,
                                    issue_number: issuenumber,
                                    body: messageHelper.prcommentautomationdirtypr
                                });
                            } else {
                                // update the labels
                                issueLabels.removeLabel(core.getInput('prlabel-onhold'));
                                issueLabels.addLabel(core.getInput('prlabel-ready'));
                            }
                        } else if (prComment.body.includes('#pr-onhold')) {
                            issueLabels.removeLabel(core.getInput('prlabel-ready'));
                            issueLabels.addLabel(core.getInput('prlabel-onhold'));
                        }

                        core.debug('issueLabels.haschanges: ' + issueLabels.haschanges);
                        core.debug('issueLabels.labels: ' + JSON.stringify(issueLabels.labels));

                        if (issueLabels.haschanges) {
                            
                            // set the label
                            await octokit.issues.setLabels({
                                owner: github.context.repo.owner,
                                repo: github.context.repo.repo,
                                issue_number: issuenumber,
                                labels: issueLabels.labels
                            });
                        }
                    }
                }
            }
        }
    }
    catch (error) {
        // check for Not Found and soft exit, this might happen when an issue comment is detected
        if (error.message === 'Not Found') {
            core.info('prCommentHandler: Could not find PR. Might be triggered from an Issue.');
            return;
        } else {
            core.setFailed(error.message);
            throw error;
        }
    }
}
