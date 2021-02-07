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

        var projectCardWebhookPayload: ProjectCardWebhookPayload = github.context.payload;
        // make sure this is an issue and not a note
        if (undefined !== projectCardWebhookPayload.project_card && undefined !== projectCardWebhookPayload.project_card.content_url) {
            core.info('content_url is defined');
            core.info('column_id: ' + projectCardWebhookPayload.project_card.column_id.toString());
            
            // get the issue number
            let issueContentUrl: string = projectCardWebhookPayload.project_card.content_url;
            let issueNumber: number = 0;
            if (issueContentUrl.indexOf('/issues/') > 0) {
                issueContentUrl = issueContentUrl.substring(issueContentUrl.indexOf('/issues/') + 8)
                core.info('issueContentUrl: ' + issueContentUrl);
                issueNumber = parseInt(issueContentUrl);
            }            

            // get the issue details
            const myToken = core.getInput('repo-token');
            const octokit = github.getOctokit(myToken);
            const { data: issueResponseData } = await octokit.issues.get({
                ...github.context.repo,
                issue_number: issueNumber,
            });
            core.info('issueResponseData: ' + JSON.stringify(issueResponseData));

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
