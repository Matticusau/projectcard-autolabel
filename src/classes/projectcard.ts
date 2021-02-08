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
// autolabel-config: '[{"column":"In progress", "add_labels":["in-progress"], "remove_labels":["triage"]}]'

interface ProjectFilterConfig {
    include?: string[];
    exclude?: string[];
}
// projectfilter-config: '{"include":["*"], "exclude":[]}'
// projectfilter-config: '{"include":[123456], "exclude":[645312]}'

export class ProjectCardClass {

    // properties
    private core: CoreModule;
    private github: GitHubModule;
    private autoLabelConfig: AutoLabelConfig[];
    private projectFilterConfig: ProjectFilterConfig;
    public labelsToAdd: string[] | undefined;
    public labelsToRemove: string[] | undefined;

    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
        this.autoLabelConfig = [];
        this.projectFilterConfig = {};
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

    async GetConfig() : Promise<boolean> {
        try {
            await this.GetProjectColumnAutoLabelConfig();
            await this.GetProjectColumnFilterConfig();
            return true;
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

    async GetProjectColumnFilterConfig() : Promise<boolean> {
        try {
            this.core.debug('>> GetProjectColumnFilterConfig()');
            let pattern : ProjectFilterConfig = JSON.parse(this.core.getInput('projectfilter-config'));
            this.core.debug('json pattern: ' + JSON.stringify(pattern));
            
            this.projectFilterConfig = pattern;
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

                        // while here set the label change variables
                        this.labelsToAdd = this.autoLabelConfig[iConfig].add_labels;
                        this.labelsToRemove = this.autoLabelConfig[iConfig].remove_labels;

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

    // async GetLabelChangesToMake(columnName: string) : Promise<void> {
    //     try {
    //         if (undefined !== this.autoLabelConfig && this.autoLabelConfig.length > 0) {
    //             for(let iConfig = 0; iConfig < this.autoLabelConfig.length; iConfig++) {
    //                 if (this.autoLabelConfig[iConfig].column === columnName) {
    //                     this.labelsToAdd = this.autoLabelConfig[iConfig].add_labels;
    //                     this.labelsToRemove = this.autoLabelConfig[iConfig].remove_labels;
    //                     break;
    //                 }
    //             }
    //         }
    //     } catch (error) {
    //         this.core.setFailed(error.message);
    //         throw error;
    //     }
    // }

    getIssueNumberFromContentUrl(contentUrl: string) : number {
        try {
            let issueNumber: number = 0;
            if (contentUrl.indexOf('/issues/') > 0) {
                contentUrl = contentUrl.substring(contentUrl.indexOf('/issues/') + 8)
                //core.info('issueContentUrl: ' + issueContentUrl);
                issueNumber = parseInt(contentUrl);
            }
            return issueNumber;
        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    getProjectIdFromUrl(projectUrl: string) : number {
        try {
            let projectNumber: number = 0;
            if (projectUrl.indexOf('/issues/') > 0) {
                projectUrl = projectUrl.substring(projectUrl.indexOf('/projects/') + 10)
                //core.info('issueContentUrl: ' + issueContentUrl);
                projectNumber = parseInt(projectUrl);
            }
            return projectNumber;
        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

    async projectShouldBeProcessed(projectId: number) : Promise<boolean> {
        try {
            let blnResponse: boolean = true;
            // excluded overrides
            if (undefined !== this.projectFilterConfig.exclude && this.projectFilterConfig.exclude.length > 0) {
                for (let iExclude = 0; iExclude < this.projectFilterConfig.exclude.length; iExclude++ ) {
                    if (this.projectFilterConfig.exclude[iExclude].toString() === projectId.toString()) {
                        blnResponse = false;
                        break;
                    }
                }
            }
            // now check inclusion
            if (blnResponse) {
                // flip the response now as we must match on include
                blnResponse = false;
                // if undefined then we assume included
                if (undefined !== this.projectFilterConfig.include && this.projectFilterConfig.include.length > 0) {
                    // if we have a wild card
                    if (this.projectFilterConfig.include[0] === '*') {
                        blnResponse = true;
                    } else {
                        for (let iInclude = 0; iInclude < this.projectFilterConfig.include.length; iInclude++ ) {
                            if (this.projectFilterConfig.include[iInclude].toString() === projectId.toString()) {
                                blnResponse = true;
                                break;
                            }
                        }
                    }
                    
                }
            }
            return blnResponse;
        } catch (error) {
            this.core.setFailed(error.message);
            throw error;
        }
    }

}
