//
// Author:  Matt Lavery
// Date:    2020-06-19
// Purpose: Helpers for working with issue labels
//
// When         Who         What
// ------------------------------------------------------------------------------------------
//
import { IssuesListLabelsOnIssueResponseData  } from '@octokit/types/dist-types'

// todo add content

export class IssueLabels {
    // array containing the labels

    labels : string[];

    // internal change tracker to decide on API calls later
    haschanges : boolean;

    constructor(issuesListLabelsOnIssueResponseData: IssuesListLabelsOnIssueResponseData) {
        this.labels = this.getIssueLabelArray(issuesListLabelsOnIssueResponseData);
        this.haschanges = false;
    }

    // add a label to the array in memory. Use octokit.issues.setLabels() to save
    addLabel(label : string) : void {
        if(label.length > 0) {
            this.labels.push(label);
            this.haschanges = true;
        }
    }

    // removes a label from the array in memory. Use octokit.issues.setLabels() to save
    removeLabel(label : string) : void {
        if(label.length > 0) {
            if (this.labels.indexOf(label) >= 0) {
                this.labels.splice(this.labels.indexOf(label), 1);
                this.haschanges = true;
            }
        }
    }

    // checks if a label is assigned from a given list (i.e. checking allow/deny lists)
    hasLabelFromList(allowDenyList : string[]) : boolean {
        const matchedList = this.labels.filter((label) => allowDenyList.includes(label))
        if (matchedList.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    private getIssueLabelArray(issueLabels : IssuesListLabelsOnIssueResponseData) : string[] {
        // var tmpArray : string[] = [];
        // for (var i=0; i < issueLabels.length; i++) {
        //     tmpArray.push(issueLabels[i].name);
        // }
        // return tmpArray;

        // convert to string array of names
        return issueLabels.map((label) => label.name);
    }

}
