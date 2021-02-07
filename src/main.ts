//
// Author:  Matt Lavery
// Date:    2021-02-07
// Purpose: Process the actions based on event type
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { context } from '@actions/github/lib/utils';
import projectCardMoveHandler from './projectcardmovehandler';
import { CoreModule, GitHubModule } from './types';
// import { ConfigHelper } from './classes';
// import prHello from './hello'

export default async function main(core: CoreModule, github: GitHubModule) {
    // get the config
    // const config = new ConfigHelper(core, github);
    // await config.loadConfig(core, github);
    // core.debug('config loaded');
    // core.debug('config: ' + JSON.stringify(config.configuration));
    core.info('context: ' + JSON.stringify(github.context));
    
    const event = github.context.eventName
    switch (event) {
        case 'project_card':
            if (context.payload.action == 'moved') {
                await projectCardMoveHandler(core, github);
            }
    }
}
