//
// Author:  Matt Lavery
// Date:    2020-07-26
// Purpose: Helper class to read a Jekyll Author YAML file used to map authors friendly names to github account names, to enhance Reviewer assignment.
//          [issue #23]
// 
// References used to build this functionality:
//          https://stackabuse.com/reading-and-writing-yaml-to-a-file-in-node-js-javascript/
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-07-27   MLavery     Added check that author element exists [issue #30]
//

import { CoreModule, GitHubModule, Context } from '../types'
import * as yaml from 'js-yaml';

// interface AuthorFile {}

export class AuthorYAMLReader {
    
    // properties
    private core: CoreModule;
    private github: GitHubModule;
    // authorFile : AuthorFile;
    authorFile: any;
    
    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
        // initialize the config
        this.authorFile = {};
    }

    async loadAuthorFile() //: Promise<Map<string, Config>> {
    {
        const authorContent: string = await this.fetchContent();
        
        if (authorContent.length > 0) {
            // loads (hopefully) a `{[label:string]: string | StringOrMatchConfig[]}`, but is `any`:
            this.core.debug('authorContent: ' + authorContent);
            const authorFileObject: any = yaml.safeLoad(authorContent);
        
            this.core.debug('authorFileObject: ' + JSON.stringify(authorFileObject));
            // transform `any` => `Map<string,StringOrMatchConfig[]>` or throw if yaml is malformed:
            // return getLabelGlobMapFromObject(authorFileObject);
            // return authorFileObject;
            
            this.authorFile = authorFileObject;
        } else {
            // set the defaults
            this.authorFile = {};
        }
    }

    // get the content from the current Pull Request context
    // TODO: Pull content from default branch or action artifacts from checkout 
    private async fetchContent(): Promise<string> {

        const authorFilePath = this.core.getInput('prreviewer-authorfilepath');
        const myToken = this.core.getInput('repo-token');
        const octokit = this.github.getOctokit(myToken);
        this.core.debug('authorFilePath: ' + authorFilePath);

        // make sure we have an author file path
        if (authorFilePath.length === 0) {
            this.core.info('No Author File path set. Defaults will be applied.');
            return '';
        } else {
            this.core.debug('getting content');
            const response: any = await octokit.repos.getContent({
                ...this.github.context.repo
                // , ref: this.github.context.sha, // removing should default to repo Default branch
                , path: authorFilePath
                , mediaType: {format: 'raw'}
            });
            this.core.debug('fetchContent response: ' + JSON.stringify(response));
            
            // for RAW media type the path is response.data not response.data.content
            return Buffer.from(response.data, response.data.encoding).toString();
        }
    }


    // get the github user name from the author definition
    async getAuthorGitHubUser(authorname: string): Promise<string> {

        let authorgithubuser = '';
        try {
            if (undefined !== authorname && authorname.length > 0) {
                if (undefined !== this.authorFile[authorname]) {
                    // this.core.info('this.authorFile: ' + JSON.stringify(this.authorFile));
                    // this.core.info('this.authorFile[authorname]: ' + JSON.stringify(this.authorFile[authorname]));
                    if (undefined !== this.authorFile[authorname].github && this.authorFile[authorname].github.length > 0) {
                        authorgithubuser = this.authorFile[authorname].github;
                        this.core.debug('getAuthorGitHubUser [' + authorname + '] = [' + authorgithubuser + ']');
                    } else {
                        this.core.info('getAuthorGitHubUser no github key defined for author [' + authorname + ']');
                    }
                } else {
                    this.core.info('getAuthorGitHubUser no author configured in the author file for [' + authorname + ']');
                }
            } else {
                this.core.info('getAuthorGitHubUser no authorname param supplied');
            }
            return authorgithubuser;
        } catch (error) {
            this.core.info('getAuthorGitHubUser error: ' + error.message);
            throw error;
        }
    }

}
