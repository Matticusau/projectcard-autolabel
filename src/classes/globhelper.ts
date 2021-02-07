//
// Author:  Matt Lavery
// Date:    2020-06-22
// Purpose: Provides support for matching GLOBs
//          Some of this logic is based on the project https://github.com/actions/labeler
//
// When         Who         What
// ------------------------------------------------------------------------------------------
// 2020-06-24   MLavery     Added allall and anyall config options
//
import { CoreModule, GitHubModule,Context } from '../types';
import {Minimatch, IMinimatch} from 'minimatch';

interface MatchConfig {
    all?: string[];
    any?: string[];
    allall?: string[];
    anyall?: string[];
}

type StringOrMatchConfig = string | MatchConfig;

export class GlobHelper {
    
    // properties
    private core: CoreModule;
    private github: GitHubModule;

    constructor(core: CoreModule, github: GitHubModule) {
        this.core = core;
        this.github = github;
    }

    matchConfigFromActionInputYaml(json: string) : MatchConfig[] {
      try{
        // convert json to string array
        this.core.debug('json: ' + json);
        //let pattern : string[] = JSON.parse(json);
        let pattern : MatchConfig = JSON.parse(json);
        this.core.debug('json pattern: ' + JSON.stringify(pattern));

        // return the match config
        // return [{
        //     any: pattern
        // }];
        return [pattern];
      } catch (error) {
        this.core.setFailed(error.message);
        throw error;
      }
    }

    checkGlobs(
        changedFiles: string[],
        globs: StringOrMatchConfig[]
      ): boolean {
        for (const glob of globs) {
            this.core.debug(` checking pattern ${JSON.stringify(glob)}`);
            const matchConfig = this.toMatchConfig(glob);
            if (this.checkMatch(changedFiles, matchConfig)) {
              return true;
            }
        }
        return false;
    }

    private toMatchConfig(config: StringOrMatchConfig): MatchConfig {
        if (typeof config === "string") {
          return {
            any: [config]
          };
        }
      
        return config;
    }

    private checkMatch(changedFiles: string[], matchConfig: MatchConfig): boolean {
        if (matchConfig.all !== undefined) {
          if (!this.checkAll(changedFiles, matchConfig.all)) {
            return false;
          }
        }
      
        if (matchConfig.any !== undefined) {
          if (!this.checkAny(changedFiles, matchConfig.any)) {
            return false;
          }
        }

        if (matchConfig.anyall !== undefined) {
          if (!this.checkAnyAll(changedFiles, matchConfig.anyall)) {
            return false;
          }
        }

        if (matchConfig.allall !== undefined) {
          if (!this.checkAllAll(changedFiles, matchConfig.allall)) {
            return false;
          }
        }
      
        return true;
      }

    // equivalent to "Array.some()" but expanded for debugging and clarity
    private checkAny(changedFiles: string[], globs: string[]): boolean {
        const matchers = globs.map(g => new Minimatch(g));
        this.core.debug(`  checking "any" patterns`);
        for (const changedFile of changedFiles) {
            if (this.isMatch(changedFile, matchers)) {
                this.core.debug(`  "any" patterns matched against ${changedFile}`);
                return true;
            }
        }
  
        this.core.debug(`  "any" patterns did not match any files`);
        return false;
    }
  
    // equivalent to "Array.every()" but expanded for debugging and clarity
    private checkAll(changedFiles: string[], globs: string[]): boolean {
        const matchers = globs.map(g => new Minimatch(g));
        this.core.debug(` checking "all" patterns`);
        for (const changedFile of changedFiles) {
            if (!this.isMatch(changedFile, matchers)) {
                this.core.debug(`  "all" patterns did not match against ${changedFile}`);
                return false;
            }
        }
  
        this.core.debug(`  "all" patterns matched all files`);
        return true;
    }

    private isMatch(individualFile: string, matchers: IMinimatch[]): boolean {
      this.core.debug(` matching patterns against file ${individualFile}`);
      for (const matcher of matchers) {
        this.core.debug(`  - ${this.printPattern(matcher)}`);
        // check for a match
        if (matcher.match(individualFile)) {
          this.core.debug(`   ${this.printPattern(matcher)} matched`);
          return true;
        }
      }
    
      this.core.debug(` No patterns matched`);
      return false;
    }

    // equivalent to "Array.some()" but expanded for debugging and clarity
    private checkAnyAll(changedFiles: string[], globs: string[]): boolean {
      const matchers = globs.map(g => new Minimatch(g));
      this.core.debug(`  checking "any" patterns`);
      for (const changedFile of changedFiles) {
          if (this.isMatchAllGlobs(changedFile, matchers)) {
              this.core.debug(`  "any" patterns matched against ${changedFile}`);
              return true;
          }
      }

      this.core.debug(`  "any" patterns did not match any files`);
      return false;
    }

    // equivalent to "Array.every()" but expanded for debugging and clarity
    private checkAllAll(changedFiles: string[], globs: string[]): boolean {
      const matchers = globs.map(g => new Minimatch(g));
      this.core.debug(` checking "all" patterns`);
      for (const changedFile of changedFiles) {
          if (!this.isMatchAllGlobs(changedFile, matchers)) {
              this.core.debug(`  "all" patterns did not match against ${changedFile}`);
              return false;
          }
      }

      this.core.debug(`  "all" patterns matched all files`);
      return true;
    }

    private isMatchAllGlobs(individualFile: string, matchers: IMinimatch[]): boolean {
      this.core.debug(` matching patterns against file ${individualFile}`);
      for (const matcher of matchers) {
        this.core.debug(`  - ${this.printPattern(matcher)}`);
        // if we don't get a match then no reason continuing as ALL must match
        if (!matcher.match(individualFile)) {
          this.core.debug(`   ${this.printPattern(matcher)} did not match`);
          return false;
        }
      }
    
      this.core.debug(` all patterns matched`);
      return true;
    }

    private printPattern(matcher: IMinimatch): string {
        return (matcher.negate ? "!" : "") + matcher.pattern;
    }
}
