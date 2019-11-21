---
layout: post
title:  "Consume RESTful Web Services Using RestSharp in ASP.NET Core"
date:   2019-11-20 11:10:00 -0500
categories: dotnet core csharp
tags: rest api restsharp
comments: true
published: true
---

In my previous posts, I talked about how to create a simple **REST API Service** application in ASP.NET Core. And to test the API services, I used a Chrome plugin, called Boomerang&#xae;,  as the REST client for consuming those services. I showed how I used that client to perform GET and POST requests. In this post, instead of using a REST client like Boomerang, I will create my own **REST application** to consume web services. I will implement it in C# using **RestSharp** library. <!--more-->

RestSharp is a Http client library that you can use in ASP.NET to consume REST API services. And best of all, it simplifies daunting tasks such as **URI generation**, **XML/JSON parsing**, **serialization**, **authentication** and many more.