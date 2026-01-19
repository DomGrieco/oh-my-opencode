<idea>
Get oh-my-opencode stable and usage process set up for using across any of my projects with easy with a documented install and set up process that's quick and easy. This is a repeatable process that try's to get to achieve a one step install process. The goal is to eventually achieve a process or "idea" described like below:

Think a barebones linux env deployed to docker with a github repo checked out for any project we want to use our opencode + plugin in. This will use default git branch unless a specific branch name is provided at build/deploy time in which it will deploy the container env with the branch (existing or new) checked out with opencode, our custom plugin, and any other dependencies installed and ready to go.

Now consider this is being managed from a web based frontend with backend system being controlled by either a human in a browser or mobile app (someday) or an agent swarm/workflow/task based on triggers.

So we have this frontend that allows us load the opencode for visibility and being able to interact with directly in the web app using opencodes client/server support.

The premise and number one goal of this idea, think MVP, is to:

Have a basic web frontend with react/typescript and a backend, maybe Go?, that handles logic.

User can open frontend and see opencodes with a workspace -> team -> project -> sessions

This is like using Linears architecture and adapting what would work well for managing agentic activities across many different workspaces which can have multiple teams and teams can have multiple projects, and in projects there are multiple workers(or sessions). Each worker/session represents an opencode session and can be connected too.

User can engage with and use/prompt these opencode sessions in web frontend.

The OC plugin memory system will have also utilize the same structure for layers of memory.

workspace -> team -> project -> sessions

If user runs an agent from a workspace, it will have memory of all the teams an their projects and sessions will also be available to read.

The same will apply on each layer (team, project, session).

Session memory will have tools to write/read short term session memory with ability for creating persisting session memory that could extend past compactions.

Each memory layer will have automated task to review new (workspace/team/project/session) memory and update their own memory.

For example, at the project scope the task could run when a session has ended and been marked complete. The project memory will analyze the session memory for any important information or memories to learn from and update its project memory accordingly.

The same above process will apply for each group of memory layers, such as workspace and team, team and project, and project and sessions.

Workspace memory should be updated the least frequently compared to session, where as session memory updates and is utilized the most. Workspace only maintains high level overall details of the entire workspace.

This allows for unique ways to engage with each memory layer, so even OC plugin agents running in a session could read project, team, or even workspace memory should it need to, allowing visibility and decision making from memory outside its scope. This could be helpful for driving better long term decisions, understanding overall project and even team goals or rules to lead better decision making when seeking clarity at a session level task.

Session memory can share with and read other session memory semantically, but not by default. This will be a special flag in read memory tool to read all or specific session memories, should it need to check other session memories but this should be rare.

This memory system is complex. Might have to consider a vector store memory and build a tool to read and access it with ease for the AI and for humans. That is why I like markdown files but I am unsure a flat file memory system like this will work? Maybe this is a usecase for using something like mongo db? idk need research on this memory system based on these requirements.

Workspaces and teams both have their own projects object.

Teams are composed of Projects and Workers/Sessions. A worker/session does not have to be assigned to a project, but always has a team.

Teams are assigned agents, tools, workflows, hooks, any additional/relevant context (maybe).

Projects inherit what teams have and additionally have can be configured to have unique configurations that diverge from their assigned team, such as a project could have less access because maybe its a research project and it only needs access to limited agents and tools to perform research.

This leads to the idea that we need to be thinking project first in our spec driven development workflow. So think team -> project -> workers. The human/trigger creates a request at the workspace/team/project level. Based on where it's triggered our system will orchestrate the request to the proper workspace/team/project. Say your at the workspace level so not in any workspace but at the layer where all the workspaces sit. You send a request saying "What PRs do I have opened and assigned to me right now in project ABC". The system agent will search projects, use commands to get all PRs assigned to the user, then respond back a list of PRs and their hyperlinks. With this logic this means from anywhere the user wants to send a request it can intelligently navigate and handle creating new workers, projects, teams, or workspaces based on the request from the user.

We want to build systems that make it easy to continue to build and extend our agentic system over time.

For instance a feature idea would be a keybind that enables a tool in the web interface to have access to some screenshot and selection tools that could enable the user to highlight or select an area in the web frontend and be able to send a request based on a screenshot of that area, application logs, whatever can be collected using web inspection tools, and send all these details with the users request to dogfood itself. It will follow our spec driven development process to create a new spec/issue and iterate through it improving itself. It would have tools for restarting itself with maybe some safety mechanisms to rollback automatically if failure detected or errors and manage context of what is going on in this building and testing and dogfooding process to improve itself based on that tool empowering the user with a keybind on their mac to just snap and request. This would be immensely powerful! AND THIS TOOL WOULD NOT BE ABLE TO EXIST WITHOUT EVERYTHING ABOVE LISTED EXISTING AND WORKING IN HARMONY.

It would be REALLY awesome if I could build this opencode harness system in a way where I piggy back off of and use Linear for a lot of the structure of this project. Since its based on linear architecture with workspace -> team -> project -> sessions, exception that linear uses "issues" not "sessions" but this divergence is intended! The reason being is that we wouldn't track actual opencode sessions inside linear. However, a linear issue would be assigned too opencode sessions. Does that make sense? We use linear to store a lot of the data for our workspaces, teams, projects and most importantly our issues, but Linear holds all the managerial data, the organizational data if you will, and then we will have our memory system described above that extends and is referenced to linear (workspace -> team -> project -> issues), so basically like a key relationship where every memory is linked to something in linear based on the memory. This is how we boot strap fast. We use linears extremely powerful API to use their system to organize our opencode harness system and then we have our memory system. Also, we could have application database for other data related to the web application and its needs for application data.
</idea>
