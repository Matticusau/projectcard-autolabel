//
// Author:  Matt Lavery
// Date:    2020-06-18
// Purpose: Main entry point for GitHub Action
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//

// this syntax is need to pass the objects down to childs via type injection
import * as github from '@actions/github';
import * as core from '@actions/core';
import main from './main'

main(core, github).catch((error: Error) => {
    core.info('Error: ' + error.message);
    core.setFailed(error.message);
})
