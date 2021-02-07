//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request Merge handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-20   MLavery     Config moved back to workflow file #3
// 2020-06-25   MLavery     Added delete branch functionality #14
// 2020-07-24   MLavery     Extended merge handling for both onDemand and onSchedule [issue #24]
// 2020-09-14   MLavery     Added check for Not Found error and soft exit [issue #37]
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { IssueLabels, PRHelper, MessageHelper } from './classes';

async function prMergeHandler(core: CoreModule, github: GitHubModule, prnumber: number) {

  try {

    const messageHelper = new MessageHelper;
    
    // make sure we should proceed
    // core.debug('config.configuration.prmerge.check: ' + JSON.stringify(config.configuration.prmerge.check));
    if (core.getInput('enable-prmerge-automation') === 'true') {
      const prhelper = new PRHelper(core, github);
      // const prnumber = prhelper.getPrNumber();
      if (!prnumber) {
        core.info('Could not get pull request number from context, may not be a pull request event, exiting');
        return;
      }
      core.info(`Processing PR ${prnumber}!`);
    
      // This should be a token with access to your repository scoped in as a secret.
      // The YML workflow will need to set myToken with the GitHub Secret Token
      // myToken: ${{ secrets.GITHUB_TOKEN }}
      // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
      const myToken = core.getInput('repo-token');
      const octokit = github.getOctokit(myToken);
      
      const { data: pullRequest } = await octokit.pulls.get({
          ...github.context.repo,
          pull_number: prnumber,
      });

      // make sure we have the correct merge method from config
      prhelper.setMergeMethod(core.getInput('prmerge-method'));

      // merge the PR if criteria is met
      if (prhelper.isMergeReadyByState(pullRequest)) {
        if (await prhelper.isMergeReadyByLabel(pullRequest)) {
          if (await prhelper.isMergeReadyByChecks(pullRequest)){
            if (await prhelper.isMergeReadyByReview(pullRequest)){
              core.info(`Merged PR #${pullRequest.number}`);
              const mergeResult = await octokit.pulls.merge({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                pull_number: pullRequest.number,
                sha : pullRequest.head.sha, // safe guard no other pushes since starting action
                merge_method: prhelper.mergemethod,
              });
              core.info('Merge Result: ' + mergeResult.data.message);
              
              // delete the branch if required
              if (core.getInput('prmerge-deletebranch') === 'true' && mergeResult.data.message === 'Pull Request successfully merged') {
                if (await prhelper.isBranchDeleteReady(pullRequest)) {
                  core.info('Deleting pullRequest.head.ref: ' + pullRequest.head.ref);
                  await octokit.git.deleteRef({
                    ...github.context.repo,
                    ref: 'heads/' + pullRequest.head.ref
                  });
                }
              }
            }
          } else {
            core.info(`PR #${prnumber} not all checks have completed, merge not possible at this time`);
          }
        } else {
          core.info(`PR #${prnumber} labels do not allow merge`);
        }
      } else {
        core.info(`PR #${prnumber} is closed, no action taken`);
      }
    }
  } catch (error) {
    // check for Not Found and soft exit, this might happen when an issue comment is detected
    if (error.message === 'Not Found') {
      core.info('prMergeHandler: Could not find PR. Might be triggered from an Issue.');
      return;
    } else {
      core.setFailed(error.message);
      throw error;
    }
  }
}


// 
// OnDemand
//
export async function prMergeHandler_OnDemand(core: CoreModule, github: GitHubModule) {

  core.debug('>> prMergeHandler_OnDemand');

  try {
    // make sure we should proceed
    if (core.getInput('enable-prmerge-automation') === 'true') {

      const prhelper = new PRHelper(core, github);
      const prnumber = prhelper.getPrNumber();
      if (!prnumber) {
        core.info('Could not get pull request number from context, exiting');
        return;
      }
      // core.info(`Processing PR ${prnumber}!`)
      
      // process the pull request
      await prMergeHandler(core, github, prnumber);

    }  
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}

// 
// OnSchedule
//
export async function prMergeHandler_OnSchedule(core: CoreModule, github: GitHubModule) {

  core.debug('>> prMergeHandler_OnSchedule');

  try {
    
    // make sure we should proceed
    if (core.getInput('enable-prmerge-automation') === 'true') {

      const myToken = core.getInput('repo-token');
      const octokit = github.getOctokit(myToken);

      // list the prs
      const { data: pullRequestList } = await octokit.pulls.list({
        ...github.context.repo,
        state: 'open',
      });

      for(var iPr = 0; iPr < pullRequestList.length; iPr++){

        // process the pull request
        await prMergeHandler(core, github, pullRequestList[iPr].number);
      
      }
    }
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}