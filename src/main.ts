//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Process the actions based on event type
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-20   Mlavery     Config moved back to workflow file #3
// 2020-07-24   MLavery     Extended handlers for both onDemand and onSchedule events [issue #24]
//

import prWelcomeHandler from './prwelcomehandler';
import prCommentHandler from './prcommenthandler';
import { prLabelHandler_OnDemand, prLabelHandler_OnSchedule } from './prlabelhandler';
import { prReviewHandler_OnDemand } from './prreviewerhandler';
import { prMergeHandler_OnDemand, prMergeHandler_OnSchedule } from './prmergerhandler';
import { CoreModule, GitHubModule } from './types';
// import { ConfigHelper } from './classes';
// import prHello from './hello'

export default async function main(core: CoreModule, github: GitHubModule) {
    // get the config
    // const config = new ConfigHelper(core, github);
    // await config.loadConfig(core, github);
    // core.debug('config loaded');
    // core.debug('config: ' + JSON.stringify(config.configuration));
    core.debug('context: ' + github.context);
    
    const event = github.context.eventName
    switch (event) {
        case 'pull_request':
            // await prHandler(client, github.context, config)
            await prWelcomeHandler(core, github);
            await prReviewHandler_OnDemand(core, github);
            await prLabelHandler_OnDemand(core, github);
            await prMergeHandler_OnDemand(core, github);
            break;
        // case 'status':
        //     await statusHandler(client, github.context, config)
        //     break
        case 'pull_request_review':
            await prLabelHandler_OnDemand(core, github);
            await prMergeHandler_OnDemand(core, github);
            break;
        case 'issue_comment':
            await prCommentHandler(core, github);
            await prMergeHandler_OnDemand(core, github);
            break;
        case 'schedule':
            await prLabelHandler_OnSchedule(core, github);
            await prReviewHandler_OnDemand(core, github);
            await prMergeHandler_OnSchedule(core, github);
            break;
        // case 'push':
        // //     await pushHandler(client, github.context, config)
        //     await prHello(core, github);
        //     break
    }
}
