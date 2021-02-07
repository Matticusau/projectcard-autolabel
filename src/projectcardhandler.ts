//
// Author:  Matt Lavery
// Date:    2021-02-07
// Purpose: Handler for the Project Cards event
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context } from './types'; // , Client
import { IssueLabels, ProjectCardClass } from './classes';

// export default async function prHandler(core: CoreModule, context: Context, client: Client) { //, octokit: Client
export default async function projectCardHandler(core: CoreModule, github: GitHubModule) {

    try {
        core.info('context: ' + JSON.stringify(github.context));
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
