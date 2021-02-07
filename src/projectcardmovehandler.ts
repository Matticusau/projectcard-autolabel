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
