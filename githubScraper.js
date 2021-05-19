// Requiring cheerio, request and fs modules
const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");

// Creating a global data object to store topics, projects and their issues. Will be used later to create a json file
let data = {};

//First request sent to topics page of github.
request("https://github.com/topics", callback);

//After response from first request is provided this function runs.
//This function creates a manipulationTool with the html in the response
//Then it finds the topic names and their url.
//After that it calls topicProcessor function and give them topicName and its url
function callback (error, response, html) {
    if (!error)
    {
        const manipulationTool = cheerio.load(html);

        let topicNames = manipulationTool(".f3.lh-condensed.text-center.Link--primary.mb-0.mt-1");
        let topicLinks = manipulationTool(".topic-box a");

        for (let i=0; i<topicNames.length; i++)
        {
            let topic = manipulationTool(topicNames[i]).text().trim();
            let link = "https://github.com"+manipulationTool(topicLinks[i]).attr("href");

            projectProcessor(topic, link);
        }
    }
}

//This function sends a request to a topic url and create a manipulationTool with cheerio and html provided in the response from topic page request
//Then it finds all heading where the project names are mentioned
//From those headings it gets the required project name and its url of top 5 projects, then it stores the project name in global data object
//Also it calls the function projectProcessor and passes the project url to it along with topic and project name
function projectProcessor(topic, link) {

    request(link, nextCallback);

    function nextCallback (error, response, html) {
        if (!error)
        {
            const manipulationTool = cheerio.load(html);

            let projectNames = manipulationTool("h1 a.text-bold").slice(0, 5); // will give only 5 items in the list

            for (let i=0; i<projectNames.length; i++)
            {
                let projectName = manipulationTool(projectNames[i]).text().trim();
                let projectLink = "https://github.com"+manipulationTool(projectNames[i]).attr("href");
                let projectIssuesLink = projectLink+"/issues";

                if (!data[topic])
                {
                    data[topic] = [];
                    data[topic].push({name: projectName});
                }
                else
                {
                    data[topic].push({name: projectName});
                }

                issueProcessor(topic,projectName,projectIssuesLink);
            }
        }        
    }   

}

//This function sends a request to a given project issues page by adding /issues to given project url
// Like all the above functions it also create a manipulation tool with help of response html
//Using that tool it select all the issues. Then get the top 5 issues from it. For a particular issue it fetches its heading and its url. Saves the heading and url to the appropriate project object in the global data object
//finally creates a json file after updating the global object
function issueProcessor(topic,projectName,issuesLink) {

    request(issuesLink, nextCallback);

    function nextCallback (error, response, html) {
        if (!error)
        {
            const manipulationTool = cheerio.load(html);

            let issueNames = manipulationTool(".Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title").slice(0, 5);

            //We have topicName and global data object. Using which we find the array in global data object corresponding to topicName. This array will containe 5 project objects. Now in this function we need to update 1 of those 5 project objects with its issues.
            //To do so we need to find which project object needs updating in the extracted array above.
            // So we create a variable called index and make it equal to -1.
            //Then we loop in a topic array and match the name inside project objects with the projectName given to this function in arguments. Once both values matches we store the matched object position using index variable.
            // Then  we use this index together with topic array to insert the issues in the required project object.


            //data[topicName]  => this is topic array 
            //data[topicName][index] => this is project object whose issues we are scrapping
            //data[topicName][index].issues => here we are accessing issues key in a project object, which is an element in topic array

            let index = -1;
            for (let j=0; j<data[topic].length; j++)
            {
                if (data[topic][j].name == projectName)
                {
                    index = j;
                    break;
                }
            }
            
            for (let i=0; i<issueNames.length; i++)
            {
                let issueLink = "https://github.com"+manipulationTool(issueNames[i]).attr("href");
                let issueName = manipulationTool(issueNames[i]).text();
                
                if (!data[topic][index].issues)
                {
                    data[topic][index].issues = [];
                    data[topic][index].issues.push({issueName, issueLink});
                }
                else
                {
                    data[topic][index].issues.push({issueName, issueLink});
                }
            }
            
            fs.writeFileSync("data.json", JSON.stringify(data));

        }        
    }   

}