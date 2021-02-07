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
import { ProjectsGetCardResponseData } from '@octokit/types/dist-types'
interface AutoLabelConfig {
    column: string;
    add_labels?: string[];
    remove_labels?: string[];
}
// autolabel-config: '[{"column":"in-progress", "add_labels":["in-progress"], "remove_labels":["triage"]}]'

export class ProjectCardClass {

    // properties
    private core: CoreModule;
    private github: GitHubModule;
    private autoLabelConfig: AutoLabelConfig[];
    public labelsToAdd: string[] | undefined;
    public labelsToRemove: string[] | undefined;

    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
        this.autoLabelConfig = [];
        this.labelsToAdd = [];
        this.labelsToRemove = [];
    }

    private matchConfigFromActionInputYaml(json: string) : AutoLabelConfig[] {
        try{
          // convert json to string array
          this.core.debug('json: ' + json);
          //let pattern : string[] = JSON.parse(json);
          let pattern : AutoLabelConfig[] = JSON.parse(json);
          this.core.debug('json pattern: ' + JSON.stringify(pattern));
  
          return pattern;
        } catch (error) {
          this.core.setFailed(error.message);
          throw error;
        }
    }

    async GetProjectColumnAutoLabelConfig() : Promise<boolean> {
        try {
            this.core.debug('>> GetProjectColumnAutoLabelConfig()');
            const autoLabelConfig : AutoLabelConfig[] = this.matchConfigFromActionInputYaml(this.core.getInput('autolabel-config'));
            
            this.autoLabelConfig = autoLabelConfig;
            return true;
        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    async columnHasAutoLabelConfig(columnName: string) : Promise<boolean> {
        try {
            let blnResponse: boolean = false;
            if (undefined !== this.autoLabelConfig && this.autoLabelConfig.length > 0) {
                for(let iConfig = 0; iConfig < this.autoLabelConfig.length; iConfig++) {
                    if (this.autoLabelConfig[iConfig].column === columnName) {
                        blnResponse = true;
                        break;
                    }
                }
            }
            return blnResponse;
        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    async GetLabelChangesToMake(columnName: string) : Promise<void> {
        try {
            if (undefined !== this.autoLabelConfig && this.autoLabelConfig.length > 0) {
                for(let iConfig = 0; iConfig < this.autoLabelConfig.length; iConfig++) {
                    if (this.autoLabelConfig[iConfig].column === columnName) {
                        this.labelsToAdd = this.autoLabelConfig[iConfig].add_labels;
                        this.labelsToRemove = this.autoLabelConfig[iConfig].remove_labels;
                        break;
                    }
                }
            }
        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

}
