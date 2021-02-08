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
        //core.info('context: ' + JSON.stringify(github.context));

        const projectCardClass = new ProjectCardClass(core, github);

        // get the config
        await projectCardClass.GetConfig();

        var projectCardWebhookPayload: ProjectCardWebhookPayload = github.context.payload;
        // make sure this is an issue and not a note
        if (undefined !== projectCardWebhookPayload.project_card && undefined !== projectCardWebhookPayload.project_card.content_url) {
            //core.info('content_url is defined');
            core.info('column_id: ' + projectCardWebhookPayload.project_card.column_id.toString());
            
            // octokit
            const myToken = core.getInput('repo-token');
            const octokit = github.getOctokit(myToken);
            
            // get the column details
            const { data: columnResponseData } = await octokit.projects.getColumn({
                ...github.context.repo,
                column_id: projectCardWebhookPayload.project_card.column_id
            });
            //core.info('columnResponseData: ' + JSON.stringify(columnResponseData));
            core.info('column name: ' + columnResponseData.name);

            // check this project should be processed
            let projectNumber: number = projectCardClass.getProjectIdFromUrl(projectCardWebhookPayload.project_card.project_url);
            if (await projectCardClass.projectShouldBeProcessed(projectNumber)) {

                // make sure the column matches one of our rules
                if (await projectCardClass.columnHasAutoLabelConfig(columnResponseData.name)) {
                    core.info('rule found for column');

                    // get the issue number
                    let issueContentUrl: string = projectCardWebhookPayload.project_card.content_url;
                    // let issueNumber: number = 0;
                    // if (issueContentUrl.indexOf('/issues/') > 0) {
                    //     issueContentUrl = issueContentUrl.substring(issueContentUrl.indexOf('/issues/') + 8)
                    //     //core.info('issueContentUrl: ' + issueContentUrl);
                    //     issueNumber = parseInt(issueContentUrl);
                    // }
                    let issueNumber: number = projectCardClass.getIssueNumberFromContentUrl(issueContentUrl);

                    // make sure we got the issue number
                    if (issueNumber > 0) {

                        // get the issue details
                        const { data: issueResponseData } = await octokit.issues.get({
                            ...github.context.repo,
                            issue_number: issueNumber,
                        });
                        //core.info('issueResponseData: ' + JSON.stringify(issueResponseData));

                        // get the issue labels
                        const { data: issueLabelsData } = await octokit.issues.listLabelsOnIssue({
                            ...github.context.repo,
                            issue_number: issueNumber,
                        });

                        if (!issueLabelsData) {
                            core.error('Could not get pull request labels, exiting');
                            return;
                        }

                        var issueLabels = new IssueLabels(issueLabelsData);
                        //core.info('issueLabels: ' + JSON.stringify(issueLabels));

                        // update the labels
                        //core.info('projectCardClass.labelsToRemove: ' + JSON.stringify(projectCardClass.labelsToRemove));
                        if (undefined !== projectCardClass.labelsToRemove && projectCardClass.labelsToRemove.length > 0) {
                            // core.info('processing labels to remove');
                            for(let iLabel = 0; iLabel < projectCardClass.labelsToRemove.length; iLabel++) {
                                // core.info('removing label: ' + projectCardClass.labelsToRemove[iLabel]);
                                issueLabels.removeLabel(projectCardClass.labelsToRemove[iLabel]);
                            }
                        }
                        //core.info('issueLabels: ' + JSON.stringify(issueLabels));
                        //core.info('projectCardClass.labelsToAdd: ' + JSON.stringify(projectCardClass.labelsToAdd));
                        if (undefined !== projectCardClass.labelsToAdd && projectCardClass.labelsToAdd.length > 0) {
                            // core.info('processing labels to add');
                            for(let iLabel = 0; iLabel < projectCardClass.labelsToAdd.length; iLabel++) {
                                issueLabels.addLabel(projectCardClass.labelsToAdd[iLabel]);
                            }
                        }

                        if (issueLabels.haschanges) {
                            core.info('Updating labels on Issue ' + issueNumber.toString());
                            // set the label
                            await octokit.issues.setLabels({
                                owner: github.context.repo.owner,
                                repo: github.context.repo.repo,
                                issue_number: issueNumber,
                                labels: issueLabels.labels
                            });
                        }
                    } else {
                        core.error('Could not determine Issue Number');
                    }
                } else {
                    core.info('No rules found for column');
                }
            } else {
                core.info('Project id ' + projectNumber + ' excluded by config');
            }

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
