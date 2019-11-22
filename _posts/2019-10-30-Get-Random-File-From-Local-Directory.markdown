---
layout: post
title:  "Get Random File From Local Directory with Caching"
date:   2019-10-30 11:10:00 -0500
categories: dotnet csharp
tags: List Random DirectoryInfo Files Caching
published: false
sitemap:
  exclude: 'yes'
---

#### Project Type: Web Application, Generic Handler
#### Main Topic: HttpRuntime Cache
#### Possible application: Image Rotation

This is an extension of the [previous post][get-random-element] in which I retrieve a random element from ```List<T>```. However, this time instead of initliazing the list with strings, I will read filenames inside a given directory, and store those filenames in the list. And this time,  instead of a Console project, I will use a **Web Application** project and a **Generic Handler**(.ashx file). I will also cache the list to minimize access to file system.

Basically, this simple web app will be accessed via browser. 

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48987684272/in/album-72157711535844827/" title="handler-1"><img src="https://live.staticflickr.com/65535/48987684272_774f67f965_n.jpg" width="640" height="99" alt="handler-1"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

It wil display a random filename(see above). On refresh, it will return another random filename (see below). Because it is random, it can return the same file again.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48986928788/in/album-72157711535844827/" title="handler-2"><img src="https://live.staticflickr.com/65535/48986928788_9841c1a5ac_n.jpg" width="640" height="106" alt="handler-2"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

I set up my project in Visual Studio by creating an image folder from which I will read files from. I created 4 sub-folders called *biology, math, physics*, and *default*, as shown below.

<a data-flickr-embed="true" href="https://www.flickr.com/photos/135765356@N07/48987684252/in/album-72157711535844827/" title="handler-3"><img src="https://live.staticflickr.com/65535/48987684252_79ae9dbe7b_n.jpg" width="217" height="320" alt="handler-3"></a><script async src="//embedr.flickr.com/assets/client-code.js" charset="utf-8"></script>

For this demo, I will only show how to process the *biology* folder. Also notice other files called *DirInfoCacher.cs* and *Handler.ashx*. 


[get-random-element]: /dotnet/csharp/2019/10/30/Get-Random-Item-From-Csharp-List.html