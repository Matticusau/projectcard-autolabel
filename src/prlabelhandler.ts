//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request label handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-20   MLavery     Config moved back to workflow file #3
// 2020-07-24   MLavery     Extended label handling for both onDemand and onSchedule [issue #24]
// 2020-09-14   MLavery     Allowed Auto Merge when Path Check disabled [issue #15]
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, PRFileHelper, MessageHelper, IssueLabels, GlobHelper } from './classes'; // MatchConfig

// export async function prLabelHandler(core: CoreModule, github: GitHubModule, prnumber: number) {
async function prLabelHandler(core: CoreModule, github: GitHubModule, prnumber: number) {
  try {
    const messageHelper = new MessageHelper;

    // make sure we should proceed
    if (core.getInput('enable-prlabel-automation') === 'true') {

      const prhelper = new PRHelper(core, github);
      const filehelper = new PRFileHelper(core, github);
      // const prnumber = prhelper.getPrNumber();
      if (!prnumber) {
        core.info('Could not get pull request number from context, exiting');
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
      // const { data: pullRequestReviews } = await octokit.pulls.listReviews({
      //   ...github.context.repo,
      //   pull_number: prnumber,
      // });
      
      // get the current labels
      const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
        ...github.context.repo,
        issue_number: prnumber,
      });
      var issueLabels = new IssueLabels(issueLabelsData);

      // core.debug('<< start PR payload >>');
      // core.debug(pullRequest);
      // core.debug('<< end PR payload >>');
      
      // make sure the PR is open
      if (pullRequest.state !== 'closed') {

        // make sure it hasn't merged
        if (pullRequest.merged === false) {
          if (pullRequest.mergeable === true && (pullRequest.mergeable_state === 'clean' || pullRequest.mergeable_state === 'unstable' || pullRequest.mergeable_state === 'blocked')) {
            let autoMergeQualify : boolean = false;
            // should we check the glob paths
            if (core.getInput('enable-prmerge-automation') === 'true' && core.getInput('prmerge-pathcheck') === 'true') {
              // get the changed files
              const changedFiles: string[] = await filehelper.getChangedFileNames(pullRequest);

              // check the glob paths
              let globHelper : GlobHelper = new GlobHelper(core, github);
              // let matchConfig : MatchConfig = globHelper.matchConfigFromActionInputYaml(core.getInput('prmerge-allowpaths'));
              if (globHelper.checkGlobs(changedFiles, globHelper.matchConfigFromActionInputYaml(core.getInput('prmerge-allowpaths')))) {
                autoMergeQualify = true;
              }
            } else if (core.getInput('enable-prmerge-automation') === 'true') {
              // we are processing with auto merge so need the label
              autoMergeQualify = true;
            }
            
            if (autoMergeQualify) {
              issueLabels.addLabel(core.getInput('prlabel-automerge'));
            } else {
              issueLabels.removeLabel(core.getInput('prlabel-automerge'));
            }
          } else {
            // remove the auto merge label
            issueLabels.removeLabel(core.getInput('prlabel-automerge'));
          }
          
          // check if we need reviews
          if (await prhelper.isMergeReadyByReview(pullRequest)) {
            issueLabels.removeLabel(core.getInput('prlabel-reviewrequired'));
          } else {
            issueLabels.addLabel(core.getInput('prlabel-reviewrequired'));
          }

          core.debug('issueLabels.haschanges: ' + issueLabels.haschanges);
          core.debug('issueLabels.labels: ' + JSON.stringify(issueLabels.labels));

          if (issueLabels.haschanges) {
            // set the label
            await octokit.issues.setLabels({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                issue_number: prnumber,
                labels: issueLabels.labels
            });
          }
        } else {
          core.info(`PR #${prnumber} is merged, no label automation taken`);

        }
      } else {
        core.info(`PR #${prnumber} is closed, no label automation taken`);
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
export async function prLabelHandler_OnDemand(core: CoreModule, github: GitHubModule) {

  core.debug('>> prLabelHandler_OnDemand');

  try {
    // make sure we should proceed
    if (core.getInput('enable-prlabel-automation') === 'true') {

      const prhelper = new PRHelper(core, github);
      const prnumber = prhelper.getPrNumber();
      if (!prnumber) {
        core.info('Could not get pull request number from context, exiting');
        return;
      }
      // core.info(`Processing PR ${prnumber}!`)
      
      // process the pull request
      await prLabelHandler(core, github, prnumber);

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
export async function prLabelHandler_OnSchedule(core: CoreModule, github: GitHubModule) {

  core.debug('>> prLabelHandler_OnSchedule');

  try {
    
    // make sure we should proceed
    if (core.getInput('enable-prlabel-automation') === 'true') {

      const myToken = core.getInput('repo-token');
      const octokit = github.getOctokit(myToken);

      // list the prs
      const { data: pullRequestList } = await octokit.pulls.list({
        ...github.context.repo,
        state: 'open',
      });

      for(var iPr = 0; iPr < pullRequestList.length; iPr++){

        // process the pull request
        await prLabelHandler(core, github, pullRequestList[iPr].number);
      
      }
    }
  }
  catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}