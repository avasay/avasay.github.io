---
layout: post
title:  "Windows Authentication with .NET MVC"
date:   2019-11-06 08:10:00 -0500
categories: dotnet csharp
tags: windows authentication MVC
comments: true
published: false
---

This is a demo of Windows Authentication implemented in .NET MVC and is similar to what I did for an internal site in our organization. <!--more--> 

Implementing Windows authentication can be tricky depending on your situation or what you're trying to do. To me, it was difficult at first. First off, I needed to re-implement a legacy application developed by a colleague who left the company. Secondly, the most important reason I had to re-implement is because authorized users were hard-coded in the application. Thirdly, the legacy application did not have a source code or documentation; all I had to go by was the application's DLL, and of course, talking to the users themselves. 

Oh, it was also using Forms Authentication, and we needed to move to Windows Authentication. To top it all off, online tutorials, and forums like stackexchange and stackoverflow gave me more questions than answers. 

I decided to re-implement the application from scratch, and used the de-compiled source code for guidance.

 Like I have said, your situation might be a little different than mine and you might have a more complex application than mine, but our application's requirements are fairly straightforward --- use an existing Active Directory for authentication. 
1. 
2. sds
