//
// Author:  Matt Lavery
// Date:    2021-02-07
// Purpose: Class to provide functionality to auto label based on card movement
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

import { CoreModule, GitHubModule, Context, PullRequestPayload } from '../types';
import { IssueLabels } from './index';
import { PullsGetResponseData } from '@octokit/types/dist-types'

interface DeleteBranchConfig {
    deny?: string[];
    allow?: string[];
}

export class ProjectCardClass {


}
