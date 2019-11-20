---
layout: post
title:  "Six Git Commands I Use to Push Code For the First Time To Github on Windows"
date:   2019-11-20 10:10:00 -0500
categories: git
tags: git github
comments: true
published: true
---

Depending on your situation, or what you are trying to do, there are probably a dozen ways to push your source code for for the first time to Github. But I'm these six git commands are the only ones I use. <!--more-->

My situation is a little simpler. I use Github just for my personal work. I don't really collaborate with anyone. I don't use branches. I work on the master directly. I use Windows. If this is your situation as well, then this post might help you.

### Set Up Your Environment
I assume that you have already set up your environment to use the git commands. If not, make sure you do the following first:
1. Install [Git SCM][git-scm] on your computer to enable you to use git on the command line.
2. Register at [Github][github]. Then, create an empty repository.

### The Six Commands
I run these six commands in this order:

1. git init
2. git add -A
3. git commit -m "your message"
4. git remote add origin <https://github.com/username/reponame.git>
5. git pull --rebase
6. git push -f origin master


#### git init
Initializes and prepares your directory for git. Suffice it to say that you need to open a **command prompt** or **Powershell** >> CD to your source code directory >> type **git init** and Enter. You can execute **git status** at any point in time to see where you're at in the process.

#### git add -A
Prepares **all** changes on staging. The ```-A``` means all changes are staged including edits, additions, and deletes. I do this because I don't have to think!

#### git commit -m
Commits all the changes. After commit, you are ready to push to Github.

#### git remote add origin
Associates your directory with a remote git server and repo. The URL of your repo is that URL that you see when you click the **Clone or download** button. You can execute **git remote -v** to verify that your directory has been associated with your remote repo.

#### git pull --rebase
This step is somewhat controversial. I only use this because I am pushing directly to a master, so I need to pull from the remote first before pushing. In fact, if I don't use this, it won't let me push. Some people have a way of pushing to their repo without rebasing.

#### git push -f origin master
Because I did a **pull --rebase**, I need to force or use the -f directive.

### That's it
Let me know what you think!


[git-scm]: https://git-scm.com/
[github]: https://github.com/

