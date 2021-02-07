//
// Author:  Matt Lavery
// Date:    2020-06-24
// Purpose: Pull Request Reviewer helper
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-07-26   MLavery     Extended merge handling for both onDemand and onSchedule [issue #24]
// 2020-07-31   MLavery     Added check to avoid assigning PR author as reviewer [Issue #32]
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, MessageHelper, PRFileHelper } from './classes';

async function prReviewHandler(core: CoreModule, github: GitHubModule, prnumber: number) {

  try {

    // const prhelper = new PRHelper(core, github);
    const filehelper = new PRFileHelper(core, github);
    const messagehelper = new MessageHelper;
    //const prnumber = prhelper.getPrNumber();
    if (!prnumber) {
      core.info('No pull request number parameter supplied, exiting');
      return;
    }
    core.info(`Processing PR ${prnumber}!`);

    const myToken = core.getInput('repo-token');
    const octokit = github.getOctokit(myToken);

    // check if the reviewers need to be retrieved from the YAML front matter
    if (core.getInput('enable-prreviewer-frontmatter') === 'true') {
      
      const { data: pullRequest } = await octokit.pulls.get({
        ...github.context.repo,
        pull_number: prnumber,
      });

      // make sure the PR is open
      if (pullRequest.state !== 'closed') {

        core.info('PR Author: ' + pullRequest.user.login);
        
        // make sure it hasn't merged
        if (pullRequest.merged === false) {
          
          const changedFiles = await filehelper.getChangedFiles(pullRequest);
          const reviewerList : string[] = [];
          // core.info('changedFiles: ' + JSON.stringify(changedFiles));

          // load the Jekyll Author file if required
          await filehelper.prepareJekyllAuthorYAMLReader();

          // process the changed files
          if (changedFiles) {
            for(let iFile = 0; iFile < changedFiles.data.length; iFile++) {
              core.info('Processing file: ' + changedFiles.data[iFile].filename);
              const tmpReviewerList : string[] = await filehelper.getReviewerListFromFrontMatter(pullRequest, changedFiles.data[iFile]);
              // core.info('tmpReviewerList: ' + JSON.stringify(tmpReviewerList));
              tmpReviewerList.forEach(element => {
                // make sure this is not the owner of the PR
                if (pullRequest.user.login.toLowerCase() !== element.trim().toLowerCase()) {
                  reviewerList.push(element.trim());
                  core.info('Reviewer [' + element.trim() + '] added to array');
                } else {
                  core.info('Reviewer [' + element.trim() + '] skipped, PR author cannot review');
                }
              });
            }
          }

          // Add the reviewers
          //if (github.context.eventName === 'pull_request' // redundant 2020-07-26
            // && github.context.payload.action === 'opened'
            // && reviewerList.length > 0) {
            // core.info('reviewerList: ' + JSON.stringify(reviewerList));
          if (reviewerList.length > 0) {
            await octokit.pulls.requestReviewers({
              ...github.context.repo,
              pull_number: prnumber,
              reviewers: reviewerList
            });
          }
        } else {
          core.info(`PR #${prnumber} is merged, no reviewer automation taken`);
        }
      } else {
        core.info(`PR #${prnumber} is closed, no reviewer automation taken`);
      }
    }
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }

}


// 
// OnDemand
//
export async function prReviewHandler_OnDemand(core: CoreModule, github: GitHubModule) {

  core.debug('>> prReviewHandler_OnDemand');

  try {

    // check if the reviewers need to be retrieved from the YAML front matter
    if (core.getInput('enable-prreviewer-frontmatter') === 'true') {

      const prhelper = new PRHelper(core, github);
      const prnumber = prhelper.getPrNumber();
      if (!prnumber) {
        core.info('Could not get pull request number from context, exiting');
        return;
      }
      // core.info(`Processing PR ${prnumber}!`)
      
      // process the pull request
      await prReviewHandler(core, github, prnumber);

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
export async function prReviewHandler_OnSchedule(core: CoreModule, github: GitHubModule) {

  core.debug('>> prReviewHandler_OnSchedule');

  try {
    // check if the reviewers need to be retrieved from the YAML front matter
    if (core.getInput('enable-prreviewer-frontmatter') === 'true') {

      const myToken = core.getInput('repo-token');
      const octokit = github.getOctokit(myToken);

      // list the prs
      const { data: pullRequestList } = await octokit.pulls.list({
        ...github.context.repo,
        state: 'open',
      });

      for(var iPr = 0; iPr < pullRequestList.length; iPr++){

        // process the pull request
        await prReviewHandler(core, github, pullRequestList[iPr].number);
      
      }
    }
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}