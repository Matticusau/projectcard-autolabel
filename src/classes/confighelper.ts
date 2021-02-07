//
// Author:  Matt Lavery
// Date:    2020-06-19
// Purpose: Helpers for working with configuration
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-24   MLavery     Improved logic by moving core and github to properties
//
import { CoreModule, GitHubModule, Context } from '../types'
import * as yaml from 'js-yaml';

interface Config {
    welcomemessage : {
        check : boolean,
        message : string,
    },
    prcomments : {
        check : boolean,
        prreadylabel : string,
        onholdlabel : string,
    },
    prmerge : {
        check : boolean,
        labels : {
            initiallabel : string,
            automergelabel : string,
            readytomergelabel : string,
            reviewrequiredlabel : string,
        },
        mergemethod?: 'merge' | 'squash' | 'rebase'
    }
}

export class ConfigHelper {
    
    // properties
    private core: CoreModule;
    private github: GitHubModule;
    configuration : Config;
    
    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
        // initialize the config
        this.configuration = {
            welcomemessage : { check: false, message: '' },
            prcomments : { check: false, prreadylabel: '', onholdlabel: ''},
            prmerge : { check: false, labels : { initiallabel: '', automergelabel: '', readytomergelabel: '', reviewrequiredlabel: ''}, mergemethod: 'merge' },
        };
    }

    async loadConfig() //: Promise<Map<string, Config>> {
    {
        const configurationContent: string = await this.fetchContent();
        
        if (configurationContent.length > 0) {
            // loads (hopefully) a `{[label:string]: string | StringOrMatchConfig[]}`, but is `any`:
            const configObject: any = yaml.safeLoad(configurationContent);
        
            // core.debug('configObject: ' + JSON.stringify(configObject));
            // transform `any` => `Map<string,StringOrMatchConfig[]>` or throw if yaml is malformed:
            // return getLabelGlobMapFromObject(configObject);
            // return configObject;
            
            this.configuration = configObject;
        } else {
            // set the defaults
            this.configuration = {
                welcomemessage : { 
                    check: false,
                    message: 'Thanks for opening an issue! Make sure you\'ve followed CONTRIBUTING.md.\n\nWhen you are ready mark the PR ready by commenting #pr-ready, or if you need more time comment with #pr-onhold'
                },
                prcomments : {
                    check: false,
                    prreadylabel: 'pr-ready',
                    onholdlabel: 'pr-onhold'
                },
                prmerge : {
                    check: false,
                    labels : { initiallabel: 'pr-onhold', automergelabel: 'qualifies-auto-merge', readytomergelabel: 'pr-ready', reviewrequiredlabel: 'review-required'},
                    mergemethod: 'merge'
                },
            };
        }
    }

    private async fetchContent(): Promise<string> {

        const configurationPath = this.core.getInput('configuration-path');
        const myToken = this.core.getInput('repo-token');
        const octokit = this.github.getOctokit(myToken);
        this.core.debug('configurationPath: ' + configurationPath);

        // make sure we have a config path
        if (configurationPath.length === 0) {
            this.core.info('No configuration file found. Defaults will be applied.');
            return '';
        } else {
            const response: any = await octokit.repos.getContent({
                ...this.github.context.repo,
                ref: this.github.context.sha,
                path: configurationPath,
            });
            // core.debug('fetchContent response: ' + JSON.stringify(response));
            
            return Buffer.from(response.data.content, response.data.encoding).toString();
        }
    }

}
