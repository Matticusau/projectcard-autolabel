//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request welcomer
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-20   MLavery     Config moved back to workflow file #3
// 2020-06-22   Mlavery     Fixed multiple comment message #17
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, MessageHelper } from './classes';

export default async function prWelcomeHandler(core: CoreModule, github: GitHubModule) {

  try {
    // only on new PR
    if (github.context.eventName === 'pull_request' 
        && github.context.payload.action === 'opened') {

      const prhelper = new PRHelper(core, github);
      const messagehelper = new MessageHelper;
      const prnumber = prhelper.getPrNumber();
      if (!prnumber) {
        core.info('Could not get pull request number from context, exiting');
        return;
      }
      core.info(`Processing PR ${prnumber}!`);
  
      const welcomeMessage = core.getInput('welcome-message');
      const myToken = core.getInput('repo-token');
      const octokit = github.getOctokit(myToken);

      // check if the welcome message is to be processed
      if (core.getInput('enable-welcomemessage') === 'true') {

        // check if this is a new PR
        // if (github.context.eventName === 'pull_request' && github.context.payload.action !== 'opened') {
        //   core.debug('No issue or pull request was opened, skipping');
        //   return;
        // }
        
        // add the welcome message if needed
        // check if this is a new PR
        if (github.context.eventName === 'pull_request' 
          && github.context.payload.action === 'opened'
          && welcomeMessage.length > 0) {
          
          // const octokit = github.getOctokit(myToken);
          await octokit.issues.createComment({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: prnumber,
            body: welcomeMessage
          });
        }
      }
      
      
      // check if we should add the comment automation message
      if (core.getInput('enable-prcomment-automation') === 'true') {
        
        // const octokit = github.getOctokit(myToken);
        await octokit.issues.createComment({
          owner: github.context.repo.owner,
          repo: github.context.repo.repo,
          issue_number: prnumber,
          body: messagehelper.prcommentautomationwelcome
        });
      }
    }    
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }

}


// function getPrNumber(context: Context): number | undefined {
//   const pullRequest = context.payload.pull_request;
//   if (!pullRequest) {
//     return undefined;
//   }

//   return pullRequest.number;
// }
