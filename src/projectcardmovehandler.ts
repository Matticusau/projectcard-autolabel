//
// Author:  Matt Lavery
// Date:    2021-02-07
// Purpose: Handler for the Project Cards event
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context, ProjectCardWebhookPayload } from './types'; // , Client
import { IssueLabels, ProjectCardClass } from './classes';
import { context } from '@actions/github/lib/utils';

// export default async function prHandler(core: CoreModule, context: Context, client: Client) { //, octokit: Client
export default async function projectCardMoveHandler(core: CoreModule, github: GitHubModule) {

    try {
        core.info('context: ' + JSON.stringify(github.context));

        const projectCardClass = new ProjectCardClass(core, github);

        // get the config
        await projectCardClass.GetProjectColumnAutoLabelConfig();

        var projectCardWebhookPayload: ProjectCardWebhookPayload = github.context.payload;
        // make sure this is an issue and not a note
        if (undefined !== projectCardWebhookPayload.project_card && undefined !== projectCardWebhookPayload.project_card.content_url) {
            core.info('content_url is defined');
            core.info('column_id: ' + projectCardWebhookPayload.project_card.column_id.toString());
            
            // octokit
            const myToken = core.getInput('repo-token');
            const octokit = github.getOctokit(myToken);
            
            // get the column details
            const { data: columnResponseData } = await octokit.projects.getColumn({
                ...github.context.repo,
                column_id: projectCardWebhookPayload.project_card.column_id
            });
            core.info('columnResponseData: ' + JSON.stringify(columnResponseData));
            core.info('column name: ' + columnResponseData.name);

            // make sure the column matches one of our rules
            if (await projectCardClass.columnHasAutoLabelConfig(columnResponseData.name)) {
                core.info('rule found for column');

                await projectCardClass.GetLabelChangesToMake(columnResponseData.name);

                // get the issue number
                let issueContentUrl: string = projectCardWebhookPayload.project_card.content_url;
                let issueNumber: number = 0;
                if (issueContentUrl.indexOf('/issues/') > 0) {
                    issueContentUrl = issueContentUrl.substring(issueContentUrl.indexOf('/issues/') + 8)
                    core.info('issueContentUrl: ' + issueContentUrl);
                    issueNumber = parseInt(issueContentUrl);
                }

                // get the issue details
                const { data: issueResponseData } = await octokit.issues.get({
                    ...github.context.repo,
                    issue_number: issueNumber,
                });
                core.info('issueResponseData: ' + JSON.stringify(issueResponseData));

                // get the issue labels
                const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
                    ...github.context.repo,
                    issue_number: issueNumber,
                });

                if (!issueLabelsData) {
                    core.error('Could not get pull request labels, exiting');
                    return;
                }

                var issueLabels = new IssueLabels(issueLabelsData);

                // update the labels
                if (undefined !== projectCardClass.labelsToRemove && projectCardClass.labelsToRemove.length > 0) {
                    core.info('labelsToRemove: ' + JSON.stringify(projectCardClass.labelsToRemove));
                    for(let iLabel = 0; iLabel < projectCardClass.labelsToRemove.length; iLabel++) {
                        issueLabels.removeLabel(projectCardClass.labelsToRemove[iLabel]);
                    }
                }
                if (undefined !== projectCardClass.labelsToAdd && projectCardClass.labelsToAdd.length > 0) {
                    core.info('labelsToAdd: ' + JSON.stringify(projectCardClass.labelsToAdd));
                    for(let iLabel = 0; iLabel < projectCardClass.labelsToAdd.length; iLabel++) {
                        issueLabels.addLabel(projectCardClass.labelsToAdd[iLabel]);
                    }
                }

                if (issueLabels.haschanges) {
                            
                    // set the label
                    await octokit.issues.setLabels({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        issue_number: issueNumber,
                        labels: issueLabels.labels
                    });
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
