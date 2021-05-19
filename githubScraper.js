const request = require("request");
const cheerio = require("cheerio");
const fs = require("fs");
const { is } = require("cheerio/lib/api/attributes");

let data = {};

request("https://github.com/topics", callback);

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

function issueProcessor(topic,projectName,issuesLink) {

    request(issuesLink, nextCallback);

    function nextCallback (error, response, html) {
        if (!error)
        {
            const manipulationTool = cheerio.load(html);

            let index = -1;
            for (let j=0; j<data[topic].length; j++)
            {
                if (data[topic][j].name == projectName)
                {
                    index = j;
                    break;
                }
            }

            let issueNames = manipulationTool(".Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title").slice(0, 5);

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