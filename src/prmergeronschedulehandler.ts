//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Pull Request Merge on Schedule handler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-20   MLavery     Config moved back to workflow file #3
// 2020-07-25   MLavery     Logic has moved to prmergehandler.ts [issue #24]
//

import { CoreModule, GitHubModule, Context } from './types' // , Client
import { PRHelper, MessageHelper } from './classes';

export default async function prMergeOnScheduleHandler(core: CoreModule, github: GitHubModule) {

  try {
    
    // make sure we should proceed
    if (core.getInput('enable-prmerge-automation') === 'true') {
      
      const prhelper = new PRHelper(core, github);
      const myToken = core.getInput('repo-token');
      const octokit = github.getOctokit(myToken);

      // make sure we have the correct merge method from config
      prhelper.setMergeMethod(core.getInput('prmerge-method'));

      // list the prs
      const { data: pullRequestList } = await octokit.pulls.list({
          ...github.context.repo,
          state: 'open',
      });

      for(var iPr = 0; iPr < pullRequestList.length; iPr++){
        const { data: pullRequest } = await octokit.pulls.get({
          ...github.context.repo,
          pull_number: pullRequestList[iPr].number,
        });
        
        core.info('\n\npullRequest: ' + JSON.stringify(pullRequest));

        // merge the PR if criteria is met
        if (prhelper.isMergeReadyByState(pullRequest)) {
          if (await prhelper.isMergeReadyByLabel(pullRequest)) {
            if (await prhelper.isMergeReadyByChecks(pullRequest)){
              if (await prhelper.isMergeReadyByReview(pullRequest)){
                core.info(`Merged PR #${pullRequest.number}`);
                await octokit.pulls.merge({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    pull_number: pullRequest.number,
                    sha : pullRequest.head.sha, // safe guard no other pushes since starting action
                    merge_method: prhelper.mergemethod,
                });
              }
            } else {
              core.info(`PR #${pullRequest.number} not all checks have completed, merge not possible at this time`);
            }
          } else {
            core.info(`PR #${pullRequest.number} labels do not allow merge`);
          }
        } else {
          core.info(`PR #${pullRequest.number} state does not allow merge, no action taken`);
        }
      }
    }
  } catch (error) {
    core.setFailed(error.message);
    throw error;
  }
}
